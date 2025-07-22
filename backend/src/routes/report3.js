const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");
const { 
  createAdvancedCachedRoute,
  addPerformanceHeaders,
  createHealthCheck,
  queryOptimizations
} = require("../utils/performanceUtils");

// Add performance monitoring middleware
router.use(addPerformanceHeaders);

// Parameter validation schema for report3
const parameterSchema = {
  lang: {
    type: 'string',
    enum: ['ge', 'en'],
    default: 'ge'
  }
};

// Enhanced data fetcher with optimized query
const fetchReport3Data = async (params) => {
  const { lang } = params;
  const tableName = lang === "en" ? "Rpt_3_EN" : "Rpt_3";
  
  const pool = await poolPromise;
  const request = pool.request();
  request.timeout = 30000;
  
  // Optimized query with performance hints and ordering
  const optimizedQuery = queryOptimizations.addPerformanceHints(
    queryOptimizations.addNoLockHints(
      `SELECT ID, Ownership_Type, Registered_Qty, Active_Qty 
       FROM [register].[dbo].[${tableName}]
       ORDER BY ID`
    ),
    { 
      enableParallelism: true,
      maxDOP: 2
    }
  );
  
  const result = await request.query(optimizedQuery);
  return result.recordset;
};

// Main route with advanced caching
router.get("/", createAdvancedCachedRoute(fetchReport3Data, {
  reportName: 'report3',
  cacheTTL: 8 * 60 * 1000, // 8 minutes cache
  parameterSchema,
  enableCompression: true
}));

// Health check endpoint
router.get("/health", createHealthCheck('Report3 API'));

// Cache management
router.delete("/cache", (req, res) => {
  const { reportCacheManager } = require("../utils/performanceUtils");
  const deletedCount = reportCacheManager.deletePattern('^report3_');
  res.json({ 
    message: 'Report3 cache cleared',
    deletedEntries: deletedCount 
  });
});

module.exports = router;
