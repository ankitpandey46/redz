const jwt = require("jsonwebtoken");
const DriverRideController = require("@/Controller/DriverRideController");
const { locationSchema } = require("@/validation/driverRideValidation");

module.exports = (io, redis) => {
    io.use((socket, next) => {
        console.log("Connection attempt to root (driver) namespace");
        const token = socket.handshake.auth.token;

        if (!token) {
            console.log("Authentication failed: Missing token");
            return next(new Error("Authentication error"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.id) {
                console.log("Authentication failed: Token missing 'id' field");
                return next(new Error("Token missing 'id'"));
            }
            socket.driverId = decoded.id;
            console.log("Authentication successful for driver:", socket.driverId);
            next();
        } catch (err) {
            console.log("Authentication failed: Invalid token", err.message);
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", async (socket) => {
        const driverId = socket.driverId;
        console.log("Driver connected:", driverId);

        try {
            await redis.hSet(`driver:${driverId}`, {
                socketId: String(socket.id),
                driverId: String(driverId),
                status: "Online"
            });
        } catch (redisErr) {
            console.error("Redis storage error for driver:", redisErr.message);
        }

        socket.on("updateLocation", async (data) => {
            try {
                const { error } = locationSchema.validate(data, { abortEarly: false });
                if (error) {
                    return socket.emit("error", { message: error.details[0].message });
                }
                const { lat, lng, driverId } = data;
                await DriverRideController.UpdateDriverLocation(lat, lng, driverId);
                console.log(`Driver ${driverId} location updated to: ${lat}, ${lng}`);
                socket.emit("locationUpdated", { status: "success", message: "Location updated" });

            } catch (err) {
                console.error("Socket updateLocation error:", err);
                socket.emit("error", { message: "Internal server error during location update" });
            }
        });

        socket.on("disconnect", async () => {
            await redis.hDel(`driver:${driverId}`, "socketId");
            await redis.hSet(`driver:${driverId}`, "status", "Offline");
        });
    });
};