const express = require('express');
const driverRoute = express.Router();
const multer = require('multer');
const DriverAuthController = require('@/Controller/DriverAuthController');
const DriverRideController = require('@/Controller/DriverRideController');
const verifyToken = require('@/Middleware/memberAuth');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//--------------- Driver Authentication routes--------------------------------
driverRoute.post('/signup', upload.fields([
    { name: 'nrcImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 },
    { name: 'policeClearanceImage', maxCount: 1 }
]), DriverAuthController.signup);

driverRoute.post('/send-otp', upload.none(), DriverAuthController.sendOTP);
driverRoute.post('/verify-otp', upload.none(), DriverAuthController.verifyOTP);

//--------------- Driver Ride routes--------------------------------
driverRoute.post('/go-online', verifyToken, upload.none(), DriverRideController.DriverOnline);
driverRoute.get('/go-offline', verifyToken, upload.none(), DriverRideController.DriverOffline);
// driverRoute.get('/get-available-drivers', verifyToken, DriverRideController.getAvailableDrivers);

driverRoute.post('/complete-ride', verifyToken, upload.none(), DriverRideController.completeRide);
driverRoute.post('/accept-ride', verifyToken, upload.none(), DriverRideController.acceptRide);
module.exports = driverRoute;
