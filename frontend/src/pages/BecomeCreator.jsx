import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useState } from "react";
import {
  FiUser,
  FiDollarSign,
  FiInfo,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import { API_URL } from "../config/url";

function BecomeCreator() {
  const { user, updateUserFromServer, token } = useAuth();
  const navigate = useNavigate();
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [subscriptionCharge, setSubscriptionCharge] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleBecomeCreator = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(API_URL.BECOME_CREATOR, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelName,
          channelDescription,
          subscriptionCharge: parseFloat(subscriptionCharge),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMessage("🎉 You are now a creator!");
      await updateUserFromServer?.();
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-8">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-400 flex items-center justify-center gap-2">
            <FiUser className="text-indigo-400" size={24} />
            Become a Creator
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Set up your channel to start streaming and connect with your
            audience
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Channel Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-500" size={16} />
              </div>
              <input
                type="text"
                placeholder="Your channel name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Channel Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Channel Description
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                <FiInfo className="text-gray-500" size={16} />
              </div>
              <textarea
                placeholder="Tell viewers about your channel"
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Subscription Charge */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Monthly Subscription Charge ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiDollarSign className="text-gray-500" size={16} />
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={subscriptionCharge}
                onChange={(e) => setSubscriptionCharge(e.target.value)}
                min={0}
                step={0.01}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Set to 0 for free subscriptions
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-lg flex items-center gap-2 ${
              message.startsWith("🎉")
                ? "bg-green-900/30 border border-green-800 text-green-400"
                : "bg-red-900/30 border border-red-800 text-red-400"
            }`}
          >
            {message.startsWith("🎉") ? (
              <FiCheck className="flex-shrink-0" />
            ) : (
              <span>⚠️</span>
            )}
            <span className="text-sm">{message}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleBecomeCreator}
          disabled={loading || !channelName.trim()}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
            loading
              ? "bg-indigo-600/60 cursor-not-allowed"
              : !channelName.trim()
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <span>Activate Creator Mode</span>
              <FiArrowRight className="ml-1" />
            </>
          )}
        </button>

        {/* Benefits */}
        <div className="pt-4 border-t border-gray-800">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Creator Benefits:
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">✓</span>
              <span>Go live and stream content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">✓</span>
              <span>Earn through subscriptions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">✓</span>
              <span>Access creator dashboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">✓</span>
              <span>Receive super chats from viewers</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BecomeCreator;
