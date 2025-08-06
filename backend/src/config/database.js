const sql = require('mssql');
const path = require('path');

require('dotenv').config({ 
  path: path.join(__dirname, '../../.env')
});


console.log('Environment variables check:', {
  DB_SERVER: process.env.DB_SERVER || 'NOT SET',
  DB_DATABASE: process.env.DB_DATABASE || 'NOT SET',
  DB_USER: process.env.DB_USER || 'NOT SET',
  DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET'
});

// Enhanced configuration with optimized pool settings
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    max: 20,          // Maximum connections in pool
    min: 5,           // Minimum connections to maintain
    idleTimeoutMillis: 300000,  // 5 minutes idle timeout
    acquireTimeoutMillis: 60000, // 1 minute acquire timeout
    createTimeoutMillis: 30000,  // 30 seconds create timeout
    destroyTimeoutMillis: 5000,  // 5 seconds destroy timeout
    reapIntervalMillis: 1000,    // 1 second reap interval
    createRetryIntervalMillis: 200, // 200ms retry interval
    propagateCreateError: false   // Don't propagate pool creation errors
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 45000,  // Increased from 30s to 45s
    port: 1433,
    // Performance optimizations
    abortTransactionOnError: true,
    appName: 'BusinessReportAPI',
    isolationLevel: sql.ISOLATION_LEVEL.READ_UNCOMMITTED, // For reporting queries
    maxRetriesOnFailover: 3,
    multipleActiveResultSets: false,
    packetSize: 4096,
    useUTC: true
  },
};

// Connection pool with enhanced monitoring
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to MSSQL Database');
    console.log(`📊 Pool Configuration: Min: ${config.pool.min}, Max: ${config.pool.max}`);
    
    // Monitor pool events
    pool.on('connect', () => {
      console.log('🔌 New database connection established');
    });
    
    pool.on('error', (err) => {
      console.error('❌ Database pool error:', err.message);
    });
    
    return pool;
  })
  .catch(err => {
    console.error('❌ Database Connection Failed:', err.message);
    throw err;
  });

// Health check function
const checkDatabaseHealth = async () => {
  try {
    const pool = await poolPromise;
    const request = pool.request();
    const start = process.hrtime.bigint();
    
    await request.query('SELECT 1 as health_check');
    
    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    
    return {
      status: 'healthy',
      responseTime: `${duration.toFixed(2)}ms`,
      poolSize: pool.size,
      poolAvailable: pool.available,
      poolPending: pool.pending,
      poolBorrowed: pool.borrowed
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Graceful shutdown
const closeDatabase = async () => {
  try {
    const pool = await poolPromise;
    await pool.close();
    console.log('🔌 Database connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
};

module.exports = {
  sql,
  poolPromise,
  checkDatabaseHealth,
  closeDatabase
};
