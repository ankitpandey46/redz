const BaseModel = require('./BaseModel');

class DriverModel extends BaseModel {

    static async findById(id) {
        return await super.prisma.driver.findUnique({
            where: { id: parseInt(id) }
        });
    }

    static async findManyByIds(ids) {
        return await super.prisma.driver.findMany({
            where: {
                id: {
                    in: ids.map(id => parseInt(id))
                }
            }
        });
    }

    static async updateDriverStatus(id, status) {
        return await super.prisma.driverOnline.update({
            where: { driverId: parseInt(id) },
            data: { driverstatus: status }
        });
    }
}

module.exports = DriverModel;
