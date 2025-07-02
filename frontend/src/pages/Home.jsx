import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { FiSearch, FiVideo } from "react-icons/fi";

export default function Home() {
  const [streamId, setStreamId] = useState("");
  const [streamTitle, setStreamTitle] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartBroadcast = () => {
    if (!streamTitle.trim()) return alert("Please enter a stream title");
    navigate(`/broadcast?title=${encodeURIComponent(streamTitle.trim())}`);
  };

  const handleWatchStream = () => {
    if (!streamId.trim()) return;
    navigate(`/watch/${streamId.trim()}`);
  };

  return (
    <div className="h-screen items-center flex bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Welcome to <span className="text-indigo-400">StreamSync</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Go Live. Watch your favorite creators. Experience real-time
            streaming like never before.
          </p>
        </div>

        {/* Action Cards */}
        <div
          className={`${
            user?.role === "streamer"
              ? "grid grid-cols-1 md:grid-cols-2 gap-6"
              : "flex justify-center"
          } max-w-4xl mx-auto`}
        >
          {/* Broadcast Section - Only shown for streamers */}
          {user?.role === "streamer" && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-indigo-500/50 transition-colors">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-full bg-indigo-500/10 mr-4">
                  <FiVideo className="h-6 w-6 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold">Start a Broadcast</h2>
              </div>
              <input
                type="text"
                placeholder="Enter stream title"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              />
              <button
                onClick={handleStartBroadcast}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <FiVideo className="mr-2 h-5 w-5" />
                Go Live
              </button>
            </div>
          )}

          {/* Watch Section - Centered for viewers, normal position for streamers */}
          <div
            className={`bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-teal-500/50 transition-colors ${
              user?.role !== "streamer" ? "w-full max-w-md" : ""
            }`}
          >
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-teal-500/10 mr-4">
                <FiSearch className="h-6 w-6 text-teal-400" />
              </div>
              <h2 className="text-xl font-bold">Watch a Stream</h2>
            </div>
            <input
              type="text"
              placeholder="Enter stream ID"
              value={streamId}
              onChange={(e) => setStreamId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-4"
            />
            <button
              onClick={handleWatchStream}
              disabled={!streamId.trim()}
              className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors flex items-center justify-center ${
                streamId.trim()
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-gray-700 cursor-not-allowed"
              }`}
            >
              <FiSearch className="mr-2 h-5 w-5" />
              Watch Now
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Powered by{" "}
            <span className="text-indigo-400 font-medium">StreamSync</span> ·
            Seamless, scalable streaming.
          </p>
        </div>
      </div>
    </div>
  );
}
