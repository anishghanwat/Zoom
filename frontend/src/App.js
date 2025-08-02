import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing.jsx';
import Authentication from './pages/Authentication.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing></Landing>} />
            <Route path="/auth" element={<Authentication></Authentication>} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
