import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/authContext";
import { FiCopy, FiMessageSquare, FiShare2, FiVideo, FiX } from "react-icons/fi";
import { API_URL } from "../config/url";
const socket = io(API_URL.BASE, {
  transports: ["websocket", "polling"],
});

function Broadcast() {
  const videoRef = useRef();
  const streamRef = useRef(null);
  const peerConnections = useRef({});
  const chatContainerRef = useRef(null);
  const [searchParams] = useSearchParams();

  const { user } = useAuth();
  const streamTitle = searchParams.get("title") || "Live Stream";
  const [streamId, setStreamId] = useState(null);
  const [shareableUrl, setShareableUrl] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [viewers, setViewers] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [superChatNotification, setSuperChatNotification] = useState(null);

  useEffect(() => {
    socket.emit("startStream", { title: streamTitle, userName: user?.name });

    socket.on("streamId", (id) => {
      setStreamId(id);
      setShareableUrl(id);
    });

    socket.on("viewerCount", ({ viewers }) => {
      setViewers(viewers);
    });

    socket.on("sendStream", ({ viewerId }) => {
      if (!streamRef.current)
        return setTimeout(() => sendStreamToViewer(viewerId), 1000);
      sendStreamToViewer(viewerId);
    });

    socket.on("answer", ({ viewerId, answer }) => {
      peerConnections.current[viewerId]?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("candidate", ({ viewerId, candidate }) => {
      peerConnections.current[viewerId]?.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    });

    socket.on("chatMessage", (message) => {
      setChatMessages((prev) => [...prev, message]);
      scrollChatToBottom();
    });

    socket.on("chatHistory", (history) => {
      setChatMessages(history);
    });

    socket.on("superChatNotification", (message) => {
      setSuperChatNotification(message);
      setTimeout(() => setSuperChatNotification(null), 5000);
    });

    startWebcam();

    return () => {
      socket.off("streamId");
      socket.off("sendStream");
      socket.off("answer");
      socket.off("candidate");
      socket.off("chatMessage");
      socket.off("chatHistory");
      socket.off("superChatNotification");
    };
  }, []);

  const scrollChatToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Webcam error:", err);
    }
  };

  const startScreenSharing = async () => {
    try {
      let newStream;
      if (isScreenSharing) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1280, height: 720 },
        });
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        screenStream.addTrack(micStream.getAudioTracks()[0]);
        newStream = screenStream;
      }

      streamRef.current = newStream;
      videoRef.current.srcObject = newStream;

      Object.values(peerConnections.current).forEach((pc) => {
        const videoSender = pc
          .getSenders()
          .find((s) => s.track?.kind === "video");
        const audioSender = pc
          .getSenders()
          .find((s) => s.track?.kind === "audio");
        if (videoSender)
          videoSender.replaceTrack(newStream.getVideoTracks()[0]);
        if (audioSender)
          audioSender.replaceTrack(newStream.getAudioTracks()[0]);
      });

      setIsScreenSharing(!isScreenSharing);
    } catch (err) {
      console.error("Screen sharing error:", err);
    }
  };

  const sendStreamToViewer = (viewerId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnections.current[viewerId] = pc;

    streamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, streamRef.current);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", {
          streamId,
          candidate: event.candidate,
          viewerId,
        });
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit("offer", {
          streamId,
          offer: pc.localDescription,
          viewerId,
        });
      })
      .catch(console.error);
  };

  const stopStream = () => {
    socket.emit("stopStream", streamId);
    setIsStreaming(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    alert("Stream URL copied to clipboard!");
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !streamId) return;
    socket.emit("chatMessage", {
      streamId,
      user: user?.name || "Host",
      message: chatInput.trim(),
      isSuper: false,
      amount: 0,
      timestamp: Date.now(),
    });
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Super Chat Notification */}
      {superChatNotification && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black p-4 rounded-xl shadow-lg z-50 animate-bounce max-w-xs border-2 border-yellow-300">
          <div className="font-bold flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span>SUPER CHAT!</span>
          </div>
          <div className="mt-1 text-sm">
            <span className="font-semibold">{superChatNotification.user}</span>:{" "}
            {superChatNotification.message}
          </div>
          <div className="text-xs font-bold text-yellow-900 mt-1">
            ₹{superChatNotification.amount}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Stream Area */}
          <div className="lg:w-2/3">
            <div className="bg-gray-900 rounded-xl p-4 shadow-lg border border-gray-800">
              {/* Stream Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-xl font-bold">{streamTitle}</h1>
                  <p className="text-sm text-gray-400">
                    Streaming as {user?.name || "Host"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                  <span className="bg-gray-800 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    <FiVideo className="text-gray-400" size={14} />
                    {viewers} viewers
                  </span>
                </div>
              </div>

              {/* Video Player */}
              {isStreaming ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-video bg-black rounded-lg border border-gray-800"
                  />
                  {/* Stream Controls */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={stopStream}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm font-medium"
                    >
                      <FiX size={16} />
                      End Stream
                    </button>
                    <button
                      onClick={startScreenSharing}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm font-medium ${
                        isScreenSharing
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      <FiShare2 size={16} />
                      {isScreenSharing ? "Stop Sharing" : "Share Screen"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-gray-800 aspect-video flex items-center justify-center rounded-lg border border-gray-700">
                  <div className="text-center p-6">
                    <p className="text-xl font-medium mb-2">Stream has ended</p>
                    <p className="text-gray-400 text-sm">
                      Thank you for streaming with StreamSync
                    </p>
                  </div>
                </div>
              )}

              {/* Share URL Section */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Share this stream URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareableUrl || "Generating stream URL..."}
                    readOnly
                    className="flex-grow bg-gray-800 border border-gray-700 rounded-l-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-r-lg flex items-center gap-1 text-sm font-medium"
                  >
                    <FiCopy size={16} />
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:w-1/3">
            <div className="bg-gray-900 rounded-xl p-4 shadow-lg border border-gray-800 h-full flex flex-col">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiMessageSquare className="text-indigo-400" />
                Live Chat
              </h2>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-grow overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
              >
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      msg.isSuper
                        ? "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-l-2 border-yellow-400"
                        : "bg-gray-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`font-medium text-sm ${
                          msg.isSuper ? "text-yellow-300" : "text-indigo-300"
                        }`}
                      >
                        {msg.user}
                      </span>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    {msg.isSuper && (
                      <div className="text-xs font-semibold text-yellow-300 mt-1">
                        💰 SUPER CHAT — ₹{msg.amount}
                      </div>
                    )}

                    <p
                      className={`mt-1 text-sm ${
                        msg.isSuper ? "text-yellow-200" : "text-gray-200"
                      }`}
                    >
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default Broadcast;
