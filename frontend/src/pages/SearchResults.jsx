import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import {
  FiSearch,
  FiUser,
  FiUsers,
  FiDollarSign,
  FiBook,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { API_URL } from "../config/url";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { token, user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL.SEARCH_USERS}?q=${encodeURIComponent(
            query
          )}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok && data.results.length > 0) {
          setResults(data.results);
          setNotFound(false);
        } else {
          setNotFound(true);
          setResults([]);
        }
      } catch (err) {
        console.error("Error fetching search results:", err.message);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (query.trim()) fetchResults();
    else {
      setResults([]);
      setNotFound(true);
      setLoading(false);
    }
  }, [query, token]);

  const handleSubscribe = async (creatorId) => {
    try {
      const res = await fetch(API_URL.SUBSCRIBE(creatorId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setResults((prev) =>
          prev.map((u) =>
            u._id === creatorId
              ? { ...u, followers: [...(u.followers || []), currentUser._id] }
              : u
          )
        );
      } else {
        alert(data.message || "Subscription failed.");
      }
    } catch (err) {
      console.error("Subscribe failed:", err.message);
    }
  };

  const handleUnsubscribe = async (creatorId) => {
    try {
      const res = await fetch(API_URL.UNSUBSCRIBE(creatorId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setResults((prev) =>
          prev.map((u) =>
            u._id === creatorId
              ? {
                  ...u,
                  followers: (u.followers || []).filter(
                    (f) => f !== currentUser._id
                  ),
                }
              : u
          )
        );
      } else {
        alert(data.message || "Unsubscribe failed.");
      }
    } catch (err) {
      console.error("Unsubscribe failed:", err.message);
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <FiSearch className="text-indigo-400" size={24} />
              Search Results
            </h1>
            <p className="text-gray-400 mt-1">
              Showing results for:{" "}
              <span className="text-indigo-300">"{query}"</span>
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiX size={16} />
            Back
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* No Results */}
        {!loading && notFound && (
          <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800 max-w-md mx-auto">
            <div className="text-indigo-400 mb-4">
              <FiSearch size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Results Found</h2>
            <p className="text-gray-400 mb-4">
              We couldn't find any matches for "{query}"
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg text-sm font-medium"
            >
              Return Home
            </button>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((user) => {
              const isCurrentUser = currentUser?._id === user._id;
              const isSubscribed = user.followers?.includes(currentUser._id);

              return (
                <div
                  key={user._id}
                  className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-indigo-500/30 transition-colors flex flex-col"
                >
                  {/* User Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      {user.role === "streamer" && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                          Creator
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Channel Info */}
                  {user.role === "streamer" && (
                    <div className="space-y-3 mb-6">
                      {user.channelName && (
                        <div className="flex items-start gap-2">
                          <FiUser
                            className="text-gray-500 mt-0.5 flex-shrink-0"
                            size={14}
                          />
                          <span className="text-sm text-gray-300">
                            <span className="font-medium">Channel:</span>{" "}
                            {user.channelName}
                          </span>
                        </div>
                      )}

                      {user.channelDescription && (
                        <div className="flex items-start gap-2">
                          <FiBook
                            className="text-gray-500 mt-0.5 flex-shrink-0"
                            size={14}
                          />
                          <span className="text-sm text-gray-300 line-clamp-2">
                            <span className="font-medium">About:</span>{" "}
                            {user.channelDescription}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <FiDollarSign className="text-gray-500" size={14} />
                        <span className="text-sm text-gray-300">
                          <span className="font-medium">Subscription:</span> ₹
                          {user.subscriptionCharge || 0}/month
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FiUsers className="text-gray-500" size={14} />
                        <span className="text-sm text-gray-300">
                          <span className="font-medium">Subscribers:</span>{" "}
                          {user.followers?.length || 0}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isCurrentUser && user.role === "streamer" && (
                    <div className="mt-auto">
                      {isSubscribed ? (
                        <button
                          onClick={() => handleUnsubscribe(user._id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <FiX size={16} />
                          Unsubscribe
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubscribe(user._id)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <FiCheck size={16} />
                          Subscribe
                        </button>
                      )}
                    </div>
                  )}

                  {/* View Profile Button */}
                  <button
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
