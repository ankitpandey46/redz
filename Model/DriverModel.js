const BaseModel = require('./BaseModel');

class DriverModel extends BaseModel {
    static async signup(data) {
        try {
            const newDriver = await super.prisma.driver.create({
                data: data
            });
            return { success: true, driver: newDriver };
        } catch (error) {
            return { error: error.message };
        }
    }

    static async findByUserId(userId) {
        // userId was likely referring to the driver's unique driverId string
        return await super.prisma.driver.findUnique({
            where: { driverId: userId }
        });
    }

    static async requestOTP(phoneNumber, countryCode) {
        const driver = await super.prisma.driver.findUnique({
            where: { phoneNumber }
        });

        if (!driver || driver.countryCode !== countryCode) {
            return { error: "Driver not found with this phone number and country code" };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await super.prisma.oTP.deleteMany({
            where: { username: driver.driverId }
        });

        await super.prisma.oTP.create({
            data: {
                username: driver.driverId,
                otp: otp
            }
        });

        return { success: true, otp, phoneNumber: driver.phoneNumber };
    }

    static async verifyOTP(otp) {
        const otpRecord = await super.prisma.oTP.findFirst({
            where: { otp: otp }
        });

        if (!otpRecord) {
            return { error: "Invalid or expired OTP" };
        }

        const driver = await super.prisma.driver.findUnique({
            where: { driverId: otpRecord.username }
        });

        if (!driver) {
            await super.prisma.oTP.deleteMany({
                where: { id: otpRecord.id }
            });
            return { error: "Driver profile not found" };
        }

        await super.prisma.oTP.deleteMany({
            where: { id: otpRecord.id }
        });
        return { success: true, driver: driver };
    }
}

module.exports = DriverModel;
