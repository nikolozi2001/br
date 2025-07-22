const express = require('express');
const router = express.Router();
const { 
  createHealthCheck, 
  createDiagnostics,
  reportCacheManager,
  databaseCircuitBreaker,
  queryMonitor
} = require('../utils/performanceUtils');
const { checkDatabaseHealth } = require('../config/database');

// Global health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      service: 'Business Reports API',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // Overall system health
      status: 'healthy',
      
      // Component health checks
      components: {
        database: await checkDatabaseHealth(),
        cache: reportCacheManager.getHealth(),
        circuitBreaker: databaseCircuitBreaker.getHealth(),
        queryPerformance: queryMonitor.getHealth()
      },
      
      // System metrics
      system: {
        uptime: `${Math.floor(process.uptime())}s`,
        memory: {
          used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
          external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`
        },
        cpu: process.cpuUsage()
      }
    };

    // Determine overall health status
    const componentStatuses = Object.values(health.components).map(c => c.status);
    
    if (componentStatuses.includes('critical') || componentStatuses.includes('unhealthy')) {
      health.status = 'critical';
      res.status(503);
    } else if (componentStatuses.includes('warning')) {
      health.status = 'warning';
      res.status(200);
    } else {
      health.status = 'healthy';
      res.status(200);
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({
      service: 'Business Reports API',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global diagnostics endpoint
router.get('/diagnostics', async (req, res) => {
  try {
    const diagnostics = {
      service: 'Business Reports API',
      timestamp: new Date().toISOString(),
      
      // Cache analytics
      cache: {
        stats: reportCacheManager.getStats(),
        topKeys: Object.entries(reportCacheManager.getStats().entries)
          .sort((a, b) => b[1].size - a[1].size)
          .slice(0, 10)
          .map(([key, stats]) => ({ key, ...stats }))
      },
      
      // Circuit breaker details
      circuitBreaker: databaseCircuitBreaker.getStats(),
      
      // Query performance analysis
      queryPerformance: {
        overview: queryMonitor.getStats(),
        slowQueries: queryMonitor.getSlowQueries(15),
        queryPatterns: queryMonitor.getQueryPatterns().slice(0, 10)
      },
      
      // Database connection pool status
      database: await checkDatabaseHealth(),
      
      // Node.js process information
      process: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        env: {
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT
        }
      }
    };

    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      service: 'Business Reports API',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Performance metrics endpoint
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      
      // Cache metrics
      cache_hit_ratio: parseFloat(reportCacheManager.getStats().hitRatio),
      cache_size: reportCacheManager.getStats().size,
      cache_memory_usage: reportCacheManager.getStats().memoryUsage,
      
      // Query metrics
      query_total: queryMonitor.getStats().totalQueries,
      query_average_time: queryMonitor.getStats().averageExecutionTime,
      query_slow_percentage: parseFloat(queryMonitor.getStats().slowQueryPercentage),
      query_error_rate: parseFloat(queryMonitor.getStats().errorRate),
      
      // Circuit breaker metrics
      circuit_breaker_state: databaseCircuitBreaker.getStats().state,
      circuit_breaker_failure_count: databaseCircuitBreaker.getStats().failureCount,
      circuit_breaker_success_rate: parseFloat(databaseCircuitBreaker.getStats().successRate),
      
      // System metrics
      memory_heap_used: process.memoryUsage().heapUsed,
      memory_heap_total: process.memoryUsage().heapTotal,
      uptime_seconds: process.uptime()
    };

    res.set('Content-Type', 'text/plain');
    
    // Format as Prometheus-style metrics
    const prometheusMetrics = Object.entries(metrics)
      .filter(([key, value]) => typeof value === 'number')
      .map(([key, value]) => `${key} ${value}`)
      .join('\n');
    
    res.send(prometheusMetrics);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global cache management
router.delete('/cache', (req, res) => {
  try {
    const pattern = req.query.pattern;
    let deletedCount;
    
    if (pattern) {
      deletedCount = reportCacheManager.deletePattern(pattern);
      res.json({
        message: `Cache entries matching pattern cleared`,
        pattern,
        deletedEntries: deletedCount
      });
    } else {
      reportCacheManager.clear();
      res.json({
        message: 'All cache entries cleared'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache statistics
router.get('/cache/stats', (req, res) => {
  try {
    const stats = reportCacheManager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Reset circuit breaker
router.post('/circuit-breaker/reset', (req, res) => {
  try {
    databaseCircuitBreaker.reset();
    res.json({
      message: 'Circuit breaker reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Query performance reset
router.post('/query-performance/reset', (req, res) => {
  try {
    queryMonitor.reset();
    res.json({
      message: 'Query performance statistics reset',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
