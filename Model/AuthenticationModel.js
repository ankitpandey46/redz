const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        trim: true
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
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

// Drop legacy index if it exists to resolve duplicate key error
User.collection.dropIndex("mobileNumber_1").catch(err => {
    if (err.codeName !== 'IndexNotFound') {
        console.log("Note: mobileNumber_1 index cleanup -", err.message);
    }
});

const otpSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '60s' }
    }
});

const OTP = mongoose.model('OTP', otpSchema);

const errorLogSchema = new mongoose.Schema({
    message: String,
    type: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
});

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

class AuthenticationModel {
    static async logError(errorData) {
        try {
            const log = new ErrorLog(errorData);
            await log.save();
        } catch (err) {
            console.error('Failed to save error log:', err);
        }
    }
    static async signup(data) {
        let { username, firstName, lastName, email, phoneNumber, countryCode } = data;

        if (!username) {
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${randomDigits}`;
        }

        const existingUser = await User.findOne({
            $or: [{ phoneNumber }, { email }, { username }]
        });

        if (existingUser) {
            if (existingUser.phoneNumber === phoneNumber) return { error: "Phone number already exists" };
            if (existingUser.email === email) return { error: "Email already exists" };
            if (existingUser.username === username) return { error: "Username already exists" };
        }

        const newUser = new User({
            username,
            firstName,
            lastName,
            email,
            phoneNumber,
            countryCode
        });

        await newUser.save();
        return { success: true, user: newUser };
    }

    static async requestOTP(phoneNumber, countryCode) {

        const user = await User.findOne({ phoneNumber, countryCode });
        if (!user) {
            return { error: "User not found with this phone number and country code" };
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

    static async loginVerify(email, password) {
        const user = await User.findOne({ email });
        if (user) {
            return { member: user };
        }
        return { member: {} };
    }

    static async verifyOTP(username, otp) {
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

        return { success: true, user: user };
    }
}

module.exports = AuthenticationModel;

