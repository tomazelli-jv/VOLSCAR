const mysql = require('mysql2/promise');
require('dotenv').config();

// Prefer IPv4 loopback when DB_HOST is 'localhost' to avoid connecting as '::1'
const dbHost = (process.env.DB_HOST && process.env.DB_HOST.trim() === 'localhost') ? '127.0.0.1' : (process.env.DB_HOST || '127.0.0.1');

const pool = mysql.createPool({
  host: dbHost,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;