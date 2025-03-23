const Stream = require("../models/Stream");

/**
 * @desc Start a new stream
 */
exports.startStream = async (req, res) => {
    try {
        const { streamId, host } = req.body;

        const newStream = new Stream({ streamId, host, viewers: [], isActive: true });
        await newStream.save();

        res.status(201).json({ message: "Stream started successfully", streamId });
    } catch (error) {
        console.error("Error starting stream:", error);
        res.status(500).json({ error: "Failed to start stream" });
    }
};

/**
 * @desc Stop an active stream
 */
exports.stopStream = async (req, res) => {
    try {
        const { streamId } = req.params;

        const stream = await Stream.findOneAndUpdate(
            { streamId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!stream) return res.status(404).json({ error: "Stream not found or already stopped" });

        res.json({ message: "Stream stopped successfully", stream });
    } catch (error) {
        console.error("Error stopping stream:", error);
        res.status(500).json({ error: "Failed to stop stream" });
    }
};

/**
 * @desc Get active streams
 */
exports.getActiveStreams = async (req, res) => {
    try {
        const streams = await Stream.find({ isActive: true });
        res.json(streams);
    } catch (error) {
        console.error("Error fetching active streams:", error);
        res.status(500).json({ error: "Failed to fetch streams" });
    }
};

/**
 * @desc Add viewer to stream
 */
exports.addViewer = async (req, res) => {
    try {
        const { streamId, viewerId } = req.body;

        const stream = await Stream.findOneAndUpdate(
            { streamId, isActive: true },
            { $addToSet: { viewers: viewerId } },
            { new: true }
        );

        if (!stream) return res.status(404).json({ error: "Stream not found or inactive" });

        res.json({ message: "Viewer added", stream });
    } catch (error) {
        console.error("Error adding viewer:", error);
        res.status(500).json({ error: "Failed to add viewer" });
    }
};

/**
 * @desc Remove viewer from stream
 */
exports.removeViewer = async (req, res) => {
    try {
        const { streamId, viewerId } = req.body;

        const stream = await Stream.findOneAndUpdate(
            { streamId, isActive: true },
            { $pull: { viewers: viewerId } },
            { new: true }
        );

        if (!stream) return res.status(404).json({ error: "Stream not found or inactive" });

        res.json({ message: "Viewer removed", stream });
    } catch (error) {
        console.error("Error removing viewer:", error);
        res.status(500).json({ error: "Failed to remove viewer" });
    }
};
