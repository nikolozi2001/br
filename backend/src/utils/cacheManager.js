/**
 * Cache Manager Utility for Report APIs
 * Provides centralized caching functionality with TTL and memory management
 */

class CacheManager {
  constructor(defaultTTL = 5 * 60 * 1000, maxSize = 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL; // 5 minutes default
    this.maxSize = maxSize;
    
    // Start periodic cleanup
    this.startCleanupInterval();
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached data or null if not found/expired
   */
  get(key) {
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) {
      return null;
    }

    // Check if expired
    if (Date.now() - cachedItem.timestamp > cachedItem.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cachedItem.data;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, data, ttl = this.defaultTTL) {
    // Prevent memory leaks by limiting cache size
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key to delete
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
      entries: Array.from(this.cache.keys())
    };
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

    keysToDelete.forEach(key => this.cache.delete(key));
    
    // If still over limit after cleanup, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = entries.slice(0, Math.floor(this.maxSize * 0.2)); // Remove 20%
      entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }

    return keysToDelete.length;
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.defaultTTL); // Cleanup every TTL period

    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop automatic cleanup interval
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
const reportCacheManager = new CacheManager();

module.exports = {
  CacheManager,
  reportCacheManager
};
