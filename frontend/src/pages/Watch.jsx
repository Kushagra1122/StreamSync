import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:9000");

function Watch() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const peerConnection = useRef(null);

  const [streamNotFound, setStreamNotFound] = useState(false);
  const [streamEnded, setStreamEnded] = useState(false);

  useEffect(() => {
    console.log(`🔗 Joining stream: ${streamId}`);
    socket.emit("watchStream", streamId);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 p-4">
      <h1 className="text-3xl font-bold text-white mb-4">
        Watching Live Stream
      </h1>

      {streamNotFound && (
        <div className="text-center text-white">
          <p className="text-lg mb-4 text-red-500">❌ Stream Not Found!</p>
          <button
            className="bg-gray-600 text-white px-6 py-3 mt-4 rounded-lg hover:bg-gray-500 transition-all"
            onClick={() => navigate("/")}
          >
            Go Back
          </button>
        </div>
      )}

      {streamEnded && (
        <div className="text-center text-white">
          <p className="text-lg mb-4 text-yellow-400">🛑 Stream has ended.</p>
          <button
            className="bg-gray-600 text-white px-6 py-3 mt-4 rounded-lg hover:bg-gray-500 transition-all"
            onClick={() => navigate("/")}
          >
            Go Back
          </button>
        </div>
      )}

      {!streamNotFound && !streamEnded && (
        <div className="w-full md:w-3/4 text-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="border-2 border-gray-300 mb-4"
            controls
          />
          <button
            className="bg-red-600 text-white px-6 py-3 mt-4 rounded-lg hover:bg-red-500 transition-all"
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
