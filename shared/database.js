// Shared Database Utility
// Connection pool and query helper for PostgreSQL

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'drug_delivery_db',
  max: process.env.DB_POOL_SIZE || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection pool events
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('New database connection established');
});

// High-level query function with error handling
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.LOG_QUERIES === 'true') {
      console.log(
        `Executed query ${text} (${duration}ms)`,
        params.length > 0 ? { params } : ''
      );
    }

    return result;
  } catch (error) {
    console.error('Database query error:', {
      text,
      params,
      error: error.message,
    });
    throw error;
  }
};

// Transaction helper (for complex operations requiring ACID)
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Helper to execute parameterized queries in transactions
const transactionQuery = (client) => {
  return (text, params = []) => {
    return client.query(text, params);
  };
};

// Get connection pool stats
const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};

// Close pool gracefully
const closePool = async () => {
  await pool.end();
  console.log('Database connection pool closed');
};

module.exports = {
  pool,
  query,
  transaction,
  transactionQuery,
  getPoolStats,
  closePool,
};
