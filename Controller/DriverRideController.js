const BaseController = require("./BaseController");
const DriverRideModel = require("@/Model/DriverRideModel");
const asyncHandler = require('express-async-handler');
const { locationSchema, searchNearbySchema } = require("../validation/driverRideValidation");
const DriverModel = require("@/Model/DriverModel");

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
}

module.exports = DriverRideController;
