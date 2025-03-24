import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("https://streamsync-v13p.onrender.com", {
  transports: ["websocket", "polling"],
});

function Watch() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  const [streamTitle, setStreamTitle] = useState("Loading...");
  const [streamNotFound, setStreamNotFound] = useState(false);
  const [streamEnded, setStreamEnded] = useState(false);
  const [viewers, setViewers] = useState(0);
  useEffect(() => {
    console.log(`🔗 Joining stream: ${streamId}`);
    socket.emit("watchStream", streamId);
    socket.on("streamTitle", (title) => {
      console.log("🎥 Stream Title:", title);
      setStreamTitle(title);
    });
    socket.on("viewerCount", ({ streamId, viewers }) => {
      console.log(`👀 Viewer count updated: ${viewers}`);
      setViewers(viewers);
    });
    socket.on("streamNotFound", () => {
      console.error("❌ Stream not found!");
      setStreamNotFound(true);
    });

    socket.on("streamEnded", () => {
      console.warn("⚠️ Stream has ended.");
      setStreamEnded(true);
    });

    // Initialize WebRTC connection
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    console.log("🛠️ Created new RTCPeerConnection");

    // ✅ Debug: Log ICE connection state
    peerConnection.current.oniceconnectionstatechange = () => {
      console.log(
        `🔄 ICE Connection State: ${peerConnection.current.iceConnectionState}`
      );
    };

    // ✅ Debug: Log connection state
    peerConnection.current.onconnectionstatechange = () => {
      console.log(
        `🖥️ PeerConnection State: ${peerConnection.current.connectionState}`
      );
    };

    // ✅ Debug: When ICE candidates are gathered
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(
          "📡 Sending local ICE candidate to broadcaster",
          event.candidate
        );
        socket.emit("candidate", {
          streamId,
          candidate: event.candidate,
        });
      }
    };

    // ✅ Ensure `ontrack` runs before offer is received
    peerConnection.current.ontrack = (event) => {
      console.log("🎥 Received track, streams:", event.streams);
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        console.log("✅ Video source updated");
      } else {
        console.error("❌ videoRef is not set.");
      }
    };

    socket.on("offer", async ({ viewerId, offer }) => {
      console.log("📡 Viewer received WebRTC offer:", offer);

      if (!peerConnection.current) {
        console.error("❌ RTCPeerConnection not initialized!");
        return;
      }

      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        console.log("✅ Set remote description successfully.");

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        console.log("📤 Sending WebRTC answer to broadcaster.");
        socket.emit("answer", { streamId, answer, viewerId });
      } catch (error) {
        console.error("❌ Error handling WebRTC offer:", error);
      }
    });

    socket.on("candidate", ({ candidate }) => {
      console.log("📡 Received ICE Candidate:", candidate);
      peerConnection.current
        .addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => console.log("✅ ICE Candidate added successfully"))
        .catch((err) => console.error("❌ ICE Candidate error:", err));
    });

    return () => {
      console.log("🛑 Cleaning up WebRTC connection");
      socket.off("streamNotFound");
      socket.off("streamEnded");
      socket.off("offer");
      socket.off("candidate");

      if (peerConnection.current) {
        peerConnection.current.close();
        console.log("✅ Closed RTCPeerConnection");
      }
    };
  }, [streamId]);

  const leaveStream = () => {
    console.log("📤 Leaving the live stream...");
    socket.emit("leaveStream", streamId); // Optionally, emit to server to notify it
    navigate("/"); // Navigate back to home or another page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <h1 className="text-3xl font-bold mb-4 text-center">
        🎥 Watching Live Stream
      </h1>
      <h2 className="text-xl text-gray-300">{streamTitle}</h2>
      <p className="text-lg font-semibold">
        👀 Viewers: <span className="text-green-400">{viewers}</span>
      </p>

      {streamNotFound && (
        <div className="text-center">
          <p className="text-xl text-red-500">❌ Stream Not Found!</p>
          <button
            className="mt-4 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
            onClick={() => navigate("/")}
          >
            Go Back
          </button>
        </div>
      )}

      {streamEnded && (
        <div className="text-center">
          <p className="text-xl text-yellow-400">🛑 Stream has ended.</p>
          <button
            className="mt-4 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
            onClick={() => navigate("/")}
          >
            Go Back
          </button>
        </div>
      )}

      {!streamNotFound && !streamEnded && (
        <div className="flex flex-col items-center w-full md:w-3/4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            className="w-full max-w-2xl border-4 border-gray-700 rounded-lg shadow-lg"
          />
          <button
            className="mt-6 px-6 py-3 bg-red-600 rounded-lg text-white font-semibold hover:bg-red-500 transition"
            onClick={leaveStream}
          >
            Leave Stream
          </button>
        </div>
      )}
    </div>
  );
}

export default Watch;
