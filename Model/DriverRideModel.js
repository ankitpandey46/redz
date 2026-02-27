const BaseModel = require('./BaseModel');

class DriverRideModel extends BaseModel {
    /**
     * Update or create driver online status
     */
    static async goOnline(driverId, lat, lng) {
        return await super.prisma.driverOnline.upsert({
            where: { driverId: parseInt(driverId) },
            update: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                driverstatus: "AVAILABLE"
            },
            create: {
                driverId: parseInt(driverId),
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                driverstatus: "AVAILABLE"
            }
        });
    }

    static async goOffline(driverId) {
        return await super.prisma.driverOnline.deleteMany({
            where: { driverId: parseInt(driverId) }
        });
    }
}

module.exports = DriverRideModel;
