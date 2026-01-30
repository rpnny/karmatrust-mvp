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
// import vcsmRoutes from './routes/vcsm.js';     // Coming next
// import zkpRoutes from './routes/zkp.js';       // Coming later

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
        vcsm: '/api/vcsm/* (coming soon)',
        zkp: '/api/zkp/* (coming soon)',
      },
    },
  });
});

// Credit scoring routes
app.use('/api/credit', creditRoutes);

// VCSM routes (placeholder until implemented)
app.post('/api/vcsm/init', (_req: Request, res: Response) => {
  res.json({
    success: false,
    error: 'VCSM service not yet implemented',
    meta: { timestamp: Date.now() },
  });
});

app.get('/api/vcsm/state/:userId', (_req: Request, res: Response) => {
  res.json({
    success: false,
    error: 'VCSM service not yet implemented',
    meta: { timestamp: Date.now() },
  });
});

// ZKP routes (placeholder until implemented)
app.post('/api/zkp/verify', (_req: Request, res: Response) => {
  res.json({
    success: false,
    error: 'ZKP service not yet implemented',
    meta: { timestamp: Date.now() },
  });
});

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
