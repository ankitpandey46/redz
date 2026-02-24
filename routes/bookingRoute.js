const express = require('express');
const bookingRoute = express.Router();
const BookingController = require('@/Controller/BookingController');
const verifyToken = require('@/Middleware/memberAuth');
const multer = require('multer');
const upload = multer();

bookingRoute.post('/cancel-ride', verifyToken, upload.none(), BookingController.cancelRide);

module.exports = bookingRoute;
