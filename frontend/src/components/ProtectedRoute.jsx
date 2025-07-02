import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log("ProtectedRoute user:", user);
  if (loading) {
    return (
      <div className="text-center text-white h-screen flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
