/**
 * Main App Component
 * 
 * Sets up routing for the KarmaTrust frontend.
 * 
 * Routes:
 * - / : Home page (wallet input + demo mode selection)
 * - /demo : Dual-view demo (User vs Bank)
 * - /demo/:wallet : Dual-view demo with wallet
 * - /bridge : Bridge demo (TradFi ↔️ DeFi)
 * - /bridge/:wallet : Bridge demo with wallet
 */

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Demo from './pages/Demo';
import DemoBridge from './pages/DemoBridge';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/demo/:wallet" element={<Demo />} />
      <Route path="/bridge" element={<DemoBridge />} />
      <Route path="/bridge/:wallet" element={<DemoBridge />} />
    </Routes>
  );
}

export default App;
