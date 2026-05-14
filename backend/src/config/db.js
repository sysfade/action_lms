const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../lms.db');

// Ensure database file exists
const db = new sqlite3.Database(DB_PATH);

/**
 * Standardised query helper for SQLite.
 * Maps the behavior to look like 'pg' results (using .rows).
 * Also supports '$1' style placeholders by converting them to '?' internally.
 */
const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    // 1. Identify all $N placeholders in order of appearance
    const matches = text.match(/\$\d+/g) || [];
    
    // 2. Map the original params to the order of appearance
    // params[0] corresponds to $1, params[1] to $2, etc.
    const normalizedParams = matches.map(m => {
      const index = parseInt(m.substring(1)) - 1;
      return params[index];
    });

    // 3. Convert Postgres-style $1, $2 to SQLite-style ?
    const normalizedText = text.replace(/\$\d+/g, '?');
    
    db.all(normalizedText, normalizedParams, (err, rows) => {
      if (err) {
        console.error('SQLite Query Error:', err);
        return reject(err);
      }
      resolve({ rows });
    });
  });
};

/**
 * Helper to generate UUIDs since SQLite doesn't have a built-in gen_random_uuid()
 */
const generateId = () => crypto.randomUUID();

/**
 * Initialize the database with the schema
 */
const initDb = async () => {
  const schemaPath = path.join(__dirname, '../../database/init_sqlite.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  return new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) {
        console.error('Database initialization failed:', err);
        reject(err);
      } else {
        console.log('SQLite Database initialized successfully.');
        resolve();
      }
    });
  });
};

module.exports = {
  query,
  generateId,
  initDb
};
