const tokenBlacklist = new Set(); 

function logout(req, res) {
    const token = req.cookies.authToken;
    if (token) {
        tokenBlacklist.add(token);
        res.clearCookie("authToken");
        return res.status(200).json({ message: "Logout successful" });
    } else {
        return res.status(400).json({ message: "No token found" });
    }
}


function checkToken(req, res, next) {
    const token = req.cookies.authToken; 

    if (token && tokenBlacklist.has(token)) {
        return res.status(401).json({ message: "Token is invalid or expired" });
    }

    next();
}

module.exports = { logout, checkToken, tokenBlacklist };
