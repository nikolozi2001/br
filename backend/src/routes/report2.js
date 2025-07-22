const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/database');
const { 
  validateLanguage, 
  reportCacheManager 
} = require('../utils/performanceUtils');

// Simple cached route without middleware for now
router.get('/', async (req, res) => {
  try {
    const lang = validateLanguage(req.query.lang);
    const cacheKey = `report2_${lang}`;

    // Check cache first
    const cachedData = reportCacheManager.get(cacheKey);
    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    const tableName = lang === 'en' ? 'Rpt_2_EN' : 'Rpt_2';
    const pool = await poolPromise;

    // Create request with timeout
    const request = pool.request();
    request.timeout = 30000; // 30 seconds timeout
    
    // Optimized single query with CTE to avoid redundant subqueries
    const optimizedQuery = `
      WITH DocMainStats AS (
        SELECT 
          COUNT(*) as total_registered,
          SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as total_active
        FROM [register].[dbo].[DocMain] WITH (NOLOCK)
      )
      SELECT 
        'totals' as data_type,
        NULL as ID,
        NULL as Legal_Form,
        total_registered as Registered_Qty,
        total_active as Active_Qty,
        100.0 as Registered_Percent,
        100.0 as Active_Percent
      FROM DocMainStats
      
      UNION ALL
      
      SELECT 
        'detail' as data_type,
        r.ID, 
        r.Legal_Form, 
        r.Registered_Qty, 
        r.Active_Qty,
        CAST(ROUND(CAST(r.Registered_Qty as float) * 100.0 / s.total_registered, 1) as decimal(10,1)) as Registered_Percent,
        CAST(ROUND(CAST(r.Active_Qty as float) * 100.0 / NULLIF(s.total_active, 0), 1) as decimal(10,1)) as Active_Percent
      FROM [register].[dbo].[${tableName}] r WITH (NOLOCK)
      CROSS JOIN DocMainStats s
      ORDER BY data_type, ID
    `;

    const result = await request.query(optimizedQuery);
    
    // Process results
    const recordset = result.recordset;
    const totalsRow = recordset.find(row => row.data_type === 'totals');
    const detailRows = recordset.filter(row => row.data_type === 'detail');

    const responseData = {
      totals: {
        total_registered: totalsRow.Registered_Qty,
        total_active: totalsRow.Active_Qty
      },
      rows: detailRows.map(row => ({
        ID: row.ID,
        Legal_Form: row.Legal_Form,
        Registered_Qty: row.Registered_Qty,
        Active_Qty: row.Active_Qty,
        Registered_Percent: row.Registered_Percent,
        Active_Percent: row.Active_Percent
      }))
    };

    // Cache the result (5 minutes)
    reportCacheManager.set(cacheKey, responseData, 5 * 60 * 1000);

    res.set('X-Cache', 'MISS');
    return res.json(responseData);

  } catch (err) {
    console.error('Report2 API Error:', err);
    
    // Enhanced error handling with specific error types
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEOUT') {
      return res.status(503).json({ 
        error: 'Database connection error. Please try again later.',
        code: 'DB_CONNECTION_ERROR'
      });
    }
    
    if (err.number && err.number >= 50000) {
      return res.status(400).json({ 
        error: 'Invalid data request.',
        code: 'INVALID_REQUEST'
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error. Please contact support if the problem persists.',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Health check endpoint for monitoring
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    cache_stats: reportCacheManager.getStats(),
    timestamp: new Date().toISOString()
  });
});

// Cache management endpoint (for admin use)
router.delete('/cache', (req, res) => {
  const { key } = req.query;
  
  if (key) {
    const deleted = reportCacheManager.delete(key);
    res.json({ message: `Cache entry ${deleted ? 'deleted' : 'not found'}`, key });
  } else {
    reportCacheManager.clear();
    res.json({ message: 'All cache entries cleared' });
  }
});

module.exports = router;
