/**
 * KarmaTrust Main Application Component
 * 
 * Defines the application routes:
 * - / : Home page (wallet input)
 * - /demo : Split-screen demo (User view + Bank view)
 * 
 * Design: Bloomberg terminal + OKX tech aesthetic
 */

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Demo from './pages/Demo';

function App() {
  return (
    <div className="min-h-screen bg-background text-white font-display">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </div>
  );
}

export default App;
