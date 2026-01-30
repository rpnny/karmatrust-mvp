/**
 * Express Application Configuration
 * 
 * Sets up middleware and routes for the KarmaTrust API.
 * 
 * Design Decisions:
 * - CORS enabled for frontend development (localhost:5173)
 * - JSON body parsing with size limit
 * - Error handling middleware at the end
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import routes (will be implemented in subsequent commits)
// import creditRoutes from './routes/credit.js';
// import vcsmRoutes from './routes/vcsm.js';
// import zkpRoutes from './routes/zkp.js';

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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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
    },
  });
});

// API routes (to be implemented)
// app.use('/api/credit', creditRoutes);
// app.use('/api/vcsm', vcsmRoutes);
// app.use('/api/zkp', zkpRoutes);

// Placeholder routes (will be replaced)
app.get('/api/credit/score', (_req: Request, res: Response) => {
  res.json({
    success: false,
    error: 'Credit scoring service not yet implemented',
    meta: { timestamp: Date.now() },
  });
});

app.post('/api/credit/attest', (_req: Request, res: Response) => {
  res.json({
    success: false,
    error: 'EAS attestation service not yet implemented',
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
