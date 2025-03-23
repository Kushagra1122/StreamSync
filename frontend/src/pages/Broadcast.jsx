import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://streamsync-v13p.onrender.com", {
  transports: ["websocket"],
});


function Broadcast() {
  const videoRef = useRef();
  const peerConnections = useRef({});
  const [streamId, setStreamId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [shareableUrl, setShareableUrl] = useState("");
  const streamRef = useRef(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    socket.emit("startStream");

    socket.on("streamId", (id) => {
      console.log(`✅ Stream started with ID: ${id}`);
      setStreamId(id);
      setShareableUrl(`https://streamsync-v13p.onrender.com/watch/${id}`);
    });

    socket.on("sendStream", ({ viewerId }) => {
      console.log(`📡 Viewer ${viewerId} requested stream.`);

      if (!streamRef.current) {
        console.error("❌ No stream available. Retrying in 1 second...");
        setTimeout(() => {
          if (streamRef.current) sendStreamToViewer(viewerId);
        }, 1000);
        return;
      }

      sendStreamToViewer(viewerId);
    });

    socket.on("answer", ({ viewerId, answer }) => {
      console.log(`📡 Received WebRTC answer from Viewer ${viewerId}`);
      peerConnections.current[viewerId]?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("candidate", ({ viewerId, candidate }) => {
      console.log(`📡 Received ICE Candidate from Viewer ${viewerId}`);
      peerConnections.current[viewerId]?.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    });

    startWebcam();

    return () => {
      socket.off("streamId");
      socket.off("sendStream");
      socket.off("answer");
      socket.off("candidate");
    };
  }, []);

  const startWebcam = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = userStream; // ✅ Immediate update
      videoRef.current.srcObject = userStream;
      console.log("🎥 Webcam started successfully");
    } catch (err) {
      console.error("❌ Webcam access error:", err);
    }
  };

  const startScreenSharing = async () => {
    try {
      if (isScreenSharing) {
        await startWebcam(); // Switch back to webcam
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        streamRef.current = screenStream;
        videoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (err) {
      console.error("❌ Screen sharing error:", err);
    }
  };

  const sendStreamToViewer = (viewerId) => {
    console.log(`✅ Sending stream to Viewer ${viewerId}`);

    if (!streamRef.current) {
      console.error("❌ Stream not available.");
      return;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnections.current[viewerId] = peerConnection;

    // Add tracks from `streamRef.current`
    streamRef.current.getTracks().forEach((track) => {
      console.log("🎥 Adding track to connection:", track);
      peerConnection.addTrack(track, streamRef.current);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("📡 Broadcasting ICE Candidate:", event.candidate);
        socket.emit("candidate", {
          streamId,
          candidate: event.candidate,
          viewerId,
        });
      }
    };

    peerConnection
      .createOffer()
      .then((offer) => {
        console.log("📤 Sending WebRTC Offer to Viewer");
        return peerConnection.setLocalDescription(offer);
      })
      .then(() => {
        socket.emit("offer", {
          streamId,
          offer: peerConnection.localDescription,
          viewerId,
        });
      })
      .catch((error) => console.error("❌ WebRTC Offer Error:", error));
  };

  const stopStream = () => {
    socket.emit("stopStream", streamId);
    setIsStreaming(false);
    console.log(`🛑 Stopped stream: ${streamId}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    alert("📋 Link copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 space-y-8">
      <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
        Broadcasting Live
      </h1>

      {isStreaming && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-3/4 border my-4 shadow-lg"
            muted
          />
          <div className="flex gap-6">
            <button
              onClick={stopStream}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-full shadow-lg transform hover:scale-110 transition duration-300 ease-in-out"
            >
              Stop Stream
            </button>
            <button
              onClick={startScreenSharing}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-4 rounded-full shadow-lg transform hover:scale-110 transition duration-300 ease-in-out"
            >
              {isScreenSharing ? "Stop Sharing" : "Share Screen"}
            </button>
          </div>
        </>
      )}

      {!isStreaming && (
        <p className="text-red-500 text-lg mt-4">Stream has ended.</p>
      )}

      <div className="mt-6 w-full max-w-md bg-gray-100 p-4 rounded-lg shadow-lg text-center">
        <p className="mb-2 font-semibold text-gray-800">
          Share this Stream URL:
        </p>
        <div className="flex items-center">
          <input
            type="text"
            value={shareableUrl || "Waiting for Stream ID..."}
            readOnly
            className="border-2 px-2 py-1 w-full text-center text-gray-800 bg-transparent"
          />
          <button
            onClick={copyToClipboard}
            className="bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white px-4 py-2 ml-2 rounded-full shadow-lg"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export default Broadcast;
