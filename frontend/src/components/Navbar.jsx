import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiSearch,
  FiVideo,
  FiUserPlus,
  FiUsers,
  FiPlusCircle,
  FiLogOut,
  FiLogIn,
} from "react-icons/fi";
import { RiLiveLine } from "react-icons/ri";
import { useAuth } from "../context/authContext";
import debounce from "lodash.debounce";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const suggestionsRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, loading, token } = useAuth();

  const firstNameInitial = user?.name?.charAt(0).toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      try {
        const res = await fetch(
          `http://localhost:9000/api/user/search?q=${encodeURIComponent(
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
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("❌ Error fetching suggestions:", err.message);
      }
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      fetchSuggestions(value.trim());
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }

      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-gray-900 text-white border-b border-gray-800 sticky top-0 z-50 shadow-lg">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="flex items-center text-xl font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <RiLiveLine className="h-6 w-6 mr-2" />
              <span className="hidden sm:inline">StreamSync</span>
              <span className="inline sm:hidden">SS</span>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <form
              onSubmit={handleSearchSubmit}
              className="relative"
              autoComplete="off"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search streams, creators..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  ref={suggestionsRef}
                  className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((user) => (
                    <li
                      key={user._id}
                      onClick={() =>
                        handleSuggestionClick(user.channelName || user.name)
                      }
                      className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
                    >
                      <span className="font-medium text-white">
                        {user.name}
                      </span>
                      {user.channelName && (
                        <span className="ml-2 text-sm text-gray-400">
                          @{user.channelName}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </div>

          {/* Right: Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center"
            >
              <FiHome className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            {user && (
              <Link
                to="/subscriptions"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center"
              >
                <FiUsers className="mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Subscriptions</span>
              </Link>
            )}

            {user?.role === "streamer" && (
              <Link
                to="/broadcast"
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center"
              >
                <FiVideo className="mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Go Live</span>
              </Link>
            )}

            {user?.role === "viewer" && (
              <Link
                to="/become-creator"
                className="px-3 py-2 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center"
              >
                <FiPlusCircle className="mr-2 h-5 w-5" />
                <span className="hidden sm:inline">Become Creator</span>
              </Link>
            )}

            {!loading && user ? (
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                >
                  <span className="text-sm font-medium text-white">
                    {firstNameInitial}
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Link
                        to={`/profile/${user._id}`}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      {user.role === "streamer" && (
                        <Link
                          to="/creator-dashboard"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Creator Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-white"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !loading ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors hidden sm:block"
                >
                  <FiLogIn className="mr-2 h-5 w-5 inline" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium text-indigo-400 border border-indigo-400 hover:bg-indigo-900/30 transition-colors hidden sm:block"
                >
                  <FiUserPlus className="mr-2 h-5 w-5 inline" />
                  Sign Up
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
