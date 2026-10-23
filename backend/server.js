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

// Security & Cleanliness
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['X-Encrypted-Transport', 'Content-Length', 'Content-Type']
}));
app.use(express.json({ limit: '10mb' }));
app.use(safeLoggerMiddleware);
app.use(decryptPayloadMiddleware);
app.use(encryptResponseMiddleware);

// Ensure SQL Server is connected on boot
connectDB().catch(err => {
  console.error('Failed to initialize SQL Server on startup:', err.message);
});

// Mount All API Routes from routes.js
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Projectation API Server running',
    version: '2.0.0',
    endpoints: '/api/*'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Projectation Backend server running on http://localhost:${PORT} (Connected to MS SQL Server)`);
});
