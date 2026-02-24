const Joi = require('joi');

const requestRideSchema = Joi.object({
    pickupLat: Joi.number().required().messages({
        'number.base': 'Pickup latitude must be a number',
        'any.required': 'Pickup latitude is required'
    }),
    pickupLng: Joi.number().required().messages({
        'number.base': 'Pickup longitude must be a number',
        'any.required': 'Pickup longitude is required'
    }),
    dropLat: Joi.number().optional().messages({
        'number.base': 'Drop latitude must be a number'
    }),
    dropLng: Joi.number().optional().messages({
        'number.base': 'Drop longitude must be a number'
    })
});

const cancelRideSchema = Joi.object({
    rideId: Joi.number().required().messages({
        'number.base': 'Ride ID must be a number',
        'any.required': 'Ride ID is required'
    }),
    cancelledBy: Joi.string().valid('USER', 'DRIVER').required().messages({
        'any.only': 'CancelledBy must be either USER or DRIVER',
        'any.required': 'CancelledBy is required'
    })
});

module.exports = {
    requestRideSchema,
    cancelRideSchema
};
