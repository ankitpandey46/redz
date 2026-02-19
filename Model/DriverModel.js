const mongoose = require('mongoose');
const crypto = require('crypto');

const driverSchema = new mongoose.Schema({
    driverId: {
        type: String,
        unique: true,
        default: () => crypto.randomUUID()
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
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true
    },
    countryCode: {
        type: String,
        required: [true, 'Country code is required']
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
        const Driver = mongoose.model('Driver');
        const OTP = mongoose.model('OTP');

        const driver = await Driver.findOne({ phoneNumber, countryCode });
        if (!driver) {
            return { error: "Driver not found with this phone number and country code" };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.deleteMany({ username: driver.driverId });

        const newOTP = new OTP({
            username: driver.driverId,
            otp: otp
        });

        await newOTP.save();

        return { success: true, otp, phoneNumber: driver.phoneNumber };
    }

    static async verifyOTP(otp) {
        const OTP = mongoose.model('OTP');
        const otpRecord = await OTP.findOne({ otp: otp });

        if (!otpRecord) {
            return { error: "Invalid or expired OTP" };
        }

        const driver = await Driver.findOne({ phoneNumber: otpRecord.username });
        if (!driver) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return { error: "Driver profile not found" };
        }

        await OTP.deleteOne({ _id: otpRecord._id });
        return { success: true, driver: driver };
    }
}

module.exports = DriverModel;
