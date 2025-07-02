const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

// @desc    Register new user
exports.registerUser = async (req, res) => {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Email already in use." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, avatar });

        res.status(201).json({
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc    Login user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

        res.json({
            token: generateToken(user._id),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// @desc    Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password")
            .populate("followers", "name email")
            .populate("following", "name email");

        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


// @desc    Promote a viewer to streamer
exports.becomeCreator = async (req, res) => {
    const { channelName, channelDescription, subscriptionCharge } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.role === "streamer") {
            return res.status(400).json({ message: "User is already a creator." });
        }

        if (!channelName || !channelDescription || subscriptionCharge == null) {
            return res.status(400).json({ message: "All channel details are required." });
        }

        user.role = "streamer";
        user.channelName = channelName;
        user.channelDescription = channelDescription;
        user.subscriptionCharge = subscriptionCharge;

        await user.save();

        res.json({
            message: "You are now a creator!",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                channelName: user.channelName,
                channelDescription: user.channelDescription,
                subscriptionCharge: user.subscriptionCharge,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.search = async (req, res) => {
    const q = req.query.q;
    if (!q) return res.json({ results: [] });

    const results = await User.find({
        $or: [
            { name: { $regex: q, $options: "i" } },
            { channelName: { $regex: q, $options: "i" } },
        ],
    }).select("-password");;

    res.json({ results });
}

exports.subscribeToCreator = async (req, res) => {
    const viewerId = req.user._id;
    const creatorId = req.params.creatorId;

    if (viewerId.toString() === creatorId) {
        return res.status(400).json({ message: "You cannot subscribe to yourself." });
    }

    const viewer = await User.findById(viewerId);
    const creator = await User.findById(creatorId);

    if (!creator || creator.role !== "streamer") {
        return res.status(404).json({ message: "Creator not found." });
    }

    if (viewer.following.includes(creatorId)) {
        return res.status(400).json({ message: "Already subscribed." });
    }

    viewer.following.push(creatorId);
    creator.followers.push(viewerId);

    await viewer.save();
    await creator.save();

    res.json({ message: "Subscribed successfully." });
};

exports.unsubscribeFromCreator = async (req, res) => {
    const viewerId = req.user._id;
    const creatorId = req.params.creatorId;

    const viewer = await User.findById(viewerId);
    const creator = await User.findById(creatorId);

    if (!creator || creator.role !== "streamer") {
        return res.status(404).json({ message: "Creator not found." });
    }

    viewer.following = viewer.following.filter(id => id.toString() !== creatorId);
    creator.followers = creator.followers.filter(id => id.toString() !== viewerId);

    await viewer.save();
    await creator.save();

    res.json({ message: "Unsubscribed successfully." });
};
exports.followingDetails = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: "Invalid or missing IDs" });
        }

        const users = await User.find({ _id: { $in: ids } }).select("name email");
        res.json({ users });
    } catch (err) {
        console.error("Error fetching followed user details:", err);
        res.status(500).json({ error: "Server error" });
    }
}