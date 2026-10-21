const { fetchGlobalStats } = require('../models/statsModel');

async function getStats(req, res) {
  try {
    const stats = await fetchGlobalStats();
    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

module.exports = { getStats };
