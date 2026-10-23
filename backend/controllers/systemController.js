const { connectDB } = require('../db');

/**
 * System Controller — High-speed status, ping, and health telemetry
 */

async function ping(req, res) {
  return res.json({
    pong: true,
    server: 'Projectation API Engine',
    timestamp: Date.now()
  });
}

async function getHealth(req, res) {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  try {
    const pool = await connectDB();
    if (pool && pool.connected) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }
  const dbLatencyMs = Date.now() - startTime;

  return res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    uptime: Math.round(process.uptime()),
    database: {
      engine: 'Microsoft SQL Server',
      status: dbStatus,
      latencyMs: dbLatencyMs
    },
    transport: {
      encryption: 'AES/XOR-Byte64 Transport Layer',
      status: 'active'
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  ping,
  getHealth
};
