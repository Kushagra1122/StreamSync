import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config/url"; // Example: { LOGIN: "/api/users/login", ... }

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  let token = localStorage.getItem("authToken");

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      token = localStorage.getItem("authToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(API_URL.PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.user) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem("authToken");
        }
      } catch (error) {
        console.error("Session check failed:", error.message);
        localStorage.removeItem("authToken");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

    const updateUserFromServer = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const response = await axios.get(API_URL.PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Failed to update user from server:", error.message);
      }
    };

  // Login
  const login = async ({ email, password }) => {
    try {
      const response = await axios.post(API_URL.LOGIN, { email, password });
      const { token, user } = response.data;

      localStorage.setItem("authToken", token);
      setUser(user);
      return user;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  // Register + auto login
  const register = async ({ name, email, password }) => {
    try {
      const response = await axios.post(API_URL.REGISTER, {
        name,
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem("authToken", token);
      setUser(user);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout,updateUserFromServer,token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
