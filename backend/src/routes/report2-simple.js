const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const lang = req.query.lang || 'ge';
    const tableName = lang === 'en' ? 'Rpt_2_EN' : 'Rpt_2';
    const pool = await poolPromise;

    // Simple version without optimizations first
    const request = pool.request();
    request.timeout = 30000; // 30 seconds timeout
    
    // Get totals
    const totalsResult = await request.query(`
      SELECT 
        COUNT(*) as total_registered,
        SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as total_active
      FROM [register].[dbo].[DocMain]
    `);

    // Get report data
    const reportResult = await pool.request().query(`
      SELECT 
        ID, 
        Legal_Form, 
        Registered_Qty, 
        Active_Qty
      FROM [register].[dbo].[${tableName}]
      ORDER BY ID
    `);

    const totals = totalsResult.recordset[0];
    const rows = reportResult.recordset.map(row => ({
      ID: row.ID,
      Legal_Form: row.Legal_Form,
      Registered_Qty: row.Registered_Qty,
      Active_Qty: row.Active_Qty,
      Registered_Percent: totals.total_registered > 0 ? 
        Math.round((row.Registered_Qty / totals.total_registered) * 1000) / 10 : 0,
      Active_Percent: totals.total_active > 0 ? 
        Math.round((row.Active_Qty / totals.total_active) * 1000) / 10 : 0
    }));

    res.json({
      totals,
      rows
    });

  } catch (err) {
    console.error('Report2 API Error:', err);
    res.status(500).json({ 
      error: 'Internal server error. Please contact support if the problem persists.',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
