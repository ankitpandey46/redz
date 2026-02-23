const BaseController = require("./BaseController");
const DriverRideController = require('@/Controller/DriverRideController')
const asyncHandler = require('express-async-handler');

const BookRideModel = require("@/Model/BookRideModel");
const { requestRideSchema, cancelRideSchema } = require("../validation/driverRideValidation");

class UserBookRideController extends BaseController {

    static requestRide = asyncHandler(async (req, res) => {
        const { pickupLat, pickupLng } = req.body;
        const driverData = await DriverRideController.searchNearbyDrivers(pickupLat, pickupLng);
        console.log(driverData);
        if (driverData.length > 0) {
            return super.sendResponse(res, 200, 'success', 'Driver available near you', driverData);
        } else {
            return super.sendResponse(res, 200, 'success', 'No Driver available near you');
        }
    });

    static bookRide = asyncHandler(async (req, res) => {
        const data = req.body;
        const userId = req.user.id;

        const { error } = requestRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendResponse(res, 400, 'error', combinedMessage);
        }

        const { driverId, pickupLat, pickupLng, dropLat, dropLng } = data;

        const driverData = await super.redis.client.hGetAll(`driver:${driverId}`);
        if (!driverData || driverData.status !== 'Available') {
            return super.sendResponse(res, 404, 'error', 'Driver is not available');
        }

        const ride = await BookRideModel.createRide({
            userId,
            driverId,
            pickupLat,
            pickupLng,
            dropLat,
            dropLng,
            status: "REQUESTED"
        });

        const socketId = driverData.socketId;
        if (socketId && global.io) {
            global.io.to(socketId).emit('newRideRequest', {
                rideId: ride.id,
                userId: userId,
                pickupLat,
                pickupLng,
                dropLat,
                dropLng,
                status: "REQUESTED",
                message: "You have a new ride request!"
            });
        }

        return super.sendResponse(res, 200, 'success', 'Ride requested successfully', { ride });
    });

    static cancelRide = asyncHandler(async (req, res) => {
        const data = req.body;
        const userId = req.user.id;

        const { error } = cancelRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendResponse(res, 400, 'error', combinedMessage);
        }

        const { rideId, cancelledBy } = data;

        const ride = await BookRideModel.getRideById(rideId);
        if (!ride) {
            return super.sendResponse(res, 404, 'error', 'Ride record not found');
        }

        if (ride.userId !== userId) {
            return super.sendResponse(res, 403, 'error', 'You cannot cancel a ride that is not yours');
        }
        if (ride.status === 'CANCELLED' || ride.status === 'COMPLETED') {
            return super.sendResponse(res, 400, 'error', `Ride is already ${ride.status.toLowerCase()}`);
        }

        const cancelledRide = await BookRideModel.cancelRide(rideId, cancelledBy);

        const driverData = await super.redis.client.hGetAll(`driver:${ride.driverId}`);
        if (driverData && driverData.socketId && global.io) {
            global.io.to(driverData.socketId).emit('rideCancelled', {
                rideId: rideId,
                status: "CANCELLED",
                cancelledBy: cancelledBy,
                message: "The ride has been cancelled."
            });
        }

        return super.sendResponse(res, 200, 'success', 'Ride cancelled successfully', { ride: cancelledRide });
    });

}

module.exports = UserBookRideController;