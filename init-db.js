const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function initDB() {
  try {
    const dbName = process.env.DB_NAME;
    if (!dbName) {
      throw new Error('DB_NAME is not set in .env');
    }

    // Connect without database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${process.env.DB_NAME}\`;`);
    const schema = fs.readFileSync('schema.sql', 'utf8');
    await connection.query(schema);

    console.log('Database initialized successfully');
    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDB();