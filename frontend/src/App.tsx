/**
 * Main App Component
 * 
 * Sets up routing for the KarmaTrust frontend.
 * 
 * Routes:
 * - / : Home page (wallet input)
 * - /demo : Demo page without wallet
 * - /demo/:wallet : Demo page with wallet address
 */

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Demo from './pages/Demo';
import Journey from './pages/Journey';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/demo/:wallet" element={<Demo />} />
      <Route path="/journey" element={<Journey />} />
    </Routes>
  );
}

export default App;
