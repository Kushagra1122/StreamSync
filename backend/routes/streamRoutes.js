const express = require("express");
const router = express.Router();
const Stream = require("../models/Stream");
const { protect } = require("../middleware/authMiddleware");

// Get all live streams
router.get("/live", async (req, res) => {
    try {
        const streams = await Stream.find({ isLive: true }).populate("owner", "name");
        res.json(streams);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get stream by ID
router.get("/:streamId", protect, async (req, res) => {
    try {
        console.log("Fetching stream with ID:", req.params.streamId);

        const stream = await Stream.findOne({ streamId: req.params.streamId });

        if (!stream) {
            console.log("❌ Stream not found");
            return res.status(404).json({ error: "Stream not found" });
        }
        console.log("Stream found:", stream);
        try {
            await stream.populate("owner", "name followers");
        } catch (popErr) {
            console.error("❌ Populate error:", popErr.message);
            return res.status(500).json({ error: "Populate error", details: popErr.message });
        }
        console.log("Stream populated with owner:", stream.owner);
        res.json({ ...stream.toObject(), user: stream.owner });
    } catch (err) {
        console.error("❌ Main handler error:", err.message);
        res.status(500).json({ error: "Server error", details: err.message });
    }
});


module.exports = router;
