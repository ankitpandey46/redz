const BaseModel = require('./BaseModel');

class BookRideModel extends BaseModel {
    static async createRide(data) {
        return await super.prisma.bookRide.create({
            data: data
        });
    }

    static async getRideById(id) {
        return await super.prisma.bookRide.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: true,
                driver: true
            }
        });
    }

    static async updateRideStatus(id, status) {
        return await super.prisma.bookRide.update({
            where: { id: parseInt(id) },
            data: { status }
        });
    }

    static async cancelRide(id, cancelledBy) {
        return await super.prisma.bookRide.update({
            where: { id: parseInt(id) },
            data: {
                status: 'CANCELLED',
                cancelledBy: cancelledBy
            }
        });
    }

    static async acceptRide(id) {
        return await super.prisma.bookRide.update({
            where: { id: parseInt(id) },
            data: {
                status: 'ACCEPTED'
            }
        });
    }

    static async completeRide(id) {
        return await super.prisma.bookRide.update({
            where: { id: parseInt(id) },
            data: {
                status: 'COMPLETED'
            }
        });
    }
}

module.exports = BookRideModel;
