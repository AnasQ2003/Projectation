const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

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
    version: '1.0.0',
    endpoints: '/api/*'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Projectation Backend server running on http://localhost:${PORT} (Connected to MS SQL Server)`);
});
