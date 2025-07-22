/**
 * Performance Utilities for Report APIs
 * Provides common performance optimization functions
 */

const { reportCacheManager } = require('./cacheManager');

/**
 * Validate language parameter
 * @param {string} lang - Language parameter
 * @returns {string} - Validated language ('ge' or 'en')
 */
const validateLanguage = (lang) => {
  const validLanguages = ['ge', 'en'];
  return validLanguages.includes(lang) ? lang : 'ge';
};

/**
 * Generate standardized cache key for reports
 * @param {string} reportName - Name of the report
 * @param {string} lang - Language
 * @param {Object} additionalParams - Additional parameters for cache key
 * @returns {string} - Generated cache key
 */
const generateCacheKey = (reportName, lang, additionalParams = {}) => {
  const params = Object.keys(additionalParams).length > 0 
    ? `_${Object.entries(additionalParams).map(([k, v]) => `${k}:${v}`).join('_')}`
    : '';
  return `${reportName}_${lang}${params}`;
};

/**
 * Enhanced error handler for database operations
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 * @param {string} context - Context where error occurred
 */
const handleDatabaseError = (err, res, context = 'Database operation') => {
  console.error(`${context} Error:`, {
    message: err.message,
    code: err.code,
    number: err.number,
    state: err.state,
    stack: err.stack
  });

  // Database connection errors
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEOUT' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Database connection error. Please try again later.',
      code: 'DB_CONNECTION_ERROR',
      retryAfter: 30
    });
  }

  // SQL Server timeout
  if (err.code === 'ETIMEOUT' || err.message.includes('timeout')) {
    return res.status(504).json({
      error: 'Request timeout. The operation took too long to complete.',
      code: 'REQUEST_TIMEOUT'
    });
  }

  // SQL Server custom errors
  if (err.number && err.number >= 50000) {
    return res.status(400).json({
      error: 'Invalid data request.',
      code: 'INVALID_REQUEST'
    });
  }

  // Permission/access errors
  if (err.number && (err.number === 229 || err.number === 262)) {
    return res.status(403).json({
      error: 'Access denied to requested resource.',
      code: 'ACCESS_DENIED'
    });
  }

  // Invalid object name (table/view not found)
  if (err.number && err.number === 208) {
    return res.status(404).json({
      error: 'Requested data source not found.',
      code: 'RESOURCE_NOT_FOUND'
    });
  }

  // Generic server error
  return res.status(500).json({
    error: 'Internal server error. Please contact support if the problem persists.',
    code: 'INTERNAL_ERROR'
  });
};

/**
 * Middleware to add performance headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const addPerformanceHeaders = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Override res.json to add timing header before sending response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
    this.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    return originalJson.call(this, data);
  };

  // Add security headers immediately
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  next();
};

/**
 * Create a cached route handler
 * @param {Function} dataFetcher - Function that fetches data from database
 * @param {Object} options - Configuration options
 * @returns {Function} - Express route handler
 */
const createCachedRoute = (dataFetcher, options = {}) => {
  const { 
    reportName, 
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    validateParams = (req) => ({ lang: validateLanguage(req.query.lang) })
  } = options;

  return async (req, res) => {
    try {
      const validatedParams = validateParams(req);
      const cacheKey = generateCacheKey(reportName, validatedParams.lang, validatedParams);

      // Check cache first
      const cachedData = reportCacheManager.get(cacheKey);
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Fetch fresh data
      const data = await dataFetcher(validatedParams);

      // Cache the result
      reportCacheManager.set(cacheKey, data, cacheTTL);

      res.set('X-Cache', 'MISS');
      return res.json(data);

    } catch (err) {
      return handleDatabaseError(err, res, `${reportName} API`);
    }
  };
};

/**
 * SQL query optimization utilities
 */
const queryOptimizations = {
  /**
   * Add query hints for better performance
   * @param {string} query - SQL query
   * @returns {string} - Optimized query with hints
   */
  addPerformanceHints: (query) => {
    // Add OPTION (RECOMPILE) for queries with parameters
    if (query.includes('@') && !query.includes('OPTION')) {
      return query.trim() + ' OPTION (RECOMPILE)';
    }
    return query;
  },

  /**
   * Add timeout hint to query
   * @param {string} query - SQL query
   * @param {number} timeoutSeconds - Timeout in seconds (default 30)
   * @returns {string} - Query with timeout hint (Note: Timeout should be set at request level in mssql)
   */
  addTimeout: (query, timeoutSeconds = 30) => {
    // Note: SQL Server doesn't support QUERY_TIMEOUT option
    // Timeout should be set at the request level in node-mssql
    return query.trim();
  }
};

module.exports = {
  validateLanguage,
  generateCacheKey,
  handleDatabaseError,
  addPerformanceHeaders,
  createCachedRoute,
  queryOptimizations,
  reportCacheManager
};
