// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { setupSocket } = require("./socket");
const authRoutes = require("./routes/userRoutes");
const streamRoutes = require("./routes/streamRoutes");
const connectDB = require("./config/db");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const server = http.createServer(app);

connectDB();

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json()); 

// Routes
app.use("/api/user", authRoutes);
app.use("/api/stream", streamRoutes);
// Setup Socket.IO
setupSocket(server);

// Start server
const port= process.env.PORT || 9000;
server.listen(port, () => {
    console.log("🚀 Server running on http://localhost:9000");
});
