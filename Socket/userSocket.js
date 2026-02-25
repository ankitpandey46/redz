const jwt = require("jsonwebtoken");

module.exports = (io, redis) => {
    const userIo = io.of('/user');

    userIo.use((socket, next) => {
        console.log("Connection attempt to /user namespace");
        const token = socket.handshake.auth.token;

        if (!token) {
            console.log("Authentication failed: Missing token (/user)");
            return next(new Error("Authentication error"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.id) {
                console.log("Authentication failed: Token missing 'id' field (/user)");
                return next(new Error("Token missing 'id'"));
            }
            socket.userId = decoded.id;
            console.log("Authentication successful for user:", socket.userId);
            next();
        } catch (err) {
            console.log("Authentication failed: Invalid token (/user)", err.message);
            next(new Error("Invalid token"));
        }
    });

    userIo.on("connection", async (socket) => {
        const userId = socket.userId;
        console.log("User connected to /user namespace:", userId);

        try {
            await redis.hSet(`user:${userId}`, {
                socketId: String(socket.id),
                userId: String(userId),
                status: "Online"
            });
        } catch (redisErr) {
            console.error("Redis storage error for user:", redisErr.message);
        }

        socket.on("disconnect", async () => {
            await redis.hDel(`user:${userId}`, "socketId");
            await redis.hSet(`user:${userId}`, "status", "Offline");
        });
    });
};
