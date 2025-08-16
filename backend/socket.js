const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const streams = {}; // In-memory store for active streams

function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("✅ User connected:", socket.id);

        // Host starts a stream
        socket.on("startStream", ({ title ,userName}) => {
            const streamId = uuidv4();
            streams[streamId] = {
                title,
                host: socket.id,
                viewers: new Set(),
                chat: [],
                hostName: userName, // Store host's name
            };

            socket.join(streamId);
            socket.emit("streamId", streamId);
            io.emit("newStream", { streamId, title, viewers: 0 });

            console.log(`🎥 Stream started: ${title} (ID: ${streamId})`);
        });

        // Viewer joins a stream
        socket.on("watchStream", (streamId) => {
            console.log(`🔗 Viewer ${socket.id} requested to join stream: ${streamId}`);

            const stream = streams[streamId];

            if (stream) {
                socket.join(streamId);
                stream.viewers.add(socket.id);

                socket.emit("streamTitle", stream.title);
                socket.emit("streamHost",stream.hostName);
                socket.emit("chatHistory", stream.chat);

                const viewerCount = stream.viewers.size;
                io.to(streamId).emit("viewerCount", { streamId, viewers: viewerCount });
                io.to(stream.host).emit("viewerCount", { streamId, viewers: viewerCount });

                io.to(stream.host).emit("sendStream", { viewerId: socket.id });

                console.log(`👀 Viewer ${socket.id} joined stream ${streamId}, Viewers: ${viewerCount}`);
            } else {
                socket.emit("streamNotFound");
                console.log(`❌ Stream not found: ${streamId}`);
            }
        });

        // WebRTC Signaling
        socket.on("offer", ({ streamId, offer, viewerId }) => {
            socket.to(viewerId).emit("offer", { streamId, offer, viewerId });
        });

        socket.on("answer", ({ streamId, answer, viewerId }) => {
            const stream = streams[streamId];
            if (stream) {
                io.to(stream.host).emit("answer", { streamId, answer, viewerId });
            }
        });

        socket.on("candidate", ({ streamId, candidate, viewerId }) => {
            socket.to(viewerId).emit("candidate", { streamId, candidate });
        });

        // Chat message with Super Chat support
        socket.on("chatMessage", ({ streamId, user, message, isSuper, amount = 0, timestamp }) => {
            const stream = streams[streamId];
            if (!stream) return;

            const chatMessage = {
                id: uuidv4(),
                user,
                message,
                isSuper: !!isSuper,
                amount: isSuper ? amount : 0,
                timestamp: timestamp || new Date().toISOString(),
            };

            // Save and broadcast
            stream.chat.push(chatMessage);
            io.to(streamId).emit("chatMessage", chatMessage);

            // Optional: Notify host about Super Chats
            if (isSuper) {
                io.to(stream.host).emit("superChatNotification", chatMessage);
                console.log(`💰 Super Chat from ${user}: ₹${amount} - "${message}"`);
            } else {
                console.log(`💬 Chat from ${user}: "${message}"`);
            }
        });

        // Viewer leaves stream
        socket.on("leaveStream", (streamId) => {
            const stream = streams[streamId];
            if (stream?.viewers.has(socket.id)) {
                stream.viewers.delete(socket.id);
                const count = stream.viewers.size;
                io.to(streamId).emit("viewerCount", { streamId, viewers: count });
                console.log(`👋 Viewer ${socket.id} left stream ${streamId}, Viewers: ${count}`);
            }
        });

        // Host stops stream manually
        socket.on("stopStream", (streamId) => {
            if (streams[streamId]) {
                io.to(streamId).emit("streamEnded");
                delete streams[streamId];
                io.emit("removeStream", streamId);
                console.log(`🛑 Stream ${streamId} stopped by host`);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log(`⚠️ Disconnected: ${socket.id}`);

            Object.entries(streams).forEach(([streamId, stream]) => {
                if (stream.host === socket.id) {
                    io.to(streamId).emit("streamEnded");
                    delete streams[streamId];
                    io.emit("removeStream", streamId);
                    console.log(`⚠️ Stream ${streamId} ended due to host disconnect`);
                } else if (stream.viewers.has(socket.id)) {
                    stream.viewers.delete(socket.id);
                    const count = stream.viewers.size;
                    io.to(streamId).emit("viewerCount", { streamId, viewers: count });
                    console.log(`👋 Viewer ${socket.id} disconnected from stream ${streamId}`);
                }
            });
        });
    });
}

module.exports = { setupSocket };
