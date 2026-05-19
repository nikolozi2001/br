const os = require('os');
const { checkDatabaseHealth } = require('../config/database');
const { reportCacheManager } = require('../utils/cacheManager');
const { queryMonitor } = require('../utils/queryMonitor');

const startTime = Date.now();

async function getDashboardStats(req, res) {
  try {
    const mem = process.memoryUsage();
    const dbHealth = await checkDatabaseHealth();
    const cacheStats = reportCacheManager.getStats();
    const queryStats = queryMonitor.getStats();

    res.json({
      server: {
        uptime: Math.floor((Date.now() - startTime) / 1000),
        nodeVersion: process.version,
        platform: process.platform,
        cpuCount: os.cpus().length,
        loadAvg: os.loadavg(),
        memory: {
          heapUsed: parseFloat((mem.heapUsed / 1024 / 1024).toFixed(2)),
          heapTotal: parseFloat((mem.heapTotal / 1024 / 1024).toFixed(2)),
          rss: parseFloat((mem.rss / 1024 / 1024).toFixed(2)),
          external: parseFloat((mem.external / 1024 / 1024).toFixed(2)),
        },
        freeSystemMemoryMB: parseInt(os.freemem() / 1024 / 1024),
        totalSystemMemoryMB: parseInt(os.totalmem() / 1024 / 1024),
      },
      database: dbHealth,
      cache: {
        size: cacheStats.size,
        maxSize: cacheStats.maxSize,
        hitCount: cacheStats.hitCount,
        missCount: cacheStats.missCount,
        hitRatio: cacheStats.hitRatio,
        totalRequests: cacheStats.totalRequests,
        memoryUsageKB: parseFloat((cacheStats.memoryUsage / 1024).toFixed(2)),
      },
      queries: {
        total: queryStats.totalQueries,
        slow: queryStats.slowQueries,
        errors: queryStats.errorCount,
        avgMs: parseFloat(queryStats.averageExecutionTime.toFixed(2)),
        peakMs: parseFloat(queryStats.peakExecutionTime.toFixed(2)),
        slowPct: queryStats.slowQueryPercentage,
        errorRate: queryStats.errorRate,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getDashboardStats };
