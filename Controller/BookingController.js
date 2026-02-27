const BaseController = require("@/Controller/BaseController");
const BookRideModel = require("@/Model/BookRideModel");
const DriverModel = require("@/Model/DriverModel");
const asyncHandler = require('express-async-handler');
const { cancelRideSchema } = require("../validation/userBookValidation");

class BookingController extends BaseController {
    static cancelRide = asyncHandler(async (req, res) => {
        const data = req.body;
        const loggedInId = req.user.id;

        const { error } = cancelRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendValidationError(res, combinedMessage);
        }

        const { rideId, cancelledBy } = data;

        const ride = await BookRideModel.getRideById(rideId);
        if (!ride) {
            return super.sendResponse(res, 404, 'error', 'Ride record not found');
        }

        const isUserCancel = ride.userId === loggedInId && cancelledBy === 'USER';
        const isDriverCancel = ride.driverId === loggedInId && cancelledBy === 'DRIVER';

        if (!isUserCancel && !isDriverCancel) {
            return super.sendResponse(res, 403, 'error', 'You are not authorized to cancel this ride');
        }

        if (ride.status === 'CANCELLED' || ride.status === 'COMPLETED') {
            return super.sendResponse(res, 400, 'error', `Ride is already ${ride.status.toLowerCase()}`);
        }

        const cancelledRide = await BookRideModel.cancelRide(rideId, cancelledBy);

        if (cancelledBy === 'USER') {
            const driverData = await super.redis.client.hGetAll(`driver:${ride.driverId}`);
            if (driverData && driverData.socketId && global.io) {
                global.io.to(driverData.socketId).emit('rideCancelled', {
                    rideId: rideId,
                    userId: ride.userId,
                    userName: ride.user.firstName + " " + ride.user.lastName,
                    userPhone: ride.user.phoneNumber,
                    userCountryCode: ride.user.countryCode,
                    userEmail: ride.user.email,
                    message: `Ride ${rideId} has been cancelled by the user.`
                });
            }
        } else {
            const userData = await super.redis.client.hGetAll(`user:${ride.userId}`);
            if (userData && userData.socketId && global.io) {
                global.io.of("/user").to(userData.socketId).emit('rideCancelled', {
                    rideId: rideId,
                    driverId: ride.driverId,
                    driverName: ride.driver.firstName + " " + ride.driver.lastName,
                    driverPhone: ride.driver.phoneNumber,
                    driverCountryCode: ride.driver.countryCode,
                    driverEmail: ride.driver.email,
                    driverProfilePic: ride.driver.profileImage,
                    message: `Your ride ${rideId} has been cancelled by the driver.`
                });
            }
        }

        await DriverModel.updateDriverStatus(ride.driverId, 'AVAILABLE');
        await super.redis.client.hSet(`driver:${ride.driverId}`, 'status', 'AVAILABLE');
        await super.redis.client.geoAdd('drivers:locations', [
            {
                longitude: ride.pickupLng,
                latitude: ride.pickupLat,
                member: ride.driverId.toString()
            }
        ]);

        return super.sendResponse(res, 200, 'success', 'Ride cancelled successfully', { ride: cancelledRide });
    });
}

module.exports = BookingController;