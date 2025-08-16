import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Page Components
import Landing from './pages/Landing.jsx';
import Home from './pages/Home.jsx';
import Authentication from './pages/Authentication.jsx';
import VideoMeet from './pages/VideoMeet.jsx';
import History from './pages/History.jsx';

// Context Provider for Authentication
import { AuthProvider } from './contexts/AuthContext.jsx';

/**
 * Main App Component
 * ------------------
 * Handles all routing and wraps the app with global providers.
 */
function App() {
  return (
    <Router>
      {/* Global Auth Context Provider */}
      <AuthProvider>
        <Routes>
          {/* Landing Page (default route) */}
          <Route path="/" element={<Landing />} />

          {/* Authentication Page */}
          <Route path="/auth" element={<Authentication />} />

          {/* Home Page */}
          <Route path="/home" element={<Home />} />

          {/* History Page */}
          <Route path="/history" element={<History />} />

          {/* Video Meeting Room - dynamic URL */}
          <Route path="/:url" element={<VideoMeet />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
