const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

    if (!token) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user data to request
        next();
    } catch (error) {
        return res.status(403).json({ message: "Forbidden - Invalid token" });
    }
};
