const mongoose = require("mongoose");

const streamSchema = new mongoose.Schema({
    streamId: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        default: "Untitled Stream",
    },
    description: {
        type: String,
    },
    isLive: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
    endedAt: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model("Stream", streamSchema);
