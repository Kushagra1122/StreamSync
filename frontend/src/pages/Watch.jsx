import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/authContext";
import { FiCopy, FiVideo, FiMessageSquare, FiArrowLeft } from "react-icons/fi";

import { API_URL } from "../config/url";
const socket = io(API_URL.BASE, {
  transports: ["websocket", "polling"],
});
function Watch() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const peerConnection = useRef(null);
  const { user } = useAuth();
  const [hostName, setHostName] = useState("Host");

  const [streamTitle, setStreamTitle] = useState("Loading...");
  const [streamNotFound, setStreamNotFound] = useState(false);
  const [streamEnded, setStreamEnded] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSuperChat, setIsSuperChat] = useState(false);
  const [superChatAmount, setSuperChatAmount] = useState(5);

  useEffect(() => {
    socket.emit("watchStream", streamId);

    socket.on("streamTitle", (title) => setStreamTitle(title));
    socket.on("viewerCount", ({ viewers }) => setViewers(viewers));
    socket.on("streamNotFound", () => setStreamNotFound(true));
    socket.on("streamEnded", () => setStreamEnded(true));
    socket.on("streamHost", (name) => setHostName(name));
    socket.on("chatHistory", (history) => {
      setChatMessages(history);
      scrollChatToBottom();
    });
    socket.on("chatMessage", (message) => {
      setChatMessages((prev) => [...prev, message]);
      scrollChatToBottom();
    });

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", { streamId, candidate: event.candidate });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    socket.on("offer", async ({ viewerId, offer }) => {
      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", { streamId, answer, viewerId });
      } catch (error) {
        console.error("WebRTC offer error:", error);
      }
    });

    socket.on("candidate", ({ candidate }) => {
      peerConnection.current
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch((err) => console.error("ICE error:", err));
    });

    return () => {
      socket.emit("leaveStream", streamId);
      socket.off("streamTitle");
      socket.off("viewerCount");
      socket.off("streamNotFound");
      socket.off("streamEnded");
      socket.off("offer");
      socket.off("candidate");
      socket.off("chatMessage");
      socket.off("chatHistory");

      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [streamId]);

  const scrollChatToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const leaveStream = () => {
    socket.emit("leaveStream", streamId);
    navigate("/");
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !streamId) return;

    socket.emit("chatMessage", {
      streamId,
      user: user?.name || "Viewer",
      message: chatInput.trim(),
      isSuper: isSuperChat,
      amount: isSuperChat ? superChatAmount : 0,
      timestamp: Date.now(),
    });

    setChatInput("");
    setIsSuperChat(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-6">
        {streamNotFound ? (
          <div className="max-w-md mx-auto bg-gray-900 rounded-xl p-8 text-center shadow-lg border border-gray-800">
            <h1 className="text-2xl font-bold text-red-400 mb-3">
              Stream Not Found
            </h1>
            <p className="mb-6 text-gray-400">
              The stream you're looking for doesn't exist or has ended.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-indigo-600 hover:bg-indigo-700 transition px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto"
            >
              <FiArrowLeft size={16} />
              Go Back Home
            </button>
          </div>
        ) : streamEnded ? (
          <div className="max-w-md mx-auto bg-gray-900 rounded-xl p-8 text-center shadow-lg border border-gray-800">
            <h1 className="text-2xl font-bold text-yellow-400 mb-3">
              Stream Ended
            </h1>
            <p className="mb-6 text-gray-400">
              The host has ended the live stream.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-indigo-600 hover:bg-indigo-700 transition px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto"
            >
              <FiArrowLeft size={16} />
              Go Back Home
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Video Section */}
            <div className="lg:w-2/3">
              <div className="bg-gray-900 rounded-xl p-4 shadow-lg border border-gray-800">
                {/* Stream Header */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h1 className="text-xl font-bold">{streamTitle}</h1>
                    <p className="text-sm text-gray-400">
                      Hosted by{" "}
                      <span className="text-indigo-300">{hostName}</span>
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
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  controls
                  className="w-full aspect-video bg-black rounded-lg border border-gray-800"
                />

                {/* Leave Button */}
                <button
                  onClick={leaveStream}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white w-full py-2 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <FiArrowLeft size={16} />
                  Leave Stream
                </button>
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

                {/* Super Chat Controls */}
                <div className="mb-4">
                  <label className="flex items-center cursor-pointer gap-3 mb-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSuperChat}
                        onChange={() => setIsSuperChat(!isSuperChat)}
                      />
                      <div
                        className={`w-12 h-6 rounded-full transition ${
                          isSuperChat ? "bg-yellow-500" : "bg-gray-700"
                        }`}
                      />
                      <div
                        className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                          isSuperChat ? "translate-x-6" : ""
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {isSuperChat ? "Super Chat" : "Normal Message"}
                    </span>
                  </label>

                  {isSuperChat && (
                    <div className="mb-4">
                      <label className="block text-xs text-gray-400 mb-1">
                        Amount: ₹{superChatAmount}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="500"
                        step="5"
                        value={superChatAmount}
                        onChange={(e) =>
                          setSuperChatAmount(Number(e.target.value))
                        }
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                      />
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder={
                      isSuperChat ? "Send a Super Chat..." : "Type a message..."
                    }
                  />
                  <button
                    onClick={sendMessage}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      isSuperChat
                        ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {isSuperChat ? "💰" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Watch;
