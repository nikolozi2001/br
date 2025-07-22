/**
 * Enhanced Performance Utilities for Report APIs
 * Provides comprehensive performance optimization functions with advanced features
 */

const { reportCacheManager } = require('./cacheManager');
const CircuitBreaker = require('./circuitBreaker');
const { queryMonitor } = require('./queryMonitor');
const { v4: uuidv4 } = require('uuid');

// Circuit breakers for different services
const databaseCircuitBreaker = new CircuitBreaker({
  name: 'Database',
  failureThreshold: 5,
  timeout: 30000,
  monitorTimeout: 60000
});

/**
 * Validate language parameter with enhanced validation
 * @param {string} lang - Language parameter
 * @returns {string} - Validated language ('ge' or 'en')
 */
const validateLanguage = (lang) => {
  const validLanguages = ['ge', 'en'];
  return validLanguages.includes(lang) ? lang : 'ge';
};

/**
 * Advanced parameter validation
 * @param {Object} params - Parameters to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validated parameters
 */
const validateParameters = (params, schema) => {
  const validated = {};
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = params[key];
    
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${key} is required`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`);
        continue;
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
        continue;
      }

      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${key} must be at least ${rules.min}`);
        continue;
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${key} must be at most ${rules.max}`);
        continue;
      }

      validated[key] = rules.transform ? rules.transform(value) : value;
    } else if (rules.default !== undefined) {
      validated[key] = rules.default;
    }
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.code = 'VALIDATION_ERROR';
    error.details = errors;
    throw error;
  }

  return validated;
};

/**
 * Generate advanced cache key with support for complex parameters
 * @param {string} reportName - Name of the report
 * @param {string} lang - Language
 * @param {Object} additionalParams - Additional parameters for cache key
 * @returns {string} - Generated cache key
 */
const generateCacheKey = (reportName, lang, additionalParams = {}) => {
  const sortedParams = Object.keys(additionalParams)
    .sort()
    .reduce((result, key) => {
      result[key] = additionalParams[key];
      return result;
    }, {});

  const paramString = Object.keys(sortedParams).length > 0 
    ? `_${Buffer.from(JSON.stringify(sortedParams)).toString('base64')}`
    : '';
  
  return `${reportName}_${lang}${paramString}`;
};

/**
 * Enhanced error handler with circuit breaker integration
 * @param {Error} err - Error object
 * @param {Object} res - Express response object
 * @param {string} context - Context where error occurred
 */
const handleDatabaseError = (err, res, context = 'Database operation') => {
  const errorId = uuidv4();
  
  console.error(`${context} Error [${errorId}]:`, {
    message: err.message,
    code: err.code,
    number: err.number,
    state: err.state,
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle validation errors
  if (err.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      error: 'Invalid request parameters',
      code: 'VALIDATION_ERROR',
      details: err.details,
      errorId
    });
  }

  // Database connection errors
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEOUT' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Database connection error. Please try again later.',
      code: 'DB_CONNECTION_ERROR',
      retryAfter: 30,
      errorId
    });
  }

  // Circuit breaker errors
  if (err.message.includes('Circuit breaker')) {
    return res.status(503).json({
      error: 'Service temporarily unavailable due to high failure rate.',
      code: 'CIRCUIT_BREAKER_OPEN',
      retryAfter: 60,
      errorId
    });
  }

  // SQL Server timeout
  if (err.code === 'ETIMEOUT' || err.message.includes('timeout')) {
    return res.status(504).json({
      error: 'Request timeout. The operation took too long to complete.',
      code: 'REQUEST_TIMEOUT',
      errorId
    });
  }

  // SQL Server custom errors
  if (err.number && err.number >= 50000) {
    return res.status(400).json({
      error: 'Invalid data request.',
      code: 'INVALID_REQUEST',
      errorId
    });
  }

  // Permission/access errors
  if (err.number && (err.number === 229 || err.number === 262)) {
    return res.status(403).json({
      error: 'Access denied to requested resource.',
      code: 'ACCESS_DENIED',
      errorId
    });
  }

  // Invalid object name (table/view not found)
  if (err.number && err.number === 208) {
    return res.status(404).json({
      error: 'Requested data source not found.',
      code: 'RESOURCE_NOT_FOUND',
      errorId
    });
  }

  // Generic server error
  return res.status(500).json({
    error: 'Internal server error. Please contact support if the problem persists.',
    code: 'INTERNAL_ERROR',
    errorId
  });
};

/**
 * Enhanced middleware to add performance and security headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const addPerformanceHeaders = (req, res, next) => {
  const start = process.hrtime.bigint();
  const requestId = uuidv4();
  
  // Add request ID to request object for tracking
  req.requestId = requestId;
  
  // Override res.json to add timing and tracking headers
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    
    this.set({
      'X-Response-Time': `${duration.toFixed(2)}ms`,
      'X-Request-ID': requestId,
      'X-Server-Time': new Date().toISOString()
    });
    
    return originalJson.call(this, data);
  };

  // Add comprehensive security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  next();
};

/**
 * Execute database query with monitoring and circuit breaker
 * @param {Function} queryFn - Function that executes the query
 * @param {string} queryName - Name for monitoring
 * @param {Object} params - Query parameters
 * @returns {Promise} - Query result
 */
const executeQueryWithMonitoring = async (queryFn, queryName, params = {}) => {
  const queryId = uuidv4();
  const queryInfo = queryMonitor.startQuery(queryId, queryName, params);
  
  try {
    const result = await databaseCircuitBreaker.execute(queryFn);
    queryMonitor.endQuery(queryInfo, true, result.recordset?.length || 0);
    return result;
  } catch (error) {
    queryMonitor.endQuery(queryInfo, false, 0, error);
    throw error;
  }
};

/**
 * Enhanced cached route handler with advanced features
 * @param {Function} dataFetcher - Function that fetches data from database
 * @param {Object} options - Configuration options
 * @returns {Function} - Express route handler
 */
const createAdvancedCachedRoute = (dataFetcher, options = {}) => {
  const { 
    reportName, 
    cacheTTL = 5 * 60 * 1000,
    validateParams = (req) => ({ lang: validateLanguage(req.query.lang) }),
    parameterSchema = null,
    enableCompression = false,
    maxCacheSize = null
  } = options;

  return async (req, res) => {
    const requestStart = process.hrtime.bigint();
    
    try {
      // Validate parameters if schema provided
      let validatedParams;
      if (parameterSchema) {
        validatedParams = validateParameters(req.query, parameterSchema);
      } else {
        validatedParams = validateParams(req);
      }

      const cacheKey = generateCacheKey(reportName, validatedParams.lang, validatedParams);

      // Check cache first
      const cachedData = reportCacheManager.get(cacheKey);
      if (cachedData) {
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey
        });
        return res.json(cachedData);
      }

      // Fetch fresh data with monitoring
      const queryName = `${reportName}_query`;
      const data = await executeQueryWithMonitoring(
        () => dataFetcher(validatedParams),
        queryName,
        validatedParams
      );

      // Cache the result with options
      reportCacheManager.set(cacheKey, data, cacheTTL);

      res.set({
        'X-Cache': 'MISS',
        'X-Cache-Key': cacheKey,
        'X-Data-Size': JSON.stringify(data).length
      });

      return res.json(data);

    } catch (err) {
      return handleDatabaseError(err, res, `${reportName} API`);
    }
  };
};

/**
 * Legacy support - alias for backward compatibility
 */
const createCachedRoute = createAdvancedCachedRoute;

/**
 * Batch processing utility for multiple queries
 * @param {Array} operations - Array of operations to execute
 * @param {Object} options - Batch options
 * @returns {Promise} - Batch results
 */
const executeBatch = async (operations, options = {}) => {
  const { concurrency = 3, failFast = false } = options;
  const results = [];
  const errors = [];

  // Process operations in batches
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (operation, index) => {
      try {
        const result = await operation();
        return { index: i + index, result, success: true };
      } catch (error) {
        const errorResult = { index: i + index, error, success: false };
        if (failFast) {
          throw errorResult;
        }
        return errorResult;
      }
    });

    try {
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (result.success) {
          results[result.index] = result.result;
        } else {
          errors[result.index] = result.error;
        }
      });
    } catch (error) {
      if (failFast) {
        throw error;
      }
    }
  }

  return { results, errors, successCount: results.filter(r => r !== undefined).length };
};

/**
 * Create health check endpoint
 * @param {string} serviceName - Name of the service
 * @returns {Function} - Health check route handler
 */
const createHealthCheck = (serviceName) => {
  return async (req, res) => {
    try {
      const health = {
        service: serviceName,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        
        // Cache health
        cache: reportCacheManager.getHealth(),
        
        // Database circuit breaker health
        database: databaseCircuitBreaker.getHealth(),
        
        // Query performance health
        queryPerformance: queryMonitor.getHealth(),
        
        // Memory usage
        memory: {
          usage: process.memoryUsage(),
          heap: {
            used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB'
          }
        }
      };

      // Determine overall health status
      const componentStatuses = [
        health.cache.status,
        health.database.status,
        health.queryPerformance.status
      ];

      if (componentStatuses.includes('critical')) {
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
        service: serviceName,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Create diagnostics endpoint
 * @param {string} serviceName - Name of the service
 * @returns {Function} - Diagnostics route handler
 */
const createDiagnostics = (serviceName) => {
  return async (req, res) => {
    try {
      const diagnostics = {
        service: serviceName,
        timestamp: new Date().toISOString(),
        
        // Detailed cache statistics
        cache: reportCacheManager.getStats(),
        
        // Circuit breaker statistics
        circuitBreaker: databaseCircuitBreaker.getStats(),
        
        // Query performance analysis
        queryPerformance: {
          stats: queryMonitor.getStats(),
          slowQueries: queryMonitor.getSlowQueries(10),
          queryPatterns: queryMonitor.getQueryPatterns()
        },
        
        // System information
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime(),
          cpuUsage: process.cpuUsage(),
          memoryUsage: process.memoryUsage()
        }
      };

      res.json(diagnostics);
    } catch (error) {
      res.status(500).json({
        service: serviceName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Advanced SQL query optimization utilities
 */
const queryOptimizations = {
  /**
   * Add comprehensive query hints for better performance
   * @param {string} query - SQL query
   * @param {Object} options - Optimization options
   * @returns {string} - Optimized query with hints
   */
  addPerformanceHints: (query, options = {}) => {
    const { 
      enableRecompile = false,
      enableParallelism = true,
      maxDOP = 4,
      enableOptimizeFor = false
    } = options;

    let optimizedQuery = query.trim();

    // Add query hints
    const hints = [];
    
    if (enableRecompile && query.includes('@')) {
      hints.push('RECOMPILE');
    }
    
    if (enableParallelism) {
      hints.push(`MAXDOP ${maxDOP}`);
    }
    
    if (enableOptimizeFor) {
      hints.push('OPTIMIZE FOR UNKNOWN');
    }

    if (hints.length > 0 && !query.toUpperCase().includes('OPTION')) {
      optimizedQuery += ` OPTION (${hints.join(', ')})`;
    }

    return optimizedQuery;
  },

  /**
   * Add WITH (NOLOCK) hints for read-only queries
   * @param {string} query - SQL query
   * @returns {string} - Query with NOLOCK hints
   */
  addNoLockHints: (query) => {
    // Simple implementation - in production, use a proper SQL parser
    return query.replace(
      /FROM\s+(\[?\w+\]?\.\[?\w+\]?\.\[?\w+\]?|\[?\w+\]?\.\[?\w+\]?|\[?\w+\]?)/gi,
      (match, tableName) => `${match} WITH (NOLOCK)`
    );
  },

  /**
   * Validate and sanitize SQL query
   * @param {string} query - SQL query to validate
   * @returns {Object} - Validation result
   */
  validateQuery: (query) => {
    const errors = [];
    const warnings = [];

    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /DROP\s+TABLE/gi,
      /DROP\s+DATABASE/gi,
      /DELETE\s+FROM.*WITHOUT.*WHERE/gi,
      /TRUNCATE\s+TABLE/gi
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        errors.push(`Potentially dangerous operation detected: ${pattern.source}`);
      }
    });

    // Check for performance issues
    if (query.toUpperCase().includes('SELECT *')) {
      warnings.push('SELECT * may impact performance - consider specifying columns');
    }

    if (!query.toUpperCase().includes('WHERE') && query.toUpperCase().includes('SELECT')) {
      warnings.push('Query without WHERE clause may return large result sets');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      query: query.trim()
    };
  }
};

module.exports = {
  validateLanguage,
  validateParameters,
  generateCacheKey,
  handleDatabaseError,
  addPerformanceHeaders,
  executeQueryWithMonitoring,
  createAdvancedCachedRoute,
  createCachedRoute, // Legacy support
  executeBatch,
  createHealthCheck,
  createDiagnostics,
  queryOptimizations,
  reportCacheManager,
  databaseCircuitBreaker,
  queryMonitor
};
