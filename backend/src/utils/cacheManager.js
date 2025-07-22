/**
 * Advanced Cache Manager Utility for Report APIs
 * Provides centralized caching functionality with TTL, memory management, and advanced features
 */

class AdvancedCacheManager {
  constructor(defaultTTL = 5 * 60 * 1000, maxSize = 1000) {
    this.cache = new Map();
    this.accessTimes = new Map(); // Track access times for LRU
    this.hitCount = 0;
    this.missCount = 0;
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
    this.compressionThreshold = 1000; // Compress data larger than 1KB
    
    // Performance monitoring
    this.metrics = {
      totalRequests: 0,
      hitRatio: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      evictions: 0
    };
    
    // Start periodic tasks
    this.startCleanupInterval();
    this.startMetricsCollection();
  }

  /**
   * Get data from cache with performance tracking
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached data or null if not found/expired
   */
  get(key) {
    const start = process.hrtime.bigint();
    this.metrics.totalRequests++;
    
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) {
      this.missCount++;
      this._updateMetrics();
      return null;
    }

    // Check if expired
    if (Date.now() - cachedItem.timestamp > cachedItem.ttl) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.missCount++;
      this._updateMetrics();
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, Date.now());
    this.hitCount++;
    
    // Decompress if needed
    const data = cachedItem.compressed ? 
      this._decompress(cachedItem.data) : cachedItem.data;

    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    this._updateResponseTime(duration);
    this._updateMetrics();
    
    return data;
  }

  /**
   * Set data in cache with compression and intelligent eviction
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, data, ttl = this.defaultTTL) {
    // Prevent memory leaks by limiting cache size
    if (this.cache.size >= this.maxSize) {
      this._evictLRU();
    }

    // Compress large data
    const serializedData = JSON.stringify(data);
    const shouldCompress = serializedData.length > this.compressionThreshold;
    const finalData = shouldCompress ? this._compress(serializedData) : data;

    this.cache.set(key, {
      data: finalData,
      timestamp: Date.now(),
      ttl,
      compressed: shouldCompress,
      size: serializedData.length
    });

    this.accessTimes.set(key, Date.now());
    this._updateMemoryUsage();
  }

  /**
   * Intelligent batch operations
   * @param {Array} keys - Array of cache keys
   * @returns {Object} - Object with found keys and their values
   */
  mget(keys) {
    const result = {};
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    });
    return result;
  }

  /**
   * Set multiple values at once
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {number} ttl - TTL for all entries
   */
  mset(keyValuePairs, ttl = this.defaultTTL) {
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key to delete
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.accessTimes.delete(key);
    this._updateMemoryUsage();
    return deleted;
  }

  /**
   * Clear cache entries matching pattern
   * @param {string|RegExp} pattern - Pattern to match keys
   */
  deletePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this._updateMemoryUsage();
  }

  /**
   * Get comprehensive cache statistics
   * @returns {Object} - Detailed cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRatio = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRatio: hitRatio.toFixed(2) + '%',
      totalRequests,
      memoryUsage: this._getMemoryUsage(),
      entries: this._getEntryDetails(),
      metrics: { ...this.metrics, hitRatio: hitRatio.toFixed(2) + '%' }
    };
  }

  /**
   * Get cache health status
   * @returns {Object} - Health status
   */
  getHealth() {
    const stats = this.getStats();
    const memoryUsageMB = stats.memoryUsage / 1024 / 1024;
    
    return {
      status: memoryUsageMB > 100 ? 'warning' : 'healthy',
      cacheSize: stats.size,
      hitRatio: stats.hitRatio,
      memoryUsageMB: memoryUsageMB.toFixed(2),
      recommendations: this._getRecommendations(stats)
    };
  }

  /**
   * Evict least recently used items
   */
  _evictLRU() {
    const sortedByAccess = Array.from(this.accessTimes.entries())
      .sort((a, b) => a[1] - b[1]);
    
    const itemsToEvict = Math.ceil(this.maxSize * 0.1); // Evict 10%
    
    for (let i = 0; i < itemsToEvict && i < sortedByAccess.length; i++) {
      const [key] = sortedByAccess[i];
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.metrics.evictions++;
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    });
    
    this._updateMemoryUsage();
    return keysToDelete.length;
  }

  /**
   * Compress data (simple implementation)
   */
  _compress(data) {
    // Simple compression - in production, use zlib
    return Buffer.from(data).toString('base64');
  }

  /**
   * Decompress data
   */
  _decompress(compressedData) {
    try {
      return JSON.parse(Buffer.from(compressedData, 'base64').toString());
    } catch (error) {
      console.warn('Failed to decompress cache data:', error.message);
      return null;
    }
  }

  /**
   * Update metrics
   */
  _updateMetrics() {
    const totalRequests = this.hitCount + this.missCount;
    this.metrics.hitRatio = totalRequests > 0 ? 
      ((this.hitCount / totalRequests) * 100).toFixed(2) + '%' : '0%';
  }

  /**
   * Update response time metrics
   */
  _updateResponseTime(duration) {
    if (!this.metrics.averageResponseTime) {
      this.metrics.averageResponseTime = duration;
    } else {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime + duration) / 2;
    }
  }

  /**
   * Update memory usage
   */
  _updateMemoryUsage() {
    this.metrics.memoryUsage = this._getMemoryUsage();
  }

  /**
   * Get memory usage of cache
   */
  _getMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += key.length;
      totalSize += value.size || JSON.stringify(value.data).length;
    }
    return totalSize;
  }

  /**
   * Get detailed entry information
   */
  _getEntryDetails() {
    const entries = {};
    for (const [key, value] of this.cache.entries()) {
      entries[key] = {
        size: value.size || JSON.stringify(value.data).length,
        age: Date.now() - value.timestamp,
        ttl: value.ttl,
        compressed: value.compressed || false
      };
    }
    return entries;
  }

  /**
   * Get recommendations for cache optimization
   */
  _getRecommendations(stats) {
    const recommendations = [];
    const hitRatio = parseFloat(stats.hitRatio);
    
    if (hitRatio < 70) {
      recommendations.push('Consider increasing TTL for better hit ratio');
    }
    if (stats.size > this.maxSize * 0.9) {
      recommendations.push('Cache is near capacity, consider increasing maxSize');
    }
    if (this.metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('High memory usage detected, consider enabling compression');
    }
    
    return recommendations.length > 0 ? recommendations : ['Cache performance is optimal'];
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.min(this.defaultTTL, 60000)); // Cleanup every minute max

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this._updateMemoryUsage();
    }, 30000); // Update metrics every 30 seconds

    if (this.metricsInterval.unref) {
      this.metricsInterval.unref();
    }
  }

  /**
   * Stop all intervals
   */
  stopIntervals() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

// Export singleton instance with enhanced features
const reportCacheManager = new AdvancedCacheManager();

module.exports = {
  AdvancedCacheManager,
  reportCacheManager
};
