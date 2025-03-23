const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://streamsync25.netlify.app/", // Allow frontend
        methods: ["GET", "POST"],
    },
});

const streams = {}; // Store active streams

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    // Broadcaster starts a stream
    socket.on("startStream", () => {
        const streamId = uuidv4();
        streams[streamId] = { host: socket.id };
        socket.join(streamId);
        socket.emit("streamId", streamId); // Send stream ID to broadcaster
        io.emit("newStream", streamId); // Notify viewers
        console.log(`🎥 New stream started: ${streamId} by ${socket.id}`);
    });

    // Viewer joins a stream
    socket.on("watchStream", (streamId) => {
        console.log(`🔗 Viewer ${socket.id} requested to join stream: ${streamId}`);

        if (streams[streamId]) {
            socket.join(streamId);
            socket.to(streamId).emit("viewerJoined", socket.id);
            console.log(`👀 Viewer ${socket.id} joined stream ${streamId}`);

            // Send a signal to the broadcaster to share the stream
            io.to(streams[streamId].host).emit("sendStream", { viewerId: socket.id });
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
            delete streams[streamId];
            io.to(streamId).emit("streamEnded"); // Notify viewers
            socket.leave(streamId);
            console.log(`🛑 Stream ${streamId} stopped by ${socket.id}`);
        }
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
        Object.keys(streams).forEach((id) => {
            if (streams[id].host === socket.id) {
                delete streams[id];
                io.to(id).emit("streamEnded"); // Notify viewers
                console.log(`⚠️ Stream ${id} ended because host ${socket.id} disconnected`);
            }
        });
    });
});

server.listen(9000, () => console.log("🚀 Server running on port 9000"));
