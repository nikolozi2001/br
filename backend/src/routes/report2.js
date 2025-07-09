const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const lang = req.query.lang || 'ge';
    const tableName = lang === 'en' ? 'Rpt_2_EN' : 'Rpt_2';
    const pool = await poolPromise;

    // Execute both queries in parallel
    const [docMainTotals, result] = await Promise.all([
      pool.request().query(`
        SELECT 
          COUNT(*) as total_registered,
          SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as total_active
        FROM [register].[dbo].[DocMain]
      `),
      pool.request().query(`
        SELECT 
          ID, 
          Legal_Form, 
          Registered_Qty, 
          Active_Qty,
          CAST(ROUND(CAST(Registered_Qty as float) * 100 / 
            (SELECT COUNT(*) FROM [register].[dbo].[DocMain]), 1) as decimal(10,1)) as Registered_Percent,
          CAST(ROUND(CAST(Active_Qty as float) * 100 / 
            (SELECT SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) FROM [register].[dbo].[DocMain]), 1) as decimal(10,1)) as Active_Percent
        FROM [register].[dbo].[${tableName}]
      `)
    ]);

    return res.json({
      totals: docMainTotals.recordset[0],
      rows: result.recordset
    });

    const data = {
      totals: totalResult.recordset[0],
      rows: result.recordset
    };

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
