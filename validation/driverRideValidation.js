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
    })
});

module.exports = {
    locationSchema,
    searchNearbySchema
};
