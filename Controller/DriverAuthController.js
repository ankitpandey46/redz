const BaseController = require("./BaseController");
const DriverModel = require("../Model/DriverModel");
const AuthenticationModel = require("../Model/AuthenticationModel");
const { driverSignupSchema } = require("../validation/auth-validation");

class DriverAuthController extends BaseController {
    static async signup(req, res) {
        try {
            const data = req.body;
            const { error } = driverSignupSchema.validate(data, { abortEarly: false });
            if (error) {
                const combinedMessage = error.details.map(detail => detail.message).join(", ");
                return res.status(200).json({
                    status: "error",
                    validationError: true,
                    message: combinedMessage
                });
            }

            if (!req.files || !req.files.nrcImage || !req.files.selfieImage || !req.files.policeClearanceImage) {
                return res.status(200).json({
                    status: "error",
                    message: "Required images (nrcImage, selfieImage, policeClearanceImage) are missing"
                });
            }
            const files = req.files;
            const nrcUpload = await super.uploadFiles(files.nrcImage, 'drivers/nrc');
            const selfieUpload = await super.uploadFiles(files.selfieImage, 'drivers/selfie');
            const policeClearanceUpload = await super.uploadFiles(files.policeClearanceImage, 'drivers/police_clearance');

            const driverData = {
                userId: userResult.user._id,
                firstName: data.firstName,
                lastName: data.lastName,
                nrc: data.nrc,
                nrcImage: nrcUpload[0].thumbUrl,
                selfieImage: selfieUpload[0].thumbUrl,
                policeClearanceImage: policeClearanceUpload[0].thumbUrl,
                vehicleMake: data.vehicleMake,
                vehicleModel: data.vehicleModel,
                vehiclePlate: data.vehiclePlate,
                vehicleColor: data.vehicleColor
            };

            const result = await DriverModel.signup(driverData);

            if (result.error) {
                // Ideally, consider deleting the created user if driver creation fails
                return res.status(400).json({
                    status: "error",
                    message: result.error
                });
            }

            return res.status(201).json({
                status: "success",
                message: "Driver registered successfully",
                data: result.driver

            });

        } catch (error) {
            console.error('Driver signup error:', error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Internal Server Error"
            });
        }
    }

    static async sendOTP(req, res) {
        try {
            const data = req.body;
            const { sendOTPSchema } = require("../validation/auth-validation");

            const { error } = sendOTPSchema.validate(data, { abortEarly: false });
            if (error) {
                const combinedMessage = error.details.map(detail => detail.message).join(", ");
                return res.status(200).json({
                    status: "error",
                    validationError: true,
                    message: combinedMessage
                });
            }

            const { phoneNumber, countryCode } = data;

            const result = await DriverModel.requestOTP(phoneNumber, countryCode);

            if (result.error) {
                return res.status(404).json({
                    status: "error",
                    message: result.error
                });
            }

            return res.status(200).json({
                status: "success",
                message: "OTP sent successfully",
                otp: result.otp,
                username: result.username
            });
        } catch (error) {
            console.error('Driver sendOTP error:', error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Internal Server Error"
            });
        }
    }

    static async verifyOTP(req, res) {
        try {
            const data = req.body;
            const { verifyOTPSchema } = require("../validation/auth-validation");
            const jwt = require("jsonwebtoken");

            const { error } = verifyOTPSchema.validate(data, { abortEarly: false });
            if (error) {
                const combinedMessage = error.details.map(detail => detail.message).join(", ");
                return res.status(200).json({
                    status: "error",
                    validationError: true,
                    message: combinedMessage
                });
            }

            const { username, otp } = data;

            const result = await DriverModel.verifyOTP(username, otp);

            if (result.error) {
                return res.status(200).json({
                    status: "error",
                    message: result.error
                });
            }

            const { user, driver } = result;
            const token = jwt.sign(
                { email: user.email, id: user._id, driverId: driver._id },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );

            return res.status(200).json({
                status: "success",
                message: "OTP verified successfully",
                token: token,
                data: {
                    user: user,
                    driver: driver
                }
            });
        } catch (error) {
            console.error('Driver verifyOTP error:', error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Internal Server Error"
            });
        }
    }
}

module.exports = DriverAuthController;
