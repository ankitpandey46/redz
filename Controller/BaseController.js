const { uploadFiles, deleteFiles } = require('../services/imageUploader');
const pool = require('../Utils/db');
const redis = require('../Utils/redis');

class BaseController {
    static uploadFiles = uploadFiles;
    static deleteFiles = deleteFiles;
    static db = pool;
    static bucketFolder = "DEMO";
    static redis = redis;

    /**
     * Standardized JSON response method
     */
    static sendResponse(res, statusCode, status, message, data = null) {
        const response = {
            status: status,
            message: message
        };
        if (data !== null) {
            response.data = data;
        }
        return res.status(statusCode).json(response);
    }

    /**
     * Standardized Validation Error response method
     */
    static sendValidationError(res, message) {
        return res.status(200).json({
            status: "error",
            validationError: true,
            message: message
        });
    }
}

module.exports = BaseController;