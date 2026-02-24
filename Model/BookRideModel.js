const BaseModel = require('./BaseModel');

class BookRideModel extends BaseModel {
    static async createRide(data) {
        const ride = await super.prisma.bookRide.create({
            data: data
        });
        const rideData = await super.prisma.bookRide.findUnique({
            where: { id: parseInt(ride.id) },
            include: {
                driver: true
            }
        });
        return rideData;
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

    static async getRidesByUserId(userId) {
        return await super.prisma.bookRide.findMany({
            where: { userId: parseInt(userId) },
            include: {
                driver: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    static async getRidesByDriverId(driverId) {
        return await super.prisma.bookRide.findMany({
            where: { driverId: parseInt(driverId) },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'desc'
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
            },
            include: {
                user: true,
                driver: true
            }
        });
    }

    static async acceptRide(id) {
        return await super.prisma.bookRide.update({
            where: { id: parseInt(id) },
            data: {
                status: 'BOOKED'
            },
            include: {
                user: true,
                driver: true
            }
        });
    }

    static async completeRide(id) {
        return await super.prisma.bookRide.update({
            where: { id: parseInt(id) },
            data: {
                status: 'COMPLETED'
            },
            include: {
                user: true,
                driver: true
            }
        });
    }
}

module.exports = BookRideModel;
