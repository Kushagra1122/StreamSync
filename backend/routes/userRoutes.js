const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    becomeCreator,
    search,
    subscribeToCreator,
    unsubscribeFromCreator,
    followingDetails,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected Routes
router.get("/profile", protect, getUserProfile);
router.post("/become-creator", protect, becomeCreator);
router.get("/search", protect, search);
router.post("/subscribe/:creatorId", protect, subscribeToCreator);
router.post("/unsubscribe/:creatorId", protect, unsubscribeFromCreator);
router.post("/following-details", protect,followingDetails);
module.exports = router;
