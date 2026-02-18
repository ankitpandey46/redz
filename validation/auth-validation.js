const Joi = require('joi');

/**
 * Joi schema for user signup
 */
const signupSchema = Joi.object({
    firstName: Joi.string().required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required'
    }),
    lastName: Joi.string().required().messages({
        'string.empty': 'Last name is required',
        'any.required': 'Last name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    phoneNumber: Joi.string().length(10).pattern(/^\d+$/).required().messages({
        'string.length': 'Phone number must be exactly 10 digits',
        'string.pattern.base': 'Phone number must contain only digits',
        'string.empty': 'Phone number is required',
        'any.required': 'Phone number is required'
    }),
    countryCode: Joi.string().required().messages({
        'string.empty': 'Country code is required',
        'any.required': 'Country code is required'
    }),
    username: Joi.string().allow('', null) // Optional as it's generated internally
});

/**
 * Joi schema for OTP request
 */
const sendOTPSchema = Joi.object({
    phoneNumber: Joi.string().length(10).pattern(/^\d+$/).required().messages({
        'string.length': 'Phone number must be exactly 10 digits',
        'string.pattern.base': 'Phone number must contain only digits',
        'string.empty': 'Phone number is required',
        'any.required': 'Phone number is required'
    }),
    countryCode: Joi.string().required().messages({
        'string.empty': 'Country code is required',
        'any.required': 'Country code is required'
    })
});

/**
 * Joi schema for OTP verification
 */
const verifyOTPSchema = Joi.object({
    username: Joi.string().required().messages({
        'string.empty': 'Username is required',
        'any.required': 'Username is required'
    }),
    otp: Joi.string().length(6).required().messages({
        'string.length': 'OTP must be exactly 6 digits',
        'string.empty': 'OTP is required',
        'any.required': 'OTP is required'
    })
});

/**
 * Joi schema for driver signup
 */
const driverSignupSchema = Joi.object({
    firstName: Joi.string().required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required'
    }),
    lastName: Joi.string().required().messages({
        'string.empty': 'Last name is required',
        'any.required': 'Last name is required'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    phoneNumber: Joi.string().length(10).pattern(/^\d+$/).required().messages({
        'string.length': 'Phone number must be exactly 10 digits',
        'string.pattern.base': 'Phone number must contain only digits',
        'string.empty': 'Phone number is required',
        'any.required': 'Phone number is required'
    }),
    countryCode: Joi.string().required().messages({
        'string.empty': 'Country code is required',
        'any.required': 'Country code is required'
    }),
    nrc: Joi.string().required().messages({
        'string.empty': 'NRC is required',
        'any.required': 'NRC is required'
    }),
    vehicleMake: Joi.string().required().messages({
        'string.empty': 'Vehicle make is required',
        'any.required': 'Vehicle make is required'
    }),
    vehicleModel: Joi.string().required().messages({
        'string.empty': 'Vehicle model is required',
        'any.required': 'Vehicle model is required'
    }),
    vehiclePlate: Joi.string().required().messages({
        'string.empty': 'Vehicle plate is required',
        'any.required': 'Vehicle plate is required'
    }),
    vehicleColor: Joi.string().required().messages({
        'string.empty': 'Vehicle color is required',
        'any.required': 'Vehicle color is required'
    })
});

module.exports = {
    signupSchema,
    sendOTPSchema,
    verifyOTPSchema,
    driverSignupSchema
};
