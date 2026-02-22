const BaseModel = require('./BaseModel');

class DriverRideModel extends BaseModel {
    /**
     * Update or create driver online status
     */
    static async goOnline(userId, lat, lng) {
        return await super.prisma.driverOnline.upsert({
            where: { driveruserid: parseInt(userId) },
            update: {
                latitude: lat,
                longitude: lng,
                driverstatus: true
            },
            create: {
                driveruserid: parseInt(userId),
                latitude: lat,
                longitude: lng,
                driverstatus: true
            }
        });
    }

    static async goOffline(userId) {
        return await super.prisma.driverOnline.deleteMany({
            where: { driveruserid: parseInt(userId) }
        });
    }
}

module.exports = DriverRideModel;
