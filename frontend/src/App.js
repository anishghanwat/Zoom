import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing.jsx';
import Authentication from './pages/Authentication.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import VideoMeet from './pages/VideoMeet.jsx';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing></Landing>} />
            <Route path="/auth" element={<Authentication></Authentication>} />
            <Route path="/:url" element={<VideoMeet></VideoMeet>} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
