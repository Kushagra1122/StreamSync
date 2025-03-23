const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
}));

// ✅ Proper Socket.IO CORS configuration
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const streams = {}; // Store active streams

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // Broadcaster starts a stream
    socket.on("startStream", ({ title }) => {
        const streamId = uuidv4();
        streams[streamId] = {
            title,
            host: socket.id,
            viewers: new Set() // Track viewer count
        };
        socket.join(streamId);
        socket.emit("streamId", streamId); // Send stream ID to host
        io.emit("newStream", { streamId, title, viewers: 0 }); // Notify viewers with title and count
        console.log(`🎥 Stream started: ${title} (ID: ${streamId})`);
    });

    // Viewer joins a stream
    socket.on("watchStream", (streamId) => {
        console.log(`🔗 Viewer ${socket.id} requested to join stream: ${streamId}`);

        if (streams[streamId]) {
            const streamTitle = streams[streamId].title; // ✅ Corrected undefined variable
            socket.emit("streamTitle", streamTitle);
            console.log(`📢 Emitting streamTitle: ${streamTitle} to ${streamId}`);

            streams[streamId].viewers.add(socket.id); // Track viewers
            socket.join(streamId);

            // Notify viewers and broadcaster about viewer count update
            io.to(streamId).emit("viewerCount", { streamId, viewers: streams[streamId].viewers.size });
            io.to(streams[streamId].host).emit("viewerCount", { streamId, viewers: streams[streamId].viewers.size });

            // Notify broadcaster to share the stream
            io.to(streams[streamId].host).emit("sendStream", { viewerId: socket.id });

            console.log(`👀 Viewer ${socket.id} joined stream ${streamId}, Total Viewers: ${streams[streamId].viewers.size}`);
        } else {
            socket.emit("streamNotFound");
            console.log(`❌ Viewer ${socket.id} tried to join non-existing stream: ${streamId}`);
        }
    });
    // WebRTC Signaling
    socket.on("offer", ({ streamId, offer, viewerId }) => {
        console.log("📡 Received WebRTC Offer from broadcaster");
        socket.to(viewerId).emit("offer", { streamId, offer, viewerId });
    });

    socket.on("answer", ({ streamId, answer, viewerId }) => {
        console.log("📡 Received WebRTC Answer from viewer");
        socket.to(streams[streamId].host).emit("answer", { streamId, answer, viewerId });
    });

    socket.on("candidate", ({ streamId, candidate, viewerId }) => {
        console.log("📡 Received ICE Candidate");
        socket.to(viewerId).emit("candidate", { streamId, candidate });
    });

    // Broadcaster stops the stream
    socket.on("stopStream", (streamId) => {
        if (streams[streamId]) {
            io.to(streamId).emit("streamEnded"); // Notify viewers
            console.log(`🛑 Stream ended: ${streamId}`);

            delete streams[streamId]; // Remove the stream from storage
            io.emit("removeStream", streamId); // Notify viewers that the stream is no longer available
        }
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
        console.log(`⚠️ User disconnected: ${socket.id}`);

        // Remove the user from any stream they were viewing
        Object.keys(streams).forEach((streamId) => {
            if (streams[streamId].host === socket.id) {
                delete streams[streamId]; // Delete the stream
                io.to(streamId).emit("streamEnded"); // Notify viewers
                console.log(`⚠️ Stream ${streamId} ended because host ${socket.id} disconnected`);
            } else if (streams[streamId]?.viewers.has(socket.id)) {
                streams[streamId].viewers.delete(socket.id);
                io.to(streamId).emit("viewerCount", { streamId, viewers: streams[streamId].viewers.size }); // Update viewer count
                console.log(`👋 Viewer ${socket.id} left stream ${streamId}, Total Viewers: ${streams[streamId].viewers.size}`);
            }
        });
    });

    // Function to update viewer count

});

server.listen(9000, () => console.log("🚀 Server running on port 9000"));
