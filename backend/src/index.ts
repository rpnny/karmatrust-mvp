/**
 * KarmaTrust Backend Server Entry Point
 * 
 * This is the main entry point for the Express.js API server.
 * 
 * Responsibilities:
 * - Load environment variables
 * - Start HTTP server
 * - Log startup information
 */

import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🏆 KarmaTrust API Server');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✓ Server running on port ${PORT}`);
  console.log(`  ✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('  Endpoints:');
  console.log('  ├── GET  /api/health          - Health check');
  console.log('  ├── GET  /api/credit/score    - Calculate credit score');
  console.log('  ├── POST /api/credit/attest   - Create EAS attestation');
  console.log('  ├── POST /api/vcsm/init       - Initialize VCSM state');
  console.log('  ├── GET  /api/vcsm/state/:id  - Get current state');
  console.log('  └── POST /api/zkp/verify      - Verify ZK proof');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});
