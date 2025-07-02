const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    avatar: String,
    role: { type: String, enum: ["viewer", "streamer", "admin"], default: "viewer" },

    // 🔁 Subscriptions (followers & following)
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    channelName: { type: String },
    channelDescription: { type: String },
    subscriptionCharge: { type: Number, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
