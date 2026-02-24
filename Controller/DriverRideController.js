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
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        await DriverRideModel.goOnline(driverId, latitude, longitude);
        await super.redis.client.hSet(`driver:${driverId}`, {
            latitude: latitude,
            longitude: longitude,
            status: 'AVAILABLE'
        });
        await super.redis.client.zRem('drivers:locations', driverId.toString());
        await super.redis.client.geoAdd('drivers:locations', {
            longitude: longitude,
            latitude: latitude,
            member: driverId.toString()
        });
        return super.sendResponse(res, 200, 'success', 'Driver is now online', {
            driverId,
            status: 'AVAILABLE',
            location: { lat: latitude, lng: longitude }
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

    static calculateDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static searchNearbyDrivers = async (pickupLat, pickupLng, dropLat, dropLng) => {

        const latitude = parseFloat(pickupLat);
        const longitude = parseFloat(pickupLng);

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error("Invalid pickup coordinates");
        }

        // 1. Calculate trip info if destination is provided
        let tripDistanceKm = 0;
        let tripAmount = 0;
        const currency = "USD";

        if (dropLat && dropLng) {
            tripDistanceKm = parseFloat(this.calculateDistanceKm(
                latitude,
                longitude,
                parseFloat(dropLat),
                parseFloat(dropLng)
            ).toFixed(2));

            const baseFare = 2;
            const perKmRate = 3;
            tripAmount = Number((baseFare + tripDistanceKm * perKmRate).toFixed(2));
        }

        // 2. Search for nearby drivers (5km radius)
        const nearby = await super.redis.client.geoSearchWith(
            'drivers:locations',
            { longitude, latitude },
            { radius: 5, unit: 'km' },
            ['WITHDIST'],
            { COUNT: 20 }
        );

        if (!nearby.length) return [];

        const uniqueNearby = [...new Map(
            nearby.map(d => [d.member, d])
        ).values()];

        const driverIds = uniqueNearby.map(d => parseInt(d.member));
        const driversFromDB = await DriverModel.findManyByIds(driverIds);

        const driverMap = {};
        driversFromDB.forEach(driver => {
            driverMap[driver.id.toString()] = driver;
        });

        const result = [];

        for (let driver of uniqueNearby) {
            const driverId = driver.member;
            const driverDistanceKm = parseFloat(driver.distance).toFixed(2);
            const driverRedisData = await super.redis.client.hGetAll(`driver:${driverId}`);

            if (driverRedisData && driverRedisData.status === 'AVAILABLE') {
                result.push({
                    driverId,
                    driverDistance: `${driverDistanceKm} km`,
                    tripDistance: tripDistanceKm > 0 ? `${tripDistanceKm} km` : null,
                    amount: tripAmount > 0 ? tripAmount : 0,
                    currency,
                    eta: `${Math.ceil(driverDistanceKm * 2)} mins`, // Average arrival time
                    driver: driverMap[driverId.toString()] || null
                });
            }
        }

        return result;
    };

    static completeRide = asyncHandler(async (req, res) => {
        const data = req.body;
        const driverId = req.user.id;

        const { error } = completeRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendResponse(res, 400, 'error', combinedMessage);
        }

        const { rideId } = data;

        const ride = await BookRideModel.getRideById(rideId);
        if (!ride) {
            return super.sendResponse(res, 404, 'error', 'Ride record not found');
        }

        if (ride.driverId !== driverId) {
            return super.sendResponse(res, 403, 'error', 'You are not assigned to this ride');
        }
        if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
            return super.sendResponse(res, 400, 'error', `Ride is already ${ride.status.toLowerCase()}`);
        }

        const completedRide = await BookRideModel.completeRide(rideId);

        await DriverModel.updateStatus(driverId, 'AVAILABLE');
        await super.redis.client.hSet(`driver:${driverId}`, 'status', 'AVAILABLE');

        await super.redis.client.geoAdd('drivers:locations', [
            {
                longitude: completedRide.dropLng,
                latitude: completedRide.dropLat,
                member: driverId.toString()
            }
        ]);

        const userData = await super.redis.client.hGetAll(`user:${ride.userId}`);
        if (userData && userData.socketId && global.io) {
            global.io.of("/user").to(userData.socketId).emit('rideCompleted', {
                rideId: completedRide.id,
                amount: completedRide.amount,
                currency: completedRide.currency,
                status: "COMPLETED",
                message: "Your ride has been completed. Thank you!"
            });
        }

        return super.sendResponse(res, 200, 'success', 'Ride completed successfully', { ride: completedRide });
    });

    static acceptRide = asyncHandler(async (req, res) => {
        const data = req.body;
        const driverId = req.user.id;

        const { error } = acceptRideSchema.validate(data, { abortEarly: false });
        if (error) {
            const combinedMessage = error.details.map(detail => detail.message).join(", ");
            return super.sendResponse(res, 400, 'error', combinedMessage);
        }

        const { rideId } = data;

        const ride = await BookRideModel.getRideById(rideId);
        if (!ride) {
            return super.sendResponse(res, 404, 'error', 'Ride record not found');
        }

        if (ride.driverId !== driverId) {
            return super.sendResponse(res, 403, 'error', 'You are not assigned to this ride');
        }

        if (ride.status !== 'REQUESTED') {
            return super.sendResponse(res, 400, 'error', `Ride is already ${ride.status.toLowerCase()}`);
        }

        const acceptedRide = await BookRideModel.acceptRide(rideId);
        await DriverModel.updateStatus(driverId, 'BOOKED');
        await super.redis.client.hSet(`driver:${driverId}`, 'status', 'BOOKED');

        const userData = await super.redis.client.hGetAll(`user:${ride.userId}`);
        if (userData && userData.socketId && global.io) {
            global.io.of("/user").to(userData.socketId).emit('rideAccepted', {
                rideId: rideId,
                status: "ACCEPTED",
                driverId: driverId,
                driverName: acceptedRide.driver.firstName + " " + acceptedRide.driver.lastName,
                driverPhone: acceptedRide.driver.phone,
                driverProfilePic: acceptedRide.driver.profilePic,
                message: "Your driver has accepted the ride!"
            });
        }

        return super.sendResponse(res, 200, 'success', 'Ride accepted successfully', { ride: acceptedRide });
    });

    static getDriverRides = asyncHandler(async (req, res) => {
        const driverId = req.user.id;
        const rides = await BookRideModel.getRidesByDriverId(driverId);

        const groupedRides = rides.reduce((acc, ride) => {
            const status = ride.status.toLowerCase();
            const rideWithId = { ...ride, rideId: ride.id };
            if (!acc[status]) acc[status] = [];
            acc[status].push(rideWithId);
            return acc;
        }, { requested: [], booked: [], completed: [], cancelled: [] });

        return super.sendResponse(res, 200, 'success', 'Driver rides fetched successfully', { data: groupedRides });
    });
}

module.exports = DriverRideController;
