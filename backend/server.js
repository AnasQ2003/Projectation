const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const apiRoutes = require('./routes');
const {
  safeLoggerMiddleware,
  decryptPayloadMiddleware,
  encryptResponseMiddleware
} = require('./utils/crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Request logger
app.use(safeLoggerMiddleware);

// Decrypt incoming encrypted request bodies
app.use(decryptPayloadMiddleware);

// Encrypt all outgoing JSON responses — hides data in DevTools Network tab
app.use(encryptResponseMiddleware);

// Connect to SQL Server
connectDB().catch(err => {
  console.error('Failed to initialize SQL Server on startup:', err.message);
});

// API routes
app.use('/api', apiRoutes);

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Projectation API Server running', version: '2.0.0', endpoints: '/api/*' });
});

app.listen(PORT, () => {
  console.log(`Projectation Backend server running on http://localhost:${PORT} (Connected to MS SQL Server)`);
});
