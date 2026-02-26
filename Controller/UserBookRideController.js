const BaseController = require("@/Controller/BaseController");
const DriverRideController = require('@/Controller/DriverRideController')
const asyncHandler = require('express-async-handler');
const DriverModel = require("@/Model/DriverModel");
const UserModel = require("@/Model/UserModel");

const BookRideModel = require("@/Model/BookRideModel");
const { requestRideSchema: userRequestRideSchema } = require("@/validation/userBookValidation");
const { requestRideSchema: driverRequestRideSchema, cancelRideSchema } = require("@/validation/driverRideValidation");

class UserBookRideController extends BaseController {

    static requestRide = asyncHandler(async (req, res) => {
        const data = req.body;

        const { error } = userRequestRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendValidationError(res, combinedMessage);
        }

        const { pickupLat, pickupLng, dropLat, dropLng } = data;

        const drivers = await DriverRideController.searchNearbyDrivers(pickupLat, pickupLng, dropLat, dropLng);

        if (drivers.length > 0) {
            return super.sendResponse(res, 200, 'success', 'Drivers available near you', { data: drivers });
        } else {
            return super.sendResponse(res, 200, 'success', 'No drivers available near you');
        }
    });

    static bookRide = asyncHandler(async (req, res) => {
        const data = req.body;
        const userId = req.user.id;

        const { error } = driverRequestRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendValidationError(res, combinedMessage);
        }

        const { driverId, pickupLat, pickupLng, dropLat, dropLng } = data;

        const driverRedisData = await super.redis.client.hGetAll(`driver:${driverId}`);
        if (!driverRedisData || driverRedisData.status !== 'AVAILABLE') {
            return super.sendResponse(res, 404, 'error', 'Driver is not available');
        }

        // 1. Calculate distances and fare
        const tripDistanceKm = parseFloat(DriverRideController.calculateDistanceKm(
            parseFloat(pickupLat),
            parseFloat(pickupLng),
            parseFloat(dropLat),
            parseFloat(dropLng)
        ).toFixed(2));

        const driverDistanceKm = parseFloat(DriverRideController.calculateDistanceKm(
            parseFloat(driverRedisData.latitude),
            parseFloat(driverRedisData.longitude),
            parseFloat(pickupLat),
            parseFloat(pickupLng)
        ).toFixed(2));

        const baseFare = 2;
        const perKmRate = 3;
        const amount = Number((baseFare + tripDistanceKm * perKmRate).toFixed(2));
        const currency = "USD";

        // 2. Create Ride Record
        const ride = await BookRideModel.createRide({
            userId,
            driverId: parseInt(driverId),
            pickupLat: parseFloat(pickupLat),
            pickupLng: parseFloat(pickupLng),
            dropLat: parseFloat(dropLat),
            dropLng: parseFloat(dropLng),
            amount,
            currency,
            status: "REQUESTED"
        });

        // 3. Update Driver Status to 'Booked' (DB & Redis)
        await DriverModel.updateStatus(driverId, 'REQUESTED');
        await super.redis.client.hSet(`driver:${driverId}`, 'status', 'REQUESTED');
        await super.redis.client.zRem('drivers:locations', driverId.toString());

        const userData = await UserModel.getUserById(userId);

        const socketId = driverRedisData.socketId;
        if (socketId && global.io) {
            global.io.to(socketId).emit('newRideRequest', {
                rideId: ride.id,
                userId: userId,
                userName: userData.firstName + " " + userData.lastName,
                userPhone: userData.phone,
                userCountryCode: userData.countryCode,
                userEmail: userData.email,
                pickupLat,
                pickupLng,
                dropLat,
                dropLng,
                driverDistance: `${driverDistanceKm} km`,
                tripDistance: `${tripDistanceKm} km`,
                amount,
                currency,
                eta: `${Math.ceil(driverDistanceKm * 2)} mins`,
                status: "REQUESTED",
                message: "You have a new ride request!"
            });
        }

        return super.sendResponse(res, 200, 'success', 'Ride requested successfully', {
            ride: {
                ...ride,
                rideId: ride.id
            },
            metadata: {
                driverDistance: `${driverDistanceKm} km`,
                tripDistance: `${tripDistanceKm} km`,
                amount,
                currency,
                eta: `${Math.ceil(driverDistanceKm * 2)} mins`
            }
        });
    });

    static getMyRides = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const rides = await BookRideModel.getRidesByUserId(userId);

        const groupedRides = rides.reduce((acc, ride) => {
            const status = ride.status.toLowerCase();
            const rideWithId = { ...ride, rideId: ride.id };
            if (!acc[status]) acc[status] = [];
            acc[status].push(rideWithId);
            return acc;
        }, { requested: [], booked: [], completed: [], cancelled: [] });

        return super.sendResponse(res, 200, 'success', 'Rides fetched successfully', { data: groupedRides });
    });

}

module.exports = UserBookRideController;