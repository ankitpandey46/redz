const Joi = require('joi');

/**
 * Joi schema for driver online status and update location
 */
const locationSchema = Joi.object({
    lat: Joi.number().required().messages({
        'number.base': 'Latitude must be a number',
        'any.required': 'Latitude is required'
    }),
    lng: Joi.number().required().messages({
        'number.base': 'Longitude must be a number',
        'any.required': 'Longitude is required'
    })
});

/**
 * Joi schema for searching nearby drivers
 */
const searchNearbySchema = Joi.object({
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

/**
 * Joi schema for user requesting a specific driver
 */
const requestRideSchema = Joi.object({
    driverId: Joi.number().required().messages({
        'number.base': 'Driver ID must be a number',
        'any.required': 'Driver ID is required'
    }),
    pickupLat: Joi.number().required().messages({
        'number.base': 'Pickup latitude must be a number',
        'any.required': 'Pickup latitude is required'
    }),
    pickupLng: Joi.number().required().messages({
        'number.base': 'Pickup longitude must be a number',
        'any.required': 'Pickup longitude is required'
    }),
    dropLat: Joi.number().required().messages({
        'number.base': 'Drop latitude must be a number',
        'any.required': 'Drop latitude is required'
    }),
    dropLng: Joi.number().required().messages({
        'number.base': 'Drop longitude must be a number',
        'any.required': 'Drop longitude is required'
    })
});

/**
 * Joi schema for cancelling a ride
 */
const cancelRideSchema = Joi.object({
    rideId: Joi.number().required().messages({
        'number.base': 'Ride ID must be a number',
        'any.required': 'Ride ID is required'
    }),
    cancelledBy: Joi.string().valid('USER', 'DRIVER').required().messages({
        'any.only': 'cancelledBy must be either USER or DRIVER',
        'any.required': 'cancelledBy is required to track who cancelled the ride'
    })
});

/**
 * Joi schema for completing a ride
 */
const completeRideSchema = Joi.object({
    rideId: Joi.number().required().messages({
        'number.base': 'Ride ID must be a number',
        'any.required': 'Ride ID is required'
    })
});

/**
 * Joi schema for accepting a ride
 */
const acceptRideSchema = Joi.object({
    rideId: Joi.number().required().messages({
        'number.base': 'Ride ID must be a number',
        'any.required': 'Ride ID is required'
    })
});


module.exports = {
    locationSchema,
    searchNearbySchema,
    requestRideSchema,
    cancelRideSchema,
    completeRideSchema,
    acceptRideSchema
};
