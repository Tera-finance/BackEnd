import express from 'express';
import cors from 'cors';
import { config } from './utils/config.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import blockchainRoutes from './routes/blockchain.routes.simple.js';
import exchangeRoutes from './routes/exchange.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

const app = express();

// Simple test endpoint before any middleware
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Security middleware
// Using individual helmet middleware to avoid ESM import issues
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// CORS configuration - allow frontend localhost and mini apps
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? [
        'https://trustbridge.izcy.tech',
        'https://api-trustbridge.izcy.tech',
        'https://tera-finance.vercel.app',
        'https://tera-finance-backend.vercel.app'
      ]
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TrustBridge Backend API - Base Sepolia',
    version: '2.0.0',
    network: config.blockchain.network,
    chainId: config.blockchain.chainId,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    network: config.blockchain.network,
    chainId: config.blockchain.chainId,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/transactions', transactionRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);

  // Multer error handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

export default app;
