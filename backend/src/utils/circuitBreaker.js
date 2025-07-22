/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance and prevents cascading failures
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'Circuit Breaker';
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.monitorTimeout = options.monitorTimeout || 30000; // 30 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      circuitOpenings: 0
    };
  }

  /**
   * Execute function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @param {...any} args - Arguments to pass to function
   * @returns {Promise} - Promise that resolves with function result
   */
  async execute(fn, ...args) {
    this.stats.totalRequests++;

    if (this.state === 'OPEN') {
      if (this._shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker ${this.name} moving to HALF_OPEN state`);
      } else {
        this.stats.failedRequests++;
        throw new Error(`Circuit breaker ${this.name} is OPEN - request rejected`);
      }
    }

    try {
      const result = await this._executeWithTimeout(fn, ...args);
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure(error);
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  async _executeWithTimeout(fn, ...args) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.stats.timeouts++;
        reject(new Error(`Circuit breaker ${this.name} timeout after ${this.timeout}ms`));
      }, this.timeout);

      try {
        const result = await fn(...args);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle successful execution
   */
  _onSuccess() {
    this.stats.successfulRequests++;
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log(`✅ Circuit breaker ${this.name} closed after successful recovery`);
      }
    }
  }

  /**
   * Handle failed execution
   */
  _onFailure(error) {
    this.stats.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.state === 'HALF_OPEN' || 
        (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold)) {
      this.state = 'OPEN';
      this.stats.circuitOpenings++;
      console.warn(`🚨 Circuit breaker ${this.name} opened due to ${this.failureCount} failures`);
    }
  }

  /**
   * Check if we should attempt to reset the circuit breaker
   */
  _shouldAttemptReset() {
    return Date.now() - this.lastFailureTime >= this.monitorTimeout;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats() {
    const successRate = this.stats.totalRequests > 0 ? 
      (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) : 0;

    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      successRate: `${successRate}%`,
      ...this.stats,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null
    };
  }

  /**
   * Get health status
   */
  getHealth() {
    const stats = this.getStats();
    const isHealthy = this.state === 'CLOSED' && parseFloat(stats.successRate) > 90;
    
    return {
      status: isHealthy ? 'healthy' : this.state === 'OPEN' ? 'critical' : 'warning',
      state: this.state,
      successRate: stats.successRate,
      failureCount: this.failureCount,
      recommendations: this._getRecommendations()
    };
  }

  /**
   * Get recommendations based on current state
   */
  _getRecommendations() {
    switch (this.state) {
      case 'OPEN':
        return ['Circuit is open - check downstream service health', 'Monitor for service recovery'];
      case 'HALF_OPEN':
        return ['Circuit is testing recovery - monitor next few requests'];
      case 'CLOSED':
        return this.failureCount > 0 ? 
          ['Monitor failure rate - approaching threshold'] : 
          ['Circuit is healthy'];
      default:
        return [];
    }
  }

  /**
   * Manually reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    console.log(`🔄 Circuit breaker ${this.name} manually reset`);
  }

  /**
   * Force circuit breaker to open (for testing/maintenance)
   */
  forceOpen() {
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
    console.log(`🔒 Circuit breaker ${this.name} manually opened`);
  }
}

module.exports = CircuitBreaker;
