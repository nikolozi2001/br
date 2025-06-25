const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/database');

// Get all sizes
router.get('/', async (req, res) => {
  try {
    const lang = req.query.lang || 'ge';
    const tableName = lang === 'en' ? 'Size_EN' : 'Size';
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`SELECT id, zoma FROM [register].[dbo].[${tableName}]`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
