import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [streamId, setStreamId] = useState("");
  const [streamTitle, setStreamTitle] = useState("");
  const [showTitleInput, setShowTitleInput] = useState(false);
  const navigate = useNavigate();

  const handleStartBroadcast = () => {
    if (streamTitle.trim()) {
      navigate(`/broadcast?title=${encodeURIComponent(streamTitle)}`);
    } else {
      alert("Please enter a stream title");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 p-6 space-y-8 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg animate__animated animate__fadeInDown">
        Live Streaming
      </h1>

      {!showTitleInput ? (
        <button
          onClick={() => setShowTitleInput(true)}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg text-lg transform hover:scale-105 transition duration-300 ease-in-out animate__animated animate__zoomIn"
        >
          Start Broadcast
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <input
            type="text"
            placeholder="Enter Stream Title"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
            className="border-2 border-gray-400 text-white bg-transparent rounded-xl px-6 py-3 w-full md:w-72 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 text-lg transition-transform transform hover:scale-105"
          />
          <button
            onClick={handleStartBroadcast}
            className="bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg text-lg transform hover:scale-105 transition duration-300 ease-in-out animate__animated animate__zoomIn"
          >
            Go Live
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 w-full md:w-auto">
        <input
          type="text"
          placeholder="Enter Stream ID"
          value={streamId}
          onChange={(e) => setStreamId(e.target.value)}
          className="border-2 border-gray-400 text-white bg-transparent rounded-xl px-6 py-3 w-full md:w-72 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 text-lg transition-transform transform hover:scale-105"
        />
        <button
          onClick={() => navigate(`/watch/${streamId}`)}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-full shadow-lg text-lg transform hover:scale-105 transition duration-300 ease-in-out animate__animated animate__zoomIn"
          disabled={!streamId.trim()}
        >
          Watch Stream
        </button>
      </div>
    </div>
  );
}

export default Home;
