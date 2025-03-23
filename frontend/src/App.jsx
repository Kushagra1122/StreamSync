import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import Home from "./pages/Home";
import Broadcast from "./pages/Broadcast";
import Watch from "./pages/Watch";



function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/broadcast" element={<Broadcast />} />
          <Route path="/watch/:streamId" element={<Watch />} />
         
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
