import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(
          "http://localhost:9000/api/auth/session",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.authenticated) {
          setUser({ userId: response.data.userId });
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.log("Session expired or invalid token");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
