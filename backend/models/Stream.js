const mongoose = require("mongoose");

const StreamSchema = new mongoose.Schema({
    streamId: { type: String, required: true, unique: true },
    host: { type: String, required: true },
    viewers: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Stream", StreamSchema);
