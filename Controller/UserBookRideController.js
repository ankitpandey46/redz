const BaseController = require("./BaseController");
const DriverRideController= require('@/Controller/DriverRideController')
const asyncHandler = require('express-async-handler');

class UserBookRideController extends BaseController {

    static requestRide = asyncHandler(async (req, res) => {
        const { pickupLat, pickupLng } = req.body;
        const driverData = await DriverRideController.searchNearbyDrivers(pickupLat, pickupLng);
        if (!driverData) {
            return super.sendResponse(res, 200, 'success', 'No Driver available near you');
        }else{
            return super.sendResponse(res, 200, 'success', 'Driver available near you', driverData);
        }
    });

}

module.exports = UserBookRideController;