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
        return await super.prisma.driver.findUnique({
            where: { driverId: userId }
        });
    }

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

    static async updateStatus(id, status) {
        return await super.prisma.driver.update({
            where: { id: parseInt(id) },
            data: { status }
        });
    }
}

module.exports = DriverModel;
