const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const sqlPath = path.join(__dirname, '../../db/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });
    const dbName = process.env.DB_NAME || 'htmlgame';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.changeUser({ database: dbName });

    let cleaned = sql
      .replace(/CREATE\s+DATABASE[\s\S]*?;\s*/i, '')
      .replace(/USE\s+`?htmlgame`?\s*;\s*/i, '');
    // 兼容旧版本 MySQL：不支持 CREATE INDEX IF NOT EXISTS
    cleaned = cleaned.replace(/INDEX\s+IF\s+NOT\s+EXISTS/gi, 'INDEX');

    // 将 SQL 语句拆分逐句执行以忽略部分重复错误
    const statements = cleaned
      .split(/;\s*\n|;\s*$/m)
      .map(s => s.trim())
      .filter(s => s && !/^--/m.test(s));

    // 关闭外键检查以避免顺序问题
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (err) {
        // 忽略常见的幂等错误：表已存在、索引已存在、约束已存在等
        const errno = err && (err.errno || err.code);
        const msg = String(err && err.message || '');
        const ignorableCodes = new Set([1050 /*ER_TABLE_EXISTS_ERROR*/, 1061 /*ER_DUP_KEYNAME*/, 1062 /*ER_DUP_ENTRY*/, 1091 /*ER_CANT_DROP_FIELD_OR_KEY*/]);
        const ignorable = ignorableCodes.has(err.errno) || /already exists/i.test(msg) || /Duplicate key name/i.test(msg);
        if (!ignorable) {
          console.error('Failed statement:', stmt);
          throw err;
        }
        console.warn('Ignored duplicate/exists error for statement');
      }
    }
    await connection.query('SET FOREIGN_KEY_CHECKS=1');
    await connection.end();
    console.log('Database initialized from schema.sql');
    process.exit(0);
  } catch (e) {
    console.error('DB init failed:', e.message);
    process.exit(1);
  }
})();