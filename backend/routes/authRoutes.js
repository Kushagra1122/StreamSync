const express = require("express");
const { register, login } = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Register Route
router.post("/register", register);

// Login Route
router.post("/login", login);

// Check Authentication Route
router.get("/session", verifyToken, (req, res) => {
    res.json({ authenticated: true, userId: req.user.userId });
});

module.exports = router;
