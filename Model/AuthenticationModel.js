const BaseModel = require("./BaseModel");

class AuthenticationModel extends BaseModel {
    static async logError(errorData) {
        try {
            await super.prisma.errorLog.create({
                data: {
                    message: errorData.message,
                    type: errorData.type,
                    details: errorData.details
                }
            });
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

        const existingUser = await super.prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber },
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.phoneNumber === phoneNumber) return { error: "Phone number already exists" };
            if (existingUser.email === email) return { error: "Email already exists" };
            if (existingUser.username === username) return { error: "Username already exists" };
        }

        const newUser = await super.prisma.user.create({
            data: {
                username,
                firstName,
                lastName,
                email,
                phoneNumber,
                countryCode
            }
        });

        return { success: true, user: newUser };
    }

    static async requestOTP(phoneNumber, countryCode) {
        const user = await super.prisma.user.findUnique({
            where: {
                phoneNumber: phoneNumber // Note: This assumes phoneNumber is unique in the DB
            }
        });

        if (!user || user.countryCode !== countryCode) {
            return { error: "User not found with this phone number and country code" };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await super.prisma.oTP.deleteMany({
            where: { username: user.username }
        });

        await super.prisma.oTP.create({
            data: {
                username: user.username,
                otp: otp
            }
        });

        return { success: true, otp, username: user.username };
    }

    static async loginVerify(email, password) {
        const user = await super.prisma.user.findUnique({
            where: { email }
        });
        if (user) {
            return { member: user };
        }
        return { member: {} };
    }

    static async verifyOTP(otp) {

        const otpRecord = await super.prisma.oTP.findFirst({
            where: {
                otp: otp
            }
        });

        if (!otpRecord) {
            const anyOtpRecord = await super.prisma.oTP.findFirst({
                where: { otp: otp }
            });
            if (!anyOtpRecord) {
                return { error: "otp is expire please resend the otp" };
            }
            return { error: "Invalid OTP" };
        }

        const user = await super.prisma.user.findUnique({
            where: { username: otpRecord.username }
        });

        await super.prisma.oTP.deleteMany({
            where: { id: otpRecord.id }
        });

        return { success: true, user: user };
    }
}

module.exports = AuthenticationModel;

