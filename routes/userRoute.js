const express = require('express');
const userRoute = express.Router();

const multer = require('multer');
const verifyToken = require('@/Middleware/memberAuth')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const AuthenticationController = require('@/Controller/AuthenticationController');
const UserBookRideController = require('@/Controller/UserBookRideController');

//--------------- Authenication routes--------------------------------
userRoute.post('/signup', upload.any(), AuthenticationController.signup);
userRoute.post('/send-otp', upload.none(), AuthenticationController.sendOTP);
userRoute.post('/verify-otp', upload.none(), AuthenticationController.verifyOTP);

userRoute.post('/request-ride', verifyToken, upload.none(), UserBookRideController.requestRide);





module.exports = userRoute;