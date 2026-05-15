const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Standardised query helper for Postgres.
 * The codebase was already written using pg-style $1 parameters.
 */
const query = (text, params = []) => {
  return pool.query(text, params);
};

/**
 * Helper to generate UUIDs
 */
const generateId = () => crypto.randomUUID();

/**
 * Initialize the database with the schema
 */
const initDb = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Skipping DB initialization/connection.');
    return;
  }

  const schemaPath = path.join(__dirname, '../../database/init_pg.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  try {
    await pool.query(schema);
    console.log('Postgres Database initialized successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
};

module.exports = {
  query,
  generateId,
  initDb
};
