const BaseModel = require("./BaseModel");

class DriverAuthenticationModel extends BaseModel {
    static async requestOTP(phoneNumber, countryCode) {
        const driver = await super.prisma.driver.findUnique({
            where: {
                phoneNumber: phoneNumber
            }
        });

        if (!driver || driver.countryCode !== countryCode) {
            return { error: "Driver not found with this phone number and country code" };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await super.prisma.driverOTP.deleteMany({
            where: { phoneNumber: phoneNumber }
        });

        await super.prisma.driverOTP.create({
            data: {
                phoneNumber: phoneNumber,
                otp: otp
            }
        });

        return { success: true, otp, phoneNumber: phoneNumber };
    }

    static async verifyOTP(otp) {
        const otpRecord = await super.prisma.driverOTP.findFirst({
            where: {
                otp: otp
            }
        });

        if (!otpRecord) {
            return { error: "Invalid or expired OTP" };
        }

        const driver = await super.prisma.driver.findUnique({
            where: { phoneNumber: otpRecord.phoneNumber }
        });

        await super.prisma.driverOTP.deleteMany({
            where: { id: otpRecord.id }
        });

        return { success: true, driver: driver };
    }
}

module.exports = DriverAuthenticationModel;
