import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing.jsx';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Landing></Landing>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
