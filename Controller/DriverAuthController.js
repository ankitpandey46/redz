const BaseController = require("./BaseController");
const DriverModel = require("../Model/DriverModel");
const jwt = require("jsonwebtoken");

const { driverSignupSchema, verifyOTPSchema, sendOTPSchema } = require("../validation/auth-validation");
class DriverAuthController extends BaseController {
    static async signup(req, res) {
        try {
            const data = req.body;
            const { error } = driverSignupSchema.validate(data, { abortEarly: false });
            if (error) {
                const combinedMessage = error.details.map(detail => detail.message).join(", ");
                return super.sendResponse(res, 400, 'error', combinedMessage);
            }

            if (!req.files || !req.files.nrcImage || !req.files.selfieImage || !req.files.policeClearanceImage) {
                return super.sendResponse(res, 400, 'error', "Required images (nrcImage, selfieImage, policeClearanceImage) are missing");
            }
            const files = req.files;
            const nrcUpload = await super.uploadFiles(files.nrcImage, 'drivers/nrc');
            const selfieUpload = await super.uploadFiles(files.selfieImage, 'drivers/selfie');
            const policeClearanceUpload = await super.uploadFiles(files.policeClearanceImage, 'drivers/police_clearance');

            const driverData = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                countryCode: data.countryCode,
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
                return super.sendResponse(res, 400, "error", result.error);
            }

            return super.sendResponse(res, 201, "success", "Driver registered successfully", result.driver);

        } catch (error) {
            console.error('Driver signup error:', error);
            return super.sendResponse(res, 500, "error", error.message || "Internal Server Error");
        }
    }

    static async sendOTP(req, res) {
        try {
            const data = req.body;
            const { error } = sendOTPSchema.validate(data, { abortEarly: false });
            if (error) {
                const combinedMessage = error.details.map(detail => detail.message).join(", ");
                return super.sendResponse(res, 400, 'error', combinedMessage);
            }

            const { phoneNumber, countryCode } = data;

            const result = await DriverModel.requestOTP(phoneNumber, countryCode);

            if (result.error) {
                return super.sendResponse(res, 404, "error", result.error);
            }

            return super.sendResponse(res, 200, "success", "OTP sent successfully", {
                otp: result.otp,
            });
        } catch (error) {
            console.error('Driver sendOTP error:', error);
            return super.sendResponse(res, 500, "error", error.message || "Internal Server Error");
        }
    }

    static async verifyOTP(req, res) {
        try {
            const data = req.body;
            const { error } = verifyOTPSchema.validate(data, { abortEarly: false });
            if (error) {
                const combinedMessage = error.details.map(detail => detail.message).join(", ");
                return super.sendResponse(res, 200, "error", combinedMessage);
            }

            const { otp } = data;

            const result = await DriverModel.verifyOTP(otp);

            if (result.error) {
                return super.sendResponse(res, 200, "error", result.error);
            }

            const driver = result.driver;
            const token = jwt.sign(
                { email: driver.email, id: driver._id, driverId: driver.driverId },
                process.env.JWT_SECRET,
                { expiresIn: "24h" }
            );

            return super.sendResponse(res, 200, "success", "OTP verified successfully", {
                token: token,
                driver: driver
            });
        } catch (error) {
            console.error('Driver verifyOTP error:', error);
            return super.sendResponse(res, 500, "error", error.message || "Internal Server Error");
        }
    }
}

module.exports = DriverAuthController;
