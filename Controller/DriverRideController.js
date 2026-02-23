const BaseController = require("./BaseController");
const DriverRideModel = require("@/Model/DriverRideModel");
const asyncHandler = require('express-async-handler');
const { locationSchema, searchNearbySchema, completeRideSchema, acceptRideSchema } = require("../validation/driverRideValidation");
const DriverModel = require("@/Model/DriverModel");
const BookRideModel = require("@/Model/BookRideModel");
/**
 * Controller for handling driver ride-related actions
 */
class DriverRideController extends BaseController {

    static DriverOnline = asyncHandler(async (req, res) => {
        const data = req.body;
        const driverId = req.user.id;

        const { error } = locationSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendResponse(res, 400, 'error', combinedMessage);
        }

        const { lat, lng } = data;
        await DriverRideModel.goOnline(driverId, lat, lng);
        await super.redis.client.hSet(`driver:${driverId}`, {
            latitude: lat,
            longitude: lng,
            status: 'Available'
        });
        await super.redis.client.geoAdd('drivers:locations', {
            longitude: lng,
            latitude: lat,
            member: driverId.toString()
        });
        return super.sendResponse(res, 200, 'success', 'Driver is now online', {
            driverId,
            status: 'Available',
            location: { lat, lng }
        });
    });

    static DriverOffline = asyncHandler(async (req, res) => {
        const driverId = req.user.id;
        await DriverRideModel.goOffline(driverId);
        await super.redis.client.zRem('drivers:locations', driverId.toString());
        await super.redis.client.del(`driver:${driverId}`);
        return super.sendResponse(res, 200, 'success', 'Driver is now offline');
    });

    static UpdateDriverLocation = asyncHandler(async (lat, lng, driverId) => {
        await super.redis.client.geoAdd('drivers:locations', {
            longitude: lng,
            latitude: lat,
            member: driverId.toString()
        });
        await super.redis.client.hSet(`driver:${driverId}`, {
            latitude: lat,
            longitude: lng
        });
        return super.sendResponse(res, 200, 'success', 'Location updated');
    });

    static searchNearbyDrivers = asyncHandler(async (pickupLat, pickupLng) => {
        // GEO search within 5km
        const nearby = await super.redis.client.geoSearchWith(
            'drivers:locations',
            {
                longitude: parseFloat(pickupLng),
                latitude: parseFloat(pickupLat)
            },
            {
                radius: 5,
                unit: 'km'
            },
            ['WITHDIST'],
            {
                COUNT: 50
            }
        );
        if (!nearby.length) {
            return [];
        }
        const drivers = await Promise.all(
            nearby.map(async (driver) => {
                const driverId = driver.member;
                const distance = parseFloat(driver.distance);
                const driverData = await super.redis.client.hGetAll(`driver:${driverId}`);
                if (driverData.status === 'Available') {
                    const fullDriver = await DriverModel.findById(driverId);
                    return {
                        driverId,
                        distance,
                        eta: Math.ceil(distance * 3), // fake ETA logic
                        driverData: fullDriver
                    };
                }
                return null;
            })
        );
        const filteredDrivers = drivers.filter(Boolean);
        return filteredDrivers;
    });

    static completeRide = asyncHandler(async (req, res) => {
        const data = req.body;
        const driverId = req.user.id;

        // 1. Validate payload
        const { error } = completeRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendResponse(res, 400, 'error', combinedMessage);
        }

        const { rideId } = data;

        // 2. Find Ride
        const ride = await BookRideModel.getRideById(rideId);
        if (!ride) {
            return super.sendResponse(res, 404, 'error', 'Ride record not found');
        }

        // 3. Ensure Driver is the owner of this ride
        if (ride.driverId !== driverId) {
            return super.sendResponse(res, 403, 'error', 'You are not assigned to this ride');
        }

        // 4. Check if ride is already fully finished
        if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
            return super.sendResponse(res, 400, 'error', `Ride is already ${ride.status.toLowerCase()}`);
        }

        // 5. Update DB to COMPLETED
        const completedRide = await BookRideModel.completeRide(rideId);

        // 6. Alert User (Optional, if User has a socket connected, they can receive this here)
        // ... (Skipping user alert for now, strictly implementing backend db update)

        return super.sendResponse(res, 200, 'success', 'Ride completed successfully', { ride: completedRide });
    });

    static acceptRide = asyncHandler(async (req, res) => {
        const data = req.body;
        const driverId = req.user.id;

        // 1. Validate payload
        const { error } = acceptRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendResponse(res, 400, 'error', combinedMessage);
        }

        const { rideId } = data;

        // 2. Find Ride
        const ride = await BookRideModel.getRideById(rideId);
        if (!ride) {
            return super.sendResponse(res, 404, 'error', 'Ride record not found');
        }

        // 3. Ensure Driver is the owner of this ride
        if (ride.driverId !== driverId) {
            return super.sendResponse(res, 403, 'error', 'You are not assigned to this ride');
        }

        // 4. Ensure ride is strictly in REQUESTED mode
        if (ride.status !== 'REQUESTED') {
            return super.sendResponse(res, 400, 'error', `Ride is already ${ride.status.toLowerCase()}`);
        }

        // 5. Update DB to ACCEPTED
        const acceptedRide = await BookRideModel.acceptRide(rideId);

        // 6. Notify the User via WebSockets
        const userData = await super.redis.client.hGetAll(`user:${ride.userId}`);
        if (userData && userData.socketId && global.io) {
            global.io.of("/user").to(userData.socketId).emit('rideAccepted', {
                rideId: rideId,
                status: "ACCEPTED",
                driverId: driverId,
                message: "Your driver has accepted the ride!"
            });
        }

        return super.sendResponse(res, 200, 'success', 'Ride accepted successfully', { ride: acceptedRide });
    });
}

module.exports = DriverRideController;
