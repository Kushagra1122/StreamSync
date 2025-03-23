import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

const handleLogin = async () => {
  setError("");

  try {
    const response = await fetch("http://localhost:9000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // Ensure response is valid JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      throw new Error(data.message || "Invalid credentials");
    }

    // Store auth token
    localStorage.setItem("authToken", data.token);

    // ✅ Redirect after successful login
    navigate("/");
  } catch (err) {
    setError(err.message);
  }
};


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white px-6">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 max-w-md w-full flex flex-col space-y-4">
        {/* Error Message */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Email Input */}
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 text-gray-900 bg-gray-100 border border-gray-500 rounded-lg outline-none"
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 text-gray-900 bg-gray-100 border border-gray-500 rounded-lg outline-none"
        />

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300"
        >
          Login
        </button>

        {/* Register Link */}
        <p className="text-center text-gray-400 text-sm mt-2">
          Don't have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/register")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
