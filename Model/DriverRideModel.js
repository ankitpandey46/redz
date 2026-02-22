const BaseModel = require('./BaseModel');

class DriverRideModel extends BaseModel {
    /**
     * Update or create driver online status
     */
    static async goOnline(driverId, lat, lng) {
        return await super.prisma.driverOnline.upsert({
            where: { driveruserid: parseInt(driverId) },
            update: {
                latitude: lat,
                longitude: lng,
                driverstatus: true
            },
            create: {
                driveruserid: parseInt(driverId),
                latitude: lat,
                longitude: lng,
                driverstatus: true
            }
        });
    }

    static async goOffline(driverId) {
        return await super.prisma.driverOnline.deleteMany({
            where: { driveruserid: parseInt(driverId) }
        });
    }
}

module.exports = DriverRideModel;
