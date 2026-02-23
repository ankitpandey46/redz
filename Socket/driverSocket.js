const jwt = require("jsonwebtoken");
const DriverRideController = require("@/Controller/DriverRideController");

module.exports = (io, redis) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication error"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.driverId = decoded.id;
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", async (socket) => {
        const driverId = socket.driverId;
        console.log("Driver connected:", driverId);

        await redis.hSet(`driver:${driverId}`, {
            socketId: socket.id,
            driverId: driverId,
            status: "Online"
        });

        socket.on("updateLocation", async (data) => {
            try {
                const { error } = locationSchema.validate(data, { abortEarly: false });
                if (error) {
                    return socket.emit("error", { message: error.details[0].message });
                }
                const { lat, lng ,driverId} = data;
                await DriverRideController.UpdateDriverLocation(lat, lng ,driverId);
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