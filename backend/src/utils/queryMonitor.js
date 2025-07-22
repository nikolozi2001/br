/**
 * Query Performance Monitor
 * Tracks and analyzes database query performance
 */

class QueryPerformanceMonitor {
  constructor() {
    this.queries = new Map();
    this.slowQueryThreshold = 1000; // 1 second
    this.maxStoredQueries = 1000;
    
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      peakExecutionTime: 0,
      errorCount: 0
    };
  }

  /**
   * Start monitoring a query
   * @param {string} queryId - Unique identifier for the query
   * @param {string} sql - SQL query text
   * @param {Object} params - Query parameters
   * @returns {Object} - Query tracking object
   */
  startQuery(queryId, sql, params = {}) {
    const queryInfo = {
      id: queryId,
      sql: this._sanitizeSql(sql),
      params,
      startTime: process.hrtime.bigint(),
      timestamp: new Date().toISOString()
    };

    return queryInfo;
  }

  /**
   * End monitoring a query
   * @param {Object} queryInfo - Query tracking object from startQuery
   * @param {boolean} success - Whether query was successful
   * @param {number} rowCount - Number of rows returned/affected
   * @param {Error} error - Error if query failed
   */
  endQuery(queryInfo, success = true, rowCount = 0, error = null) {
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - queryInfo.startTime) / 1000000; // Convert to milliseconds

    const completedQuery = {
      ...queryInfo,
      endTime,
      executionTime,
      success,
      rowCount,
      error: error ? {
        message: error.message,
        code: error.code,
        number: error.number
      } : null
    };

    this._recordQuery(completedQuery);
    this._updateStats(completedQuery);

    return completedQuery;
  }

  /**
   * Record query for analysis
   */
  _recordQuery(query) {
    // Maintain a rolling window of queries
    if (this.queries.size >= this.maxStoredQueries) {
      const oldestKey = this.queries.keys().next().value;
      this.queries.delete(oldestKey);
    }

    this.queries.set(query.id, query);
  }

  /**
   * Update performance statistics
   */
  _updateStats(query) {
    this.stats.totalQueries++;
    
    if (!query.success) {
      this.stats.errorCount++;
    }

    if (query.executionTime > this.slowQueryThreshold) {
      this.stats.slowQueries++;
    }

    this.stats.totalExecutionTime += query.executionTime;
    this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.totalQueries;

    if (query.executionTime > this.stats.peakExecutionTime) {
      this.stats.peakExecutionTime = query.executionTime;
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const slowQueryPercentage = this.stats.totalQueries > 0 ? 
      (this.stats.slowQueries / this.stats.totalQueries * 100).toFixed(2) : 0;

    const errorRate = this.stats.totalQueries > 0 ? 
      (this.stats.errorCount / this.stats.totalQueries * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      slowQueryPercentage: `${slowQueryPercentage}%`,
      errorRate: `${errorRate}%`,
      averageExecutionTime: parseFloat(this.stats.averageExecutionTime.toFixed(2)),
      peakExecutionTime: parseFloat(this.stats.peakExecutionTime.toFixed(2))
    };
  }

  /**
   * Get slow queries analysis
   */
  getSlowQueries(limit = 10) {
    const slowQueries = Array.from(this.queries.values())
      .filter(q => q.executionTime > this.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);

    return slowQueries.map(q => ({
      id: q.id,
      sql: q.sql,
      executionTime: parseFloat(q.executionTime.toFixed(2)),
      timestamp: q.timestamp,
      rowCount: q.rowCount,
      success: q.success
    }));
  }

  /**
   * Get query patterns analysis
   */
  getQueryPatterns() {
    const patterns = new Map();

    for (const query of this.queries.values()) {
      const pattern = this._extractQueryPattern(query.sql);
      if (!patterns.has(pattern)) {
        patterns.set(pattern, {
          pattern,
          count: 0,
          totalTime: 0,
          averageTime: 0,
          slowCount: 0
        });
      }

      const patternStats = patterns.get(pattern);
      patternStats.count++;
      patternStats.totalTime += query.executionTime;
      patternStats.averageTime = patternStats.totalTime / patternStats.count;
      
      if (query.executionTime > this.slowQueryThreshold) {
        patternStats.slowCount++;
      }
    }

    return Array.from(patterns.values())
      .sort((a, b) => b.averageTime - a.averageTime)
      .map(p => ({
        ...p,
        averageTime: parseFloat(p.averageTime.toFixed(2)),
        slowPercentage: p.count > 0 ? ((p.slowCount / p.count) * 100).toFixed(2) + '%' : '0%'
      }));
  }

  /**
   * Get health status
   */
  getHealth() {
    const stats = this.getStats();
    const slowQueryPercentage = parseFloat(stats.slowQueryPercentage);
    const errorRate = parseFloat(stats.errorRate);
    
    let status = 'healthy';
    const issues = [];
    
    if (slowQueryPercentage > 10) {
      status = 'warning';
      issues.push(`High slow query rate: ${stats.slowQueryPercentage}`);
    }
    
    if (errorRate > 5) {
      status = 'critical';
      issues.push(`High error rate: ${stats.errorRate}`);
    }
    
    if (stats.averageExecutionTime > 500) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`High average execution time: ${stats.averageExecutionTime}ms`);
    }

    return {
      status,
      averageExecutionTime: stats.averageExecutionTime,
      slowQueryPercentage: stats.slowQueryPercentage,
      errorRate: stats.errorRate,
      totalQueries: stats.totalQueries,
      issues: issues.length > 0 ? issues : ['All metrics within normal ranges'],
      recommendations: this._getRecommendations(stats)
    };
  }

  /**
   * Extract query pattern for analysis
   */
  _extractQueryPattern(sql) {
    return sql
      .replace(/\b\d+\b/g, '?')           // Replace numbers with placeholders
      .replace(/'[^']*'/g, '?')           // Replace string literals
      .replace(/\s+/g, ' ')               // Normalize whitespace
      .trim()
      .substring(0, 100);                 // Limit pattern length
  }

  /**
   * Sanitize SQL for logging (remove sensitive data)
   */
  _sanitizeSql(sql) {
    return sql
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/pwd\s*=\s*'[^']*'/gi, "pwd='***'")
      .substring(0, 500); // Limit SQL length for storage
  }

  /**
   * Get recommendations based on performance metrics
   */
  _getRecommendations(stats) {
    const recommendations = [];
    
    if (parseFloat(stats.slowQueryPercentage) > 5) {
      recommendations.push('Consider adding database indexes for frequently used columns');
      recommendations.push('Review and optimize slow queries');
    }
    
    if (stats.averageExecutionTime > 200) {
      recommendations.push('Consider query optimization or database tuning');
    }
    
    if (parseFloat(stats.errorRate) > 2) {
      recommendations.push('Investigate and fix recurring database errors');
    }
    
    if (stats.totalQueries > 10000) {
      recommendations.push('Consider implementing query result caching');
    }

    return recommendations.length > 0 ? recommendations : ['Query performance is optimal'];
  }

  /**
   * Reset statistics (useful for testing or after maintenance)
   */
  reset() {
    this.queries.clear();
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      peakExecutionTime: 0,
      errorCount: 0
    };
  }

  /**
   * Export performance data for analysis
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      slowQueries: this.getSlowQueries(20),
      queryPatterns: this.getQueryPatterns(),
      health: this.getHealth()
    };
  }
}

// Export singleton instance
const queryMonitor = new QueryPerformanceMonitor();

module.exports = {
  QueryPerformanceMonitor,
  queryMonitor
};
