const jwt = require("jsonwebtoken");

module.exports = (io, redis) => {
    const userIo = io.of('/user');

    userIo.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication error"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    userIo.on("connection", async (socket) => {
        const userId = socket.userId;
        console.log("User connected to /user namespace:", userId);

        await redis.hSet(`user:${userId}`, {
            socketId: socket.id,
            userId: userId,
            status: "Online"
        });

        socket.on("disconnect", async () => {
            await redis.hDel(`user:${userId}`, "socketId");
            await redis.hSet(`user:${userId}`, "status", "Offline");
        });
    });
};
