import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing.jsx';
import Authentication from './pages/Authentication.jsx';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Landing></Landing>} />
          <Route path="/auth" element={<Authentication></Authentication>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
