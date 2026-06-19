const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Root@123",
  database: process.env.DB_NAME || "legal_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+05:30",
});

module.exports = pool;
