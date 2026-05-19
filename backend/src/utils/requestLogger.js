class RequestLogger {
  constructor(maxEntries = 200) {
    this.logs = [];
    this.maxEntries = maxEntries;
    this.stats = { total: 0, errors: 0, totalDuration: 0 };
  }

  middleware() {
    return (req, res, next) => {
      if (req.path.startsWith('/admin') || req.path.startsWith('/dashboard-build')) {
        return next();
      }
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          duration,
          ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim(),
        };
        this.logs.unshift(entry);
        if (this.logs.length > this.maxEntries) this.logs.pop();
        this.stats.total++;
        this.stats.totalDuration += duration;
        if (res.statusCode >= 400) this.stats.errors++;
      });
      next();
    };
  }

  getLogs(limit = 100) {
    return this.logs.slice(0, limit);
  }

  getSummary() {
    const { total, errors, totalDuration } = this.stats;
    return {
      total,
      errors,
      successRate: total > 0 ? (((total - errors) / total) * 100).toFixed(1) + '%' : '—',
      avgDuration: total > 0 ? Math.round(totalDuration / total) : 0,
    };
  }
}

const requestLogger = new RequestLogger();
module.exports = { requestLogger };
