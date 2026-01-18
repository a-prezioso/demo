"use strict";

// Database module using node-postgres (pg)
// Provides a pooled client and safe parameterized query function.
// Configuration via env: DATABASE_URL or PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE

const { Pool } = require("pg");

let pool = null;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  const config = connectionString
    ? { connectionString, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined }
    : {
        host: process.env.PGHOST || "127.0.0.1",
        port: parseInt(process.env.PGPORT || "5432", 10),
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || undefined,
        database: process.env.PGDATABASE || "smartdesk",
        ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
      };
  pool = new Pool(config);

  // Minimal event logs without sensitive data
  pool.on("error", (err) => {
    // Avoid logging SQL or parameters by default
    console.error(JSON.stringify({ level: "error", msg: "pg pool error", err: err.message }));
  });

  return pool;
}

async function query(text, params) {
  const p = getPool();
  // Do not log params to avoid accidental sensitive info leakage
  return p.query(text, params);
}

module.exports = {
  getPool,
  query,
};
