const express = require('express');
const route = express.Router();

const multer = require('multer');
const verifyToken = require('../Middleware/memberAuth')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const asyncHandler = require('express-async-handler');

const AuthenticationController = require('../Controller/AuthenticationController');
const DriverAuthController = require('../Controller/DriverAuthController');


//--------------- Authenication routes--------------------------------
route.post('/login', upload.none(), AuthenticationController.loginVerify);
route.post('/signup', upload.any(), AuthenticationController.signup);
route.post('/send-otp', upload.none(), AuthenticationController.sendOTP);
route.post('/verify-otp', upload.none(), AuthenticationController.verifyOTP);

//--------------- Driver Authentication routes--------------------------------
route.post('/driver/signup', upload.fields([
    { name: 'nrcImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 },
    { name: 'policeClearanceImage', maxCount: 1 }
]), DriverAuthController.signup);

route.post('/driver/send-otp', upload.none(), DriverAuthController.sendOTP);
route.post('/driver/verify-otp', upload.none(), DriverAuthController.verifyOTP);





module.exports = route;