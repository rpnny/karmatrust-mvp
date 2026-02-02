/**
 * Main App Component
 * 
 * Sets up routing for the KarmaTrust frontend.
 * 
 * Routes:
 * - / : Home page (wallet input)
 * - /demo : Dual-view demo (User vs Bank/Protocol)
 * - /demo/:wallet : Dual-view demo with wallet
 * 
 * Demo showcases complete tech stack:
 * - VCSM state machine
 * - ZK Proofs (Groth16)
 * - EAS Attestations
 * - Bridge Translation (TradFi ↔️ DeFi)
 */

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Demo from './pages/Demo';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/demo/:wallet" element={<Demo />} />
    </Routes>
  );
}

export default App;
