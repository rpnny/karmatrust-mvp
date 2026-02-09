/**
 * Express Application Configuration
 * 
 * Sets up middleware and routes for the KarmaTrust API.
 * 
 * Design Decisions:
 * - CORS enabled for frontend development (localhost:5173)
 * - JSON body parsing with size limit
 * - Request logging for debugging
 * - Error handling middleware at the end
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import routes
import creditRoutes from './routes/credit.js';
import zkpRoutes from './routes/zkp.js';
import vcsmRoutes from './routes/vcsm.js';
import contractRoutes from './routes/contracts.js';
import bridgeRoutes from './routes/bridge.js';
import reclaimRoutes from './routes/reclaim.js';
import paymasterRoutes from './routes/paymaster.js';

const app = express();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// JSON body parsing
app.use(express.json({ limit: '10mb' }));

// Request logging (simple version for hackathon)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString().slice(11, 23);
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: Date.now(),
      version: '0.1.0-mvp',
      service: 'karmatrust-api',
      endpoints: {
        credit: '/api/credit/*',
        zkp: '/api/zkp/*',
        vcsm: '/api/vcsm/*',
        contracts: '/api/contracts/*',
        bridge: '/api/bridge/*',
        reclaim: '/api/reclaim/*',
        paymaster: '/api/paymaster/*',
      },
    },
  });
});

// Credit scoring routes
app.use('/api/credit', creditRoutes);

// ZK proof routes
app.use('/api/zkp', zkpRoutes);

// VCSM routes
app.use('/api/vcsm', vcsmRoutes);

// Contract interaction routes
app.use('/api/contracts', contractRoutes);

// Bridge translation routes (TradFi ↔️ DeFi)
app.use('/api/bridge', bridgeRoutes);

// Reclaim Protocol routes (zkTLS data provenance)
app.use('/api/reclaim', reclaimRoutes);

// Paymaster routes (gas sponsorship)
app.use('/api/paymaster', paymasterRoutes);


// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    meta: { timestamp: Date.now() },
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    meta: { timestamp: Date.now() },
  });
});

export default app;
