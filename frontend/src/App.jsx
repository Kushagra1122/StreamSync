import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import Home from "./pages/Home";
import Broadcast from "./pages/Broadcast";
import Watch from "./pages/Watch";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import BecomeCreator from "./pages/BecomeCreator";
import SearchResults from "./pages/SearchResults";
import Subscribe from "./pages/SubscribedUsers";
import SubscribedUsers from "./pages/SubscribedUsers";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/broadcast"
            element={
              <ProtectedRoute>
                <Broadcast />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watch/:streamId"
            element={
              <ProtectedRoute>
                <Watch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/become-creator"
            element={
              <ProtectedRoute>
                <BecomeCreator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute>
                <SubscribedUsers />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
