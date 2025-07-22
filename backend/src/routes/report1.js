const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/database");
const { 
  createAdvancedCachedRoute,
  addPerformanceHeaders,
  createHealthCheck,
  createDiagnostics,
  queryOptimizations,
  validateParameters
} = require("../utils/performanceUtils");

// Add performance monitoring middleware
router.use(addPerformanceHeaders);

// Parameter validation schema for report1
const parameterSchema = {
  lang: {
    type: 'string',
    enum: ['ge', 'en'],
    default: 'ge'
  }
};

// Enhanced data fetcher with optimized query
const fetchReport1Data = async (params) => {
  const { lang } = params;
  const tableName = lang === "en" ? "Rpt_30_EN" : "Rpt_30";
  
  const pool = await poolPromise;
  const request = pool.request();
  
  // Set request timeout
  request.timeout = 30000;
  
  // Optimized query with performance hints
  const optimizedQuery = queryOptimizations.addPerformanceHints(
    queryOptimizations.addNoLockHints(
      `SELECT Activity_Code, Activity_Name, Registered_Qty, pct, Active_Qty, pct_act 
       FROM [register].[dbo].[${tableName}]
       ORDER BY Activity_Code`
    ),
    { 
      enableParallelism: true,
      maxDOP: 2
    }
  );
  
  const result = await request.query(optimizedQuery);
  return result.recordset;
};

// Main route with advanced caching and monitoring
router.get("/", createAdvancedCachedRoute(fetchReport1Data, {
  reportName: 'report1',
  cacheTTL: 10 * 60 * 1000, // 10 minutes cache for this report
  parameterSchema,
  enableCompression: true
}));

// Health check endpoint
router.get("/health", createHealthCheck('Report1 API'));

// Diagnostics endpoint
router.get("/diagnostics", createDiagnostics('Report1 API'));

// Cache management endpoints
router.delete("/cache", (req, res) => {
  const { reportCacheManager } = require("../utils/performanceUtils");
  
  if (req.query.key) {
    // Clear specific cache entry
    const deleted = reportCacheManager.delete(req.query.key);
    res.json({ 
      message: deleted ? 'Cache entry deleted' : 'Cache entry not found',
      key: req.query.key 
    });
  } else {
    // Clear all report1 cache entries
    const deletedCount = reportCacheManager.deletePattern('^report1_');
    res.json({ 
      message: 'Cache cleared',
      deletedEntries: deletedCount 
    });
  }
});

module.exports = router;
