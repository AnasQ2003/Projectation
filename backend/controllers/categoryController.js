const { connectDB } = require('../db');

const DEFAULT_CATEGORIES = [
  'Software Development',
  'Fintech Mobile',
  'Artificial Intelligence',
  'Healthcare Cloud',
  'Cybersecurity',
  'Infrastructure & DevOps',
  'UI/UX Redesign'
];

async function listCategories(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT DISTINCT category FROM Projects WHERE category IS NOT NULL AND category != ''
    `);

    const dbCategories = result.recordset.map(r => r.category);
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCategories]));

    return res.json({
      categories: merged,
      total: merged.length
    });
  } catch (err) {
    return res.json({
      categories: DEFAULT_CATEGORIES,
      total: DEFAULT_CATEGORIES.length
    });
  }
}

module.exports = {
  listCategories
};
