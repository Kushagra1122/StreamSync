import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { FiUser, FiUsers, FiVideo, FiMail, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/url";
function SubscribedUsers() {
  const { user, token } = useAuth();
  const [followedUsers, setFollowedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      try {
        setLoading(true);
        if (!user?.following || user.following.length === 0) {
          setFollowedUsers([]);
          return;
        }

        const response = await fetch(API_URL.FOLLOWING_DETAILS,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ids: user.following }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        setFollowedUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching followed users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowedUsers();
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (followedUsers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
          <FiUsers className="mx-auto text-indigo-400" size={48} />
          <h2 className="text-xl font-bold mt-4 mb-2">No Subscriptions Yet</h2>
          <p className="text-gray-400 mb-6">
            You haven't subscribed to any streamers yet. Discover creators to
            follow!
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg font-medium"
          >
            Browse Streamers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FiVideo className="text-indigo-400" size={28} />
              Your Subscriptions
            </h1>
            <p className="text-gray-400 mt-2">
              Creators you're supporting ({followedUsers.length})
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiArrowRight size={16} />
            Discover More
          </button>
        </div>

        {/* Streamers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {followedUsers.map((streamer) => (
            <div
              key={streamer._id}
              className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-indigo-500/30 transition-colors flex flex-col"
            >
              {/* Streamer Info */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                    {streamer.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{streamer.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <FiMail size={14} />
                    <span className="truncate">{streamer.email}</span>
                  </div>
                </div>
              </div>

              {/* Channel Info (if available) */}
              {streamer.channelName && (
                <div className="mb-4">
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">Channel:</span>{" "}
                    {streamer.channelName}
                  </div>
                  {streamer.channelDescription && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {streamer.channelDescription}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-auto space-y-2">
                <button
                  onClick={() => navigate(`/profile/${streamer._id}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <FiUser size={16} />
                  View Profile
                </button>
                <button
                  onClick={() => navigate(`/watch/${streamer._id}`)} // Assuming this is the watch route
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <FiVideo size={16} />
                  Watch Stream
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubscribedUsers;
