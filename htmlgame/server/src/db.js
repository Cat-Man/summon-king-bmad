const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql2/promise');

// 强制使用本地数据库主机，仅允许连接到本机 MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'liyuchen@123',
  database: process.env.DB_NAME || 'htmlgame',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
});

module.exports = { pool };