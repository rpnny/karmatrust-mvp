/**
 * Main App Component
 * 
 * Sets up routing for the KarmaTrust frontend.
 * 
 * Routes:
 * - / : Home page (wallet input)
 * - /demo : Demo page without wallet
 * - /demo/:wallet : Demo page with wallet address (split-screen User View vs Bank View)
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
