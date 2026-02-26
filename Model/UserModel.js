const BaseModel = require("./BaseModel");

class UserModel extends BaseModel {
    static async getUserById(userId) {
        return await super.prisma.user.findUnique({
            where: { id: userId }
        });
    }

    static async updateStatus(userId, status) {
        return await super.prisma.user.update({
            where: { id: userId },
            data: { status: status }
        });
    }
}

module.exports = UserModel;
