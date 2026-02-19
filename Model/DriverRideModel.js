const mongoose = require('mongoose');

const driverOnlineSchema = new mongoose.Schema({
    driveruserid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    driverstatus: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const DriverOnline = mongoose.model('driveronline', driverOnlineSchema);

class DriverRideModel {
    /**
     * Update or create driver online status
     */
    static async goOnline(userId, lat, lng) {
        return await DriverOnline.findOneAndUpdate(
            { driveruserid: userId },
            {
                latitude: lat,
                longitude: lng,
                driverstatus: true
            },
            { upsert: true, new: true }
        );
    }

    static async goOffline(userId) {
        return await DriverOnline.deleteOne(
            { driveruserid: userId }
        );
    }
}

module.exports = DriverRideModel;
