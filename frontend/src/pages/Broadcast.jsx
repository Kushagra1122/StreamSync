import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:9000", {
  transports: ["websocket", "polling"],
});

function Broadcast() {
  const videoRef = useRef();
  const [searchParams] = useSearchParams();
  const streamTitle = searchParams.get("title") || "Live Stream";
  const peerConnections = useRef({});
  const [streamId, setStreamId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [shareableUrl, setShareableUrl] = useState("");
  const streamRef = useRef(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewers, setViewers] = useState(0);
  useEffect(() => {
    socket.emit("startStream", { title: streamTitle });
    socket.on("viewerCount", ({ streamId, viewers }) => {
      console.log(`👀 Viewer count updated: ${viewers}`);
      setViewers(viewers);
    });

    socket.on("streamId", (id) => {
      console.log(`✅ Stream started with ID: ${id}`);
      setStreamId(id);
      setShareableUrl(id);
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
      let newStream;

      if (isScreenSharing) {
        // Stop screen sharing and switch back to webcam
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true, // Re-enable microphone audio
        });
      } else {
        // Start screen sharing (without internal screen audio to prevent echo)
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false, // Prevents capturing internal screen audio
        });

        // Capture microphone separately
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Merge audio (mic) with video (screen)
        const newAudioTrack = micStream.getAudioTracks()[0];
        screenStream.addTrack(newAudioTrack);

        newStream = screenStream;
      }

      // Assign new stream to the video element
      streamRef.current = newStream;
      videoRef.current.srcObject = newStream;

      // Replace tracks in all peer connections
      Object.values(peerConnections.current).forEach((peerConnection) => {
        const senders = peerConnection.getSenders();

        // Replace video track
        const newVideoTrack = newStream.getVideoTracks()[0];
        const videoSender = senders.find(
          (sender) => sender.track?.kind === "video"
        );
        if (videoSender) videoSender.replaceTrack(newVideoTrack);

        // Replace audio track correctly
        const newAudioTrack = newStream
          .getAudioTracks()
          .find((track) => track.kind === "audio");
        const audioSender = senders.find(
          (sender) => sender.track?.kind === "audio"
        );

        if (audioSender && newAudioTrack) {
          audioSender.replaceTrack(newAudioTrack);
        }
      });

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
    <div className="flex flex-col items-center min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white space-y-6">
      <h1 className="text-4xl font-bold animate-fadeIn">
        🎥 Broadcasting Live
      </h1>
      <h2 className="text-xl text-gray-300">{streamTitle}</h2>
      <p className="text-lg font-semibold">
        👀 Viewers: <span className="text-green-400">{viewers}</span>
      </p>

      {isStreaming && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-11/12 max-w-3xl border-4 border-gray-700 rounded-lg shadow-xl my-4"
            muted
          />
          <div className="flex flex-wrap gap-4">
            <button
              onClick={stopStream}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              ⛔ Stop Stream
            </button>
            <button
              onClick={startScreenSharing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              {isScreenSharing ? "🛑 Stop Sharing" : "📡 Share Screen"}
            </button>
          </div>
        </>
      )}

      {!isStreaming && (
        <p className="text-red-400 text-lg mt-4 font-semibold">
          Stream has ended.
        </p>
      )}

      <div className="mt-6 w-full max-w-lg bg-gray-100 p-4 rounded-lg shadow-lg text-center text-gray-900">
        <p className="mb-2 font-semibold">📎 Share this Stream Id:</p>
        <div className="flex items-center bg-white border rounded-lg overflow-hidden shadow-md">
          <input
            type="text"
            value={shareableUrl || "Waiting for Stream ID..."}
            readOnly
            className="w-full px-3 py-2 text-center bg-gray-50 text-gray-800"
          />
          <button
            onClick={copyToClipboard}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
          >
            📋 Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export default Broadcast;
