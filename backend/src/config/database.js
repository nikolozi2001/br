const sql = require('mssql');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  server:   process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    max:                        parseInt(process.env.DB_POOL_MAX  || '20'),
    min:                        parseInt(process.env.DB_POOL_MIN  || '5'),
    idleTimeoutMillis:          parseInt(process.env.DB_POOL_IDLE || '300000'),
    acquireTimeoutMillis:       60000,
    createTimeoutMillis:        30000,
    destroyTimeoutMillis:       5000,
    reapIntervalMillis:         1000,
    createRetryIntervalMillis:  200,
    propagateCreateError:       false,
  },
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    enableArithAbort:       true,
    connectTimeout:         30000,
    requestTimeout:         600000,
    port:                   1433,
    abortTransactionOnError: true,
    appName:                'BusinessReportAPI',
    isolationLevel:         sql.ISOLATION_LEVEL.READ_UNCOMMITTED,
    maxRetriesOnFailover:   3,
    multipleActiveResultSets: false,
    packetSize:             4096,
    useUTC:                 true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to MSSQL Database');
    pool.on('error', (err) => console.error('Database pool error:', err.message));
    return pool;
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    throw err;
  });

const checkDatabaseHealth = async () => {
  try {
    const pool = await poolPromise;
    const start = process.hrtime.bigint();
    await pool.request().query('SELECT 1 as health_check');
    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    return {
      status: 'healthy',
      responseTime: `${duration.toFixed(2)}ms`,
      poolSize: pool.size,
      poolAvailable: pool.available,
      poolPending: pool.pending,
      poolBorrowed: pool.borrowed,
    };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

const closeDatabase = async () => {
  try {
    const pool = await poolPromise;
    await pool.close();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error.message);
  }
};

module.exports = { sql, poolPromise, checkDatabaseHealth, closeDatabase };
