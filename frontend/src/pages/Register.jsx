import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api"; // Import API function

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await registerUser({ name, email, password });
      setMessage("Registration successful! Redirecting to login...");

      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white px-6">
      <h2 className="text-3xl font-bold mb-6">Register</h2>

      <form
        onSubmit={handleRegister}
        className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 max-w-md w-full flex flex-col space-y-4"
      >
        {/* Name Input */}
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-3 text-gray-900 bg-gray-100 border border-gray-500 rounded-lg outline-none"
        />

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 text-gray-900 bg-gray-100 border border-gray-500 rounded-lg outline-none"
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 text-gray-900 bg-gray-100 border border-gray-500 rounded-lg outline-none"
        />

        {/* Register Button */}
        <button
          type="submit"
          className="w-full py-3 text-lg font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-300"
        >
          Register
        </button>

        {/* Message Display */}
        {message && <p className="text-sm text-center mt-2">{message}</p>}

        {/* Redirect to Login */}
        <p className="text-center text-gray-400 text-sm mt-2">
          Already have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
