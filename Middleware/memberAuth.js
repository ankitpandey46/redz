const jwt = require('jsonwebtoken');
const tokenBlacklist = new Set();

// Middleware to verify Bearer Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization; // Get Authorization header

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token is not provided or invalid" });
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

    if (tokenBlacklist.has(token)) { 
        return res.status(401).json({ message: "Token is invalid or expired" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired, please login again" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = verifyToken;
