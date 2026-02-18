const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    nrc: {
        type: String,
        required: [true, 'NRC is required'],
        trim: true
    },
    nrcImage: {
        type: String,
        required: [true, 'NRC image is required']
    },
    selfieImage: {
        type: String,
        required: [true, 'Selfie image is required']
    },
    policeClearanceImage: {
        type: String,
        required: [true, 'Police clearance image is required']
    },
    vehicleMake: {
        type: String,
        required: [true, 'Vehicle make is required'],
        trim: true
    },
    vehicleModel: {
        type: String,
        required: [true, 'Vehicle model is required'],
        trim: true
    },
    vehiclePlate: {
        type: String,
        required: [true, 'Vehicle plate is required'],
        trim: true
    },
    vehicleColor: {
        type: String,
        required: [true, 'Vehicle color is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Driver = mongoose.model('Driver', driverSchema);

class DriverModel {
    static async signup(data) {
        try {
            const newDriver = new Driver(data);
            await newDriver.save();
            return { success: true, driver: newDriver };
        } catch (error) {
            return { error: error.message };
        }
    }

    static async findByUserId(userId) {
        return await Driver.findOne({ userId });
    }

    static async requestOTP(phoneNumber, countryCode) {
        const User = mongoose.model('User');
        const OTP = mongoose.model('OTP');

        const user = await User.findOne({ phoneNumber, countryCode });
        if (!user) {
            return { error: "User not found with this phone number and country code" };
        }

        const driver = await Driver.findOne({ userId: user._id });
        if (!driver) {
            return { error: "Driver profile not found for this user" };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.deleteMany({ username: user.username });

        const newOTP = new OTP({
            username: user.username,
            otp: otp
        });

        await newOTP.save();

        return { success: true, otp, username: user.username };
    }

    static async verifyOTP(username, otp) {
        const User = mongoose.model('User');
        const OTP = mongoose.model('OTP');

        const user = await User.findOne({ username });
        if (!user) {
            return { error: "User not found" };
        }

        const otpRecord = await OTP.findOne({ username: username, otp: otp });

        if (!otpRecord) {
            const anyOtpRecord = await OTP.findOne({ username: username });
            if (!anyOtpRecord) {
                return { error: "otp is expire please resend the otp" };
            }
            return { error: "Invalid OTP" };
        }
        await OTP.deleteOne({ _id: otpRecord._id });

        const driver = await Driver.findOne({ userId: user._id });
        if (!driver) {
            return { error: "Driver profile not found" };
        }

        return { success: true, user: user, driver: driver };
    }
}

module.exports = DriverModel;
