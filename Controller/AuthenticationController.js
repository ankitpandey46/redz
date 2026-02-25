const BaseController = require("@/Controller/BaseController");
const jwt = require("jsonwebtoken");
const AuthenticationModel = require("@/Model/AuthenticationModel");
const { signupSchema, sendOTPSchema, verifyOTPSchema } = require("@/validation/auth-validation");

class AuthenticationController extends BaseController {

  static async signup(req, res) {
    try {
      const data = req.body;
      const { error } = signupSchema.validate(data, { abortEarly: false });
      if (error) {
        const combinedMessage = error.details.map(detail => detail.message).join(", ");
        return super.sendValidationError(res, combinedMessage);
      }
      const result = await AuthenticationModel.signup(data);
      if (result.error) {
        return res.status(400).json({
          status: "error",
          message: result.error
        });
      }
      return res.status(201).json({
        status: "success",
        message: "Successful registration message",
        data: result.user
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(val => val.message);
        const combinedMessage = messages.join(", ");
        return super.sendValidationError(res, combinedMessage);
      }
      return res.status(500).json({
        status: "error",
        message: error.message || "Internal Server Error"
      });
    }
  }

  static async sendOTP(req, res) {
    try {
      const data = req.body;

      const { error } = sendOTPSchema.validate(data, { abortEarly: false });
      if (error) {
        const combinedMessage = error.details.map(detail => detail.message).join(", ");
        return super.sendValidationError(res, combinedMessage);
      }

      const { phoneNumber, countryCode } = data;

      const result = await AuthenticationModel.requestOTP(phoneNumber, countryCode);

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
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map(val => val.message);
        const combinedMessage = messages.join(", ");

        return super.sendValidationError(res, combinedMessage);
      }

      return res.status(500).json({
        status: "error",
        message: error.message || "Internal Server Error"
      });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const data = req.body;

      const { error } = verifyOTPSchema.validate(data, { abortEarly: false });
      if (error) {
        const combinedMessage = error.details.map(detail => detail.message).join(", ");
        return super.sendValidationError(res, combinedMessage);
      }

      const { otp } = data;

      const result = await AuthenticationModel.verifyOTP(otp);

      if (result.error) {
        return res.status(200).json({
          status: "error",
          message: result.error
        });
      }

      const user = result.user;
      const token = jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      return res.status(200).json({
        status: "success",
        message: "OTP verified successfully",
        token: token,
        data: user
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message || "Internal Server Error"
      });
    }
  }
}

module.exports = AuthenticationController;
