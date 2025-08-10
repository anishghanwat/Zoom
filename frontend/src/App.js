import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Page Components
import Landing from './pages/Landing.jsx';
import Authentication from './pages/Authentication.jsx';
import VideoMeet from './pages/VideoMeet.jsx';

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

          {/* Video Meeting Room - dynamic URL */}
          <Route path="/:url" element={<VideoMeet />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
