const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows && rows[0] && rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 登录（演示版：按用户名存在即登录，不校验密码）
app.post('/api/login', async (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ message: '缺少用户名' });
  try {
    const [users] = await pool.query('SELECT id, username FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      return res.json({ user_id: users[0].id, username: users[0].username });
    }
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, 'localdev']
    );
    res.json({ user_id: result.insertId, username });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 区服列表
app.get('/api/areas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, is_open FROM areas ORDER BY id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 角色列表（按用户与区服）
app.get('/api/characters', async (req, res) => {
  const { user_id, area_id } = req.query;
  if (!user_id || !area_id) return res.status(400).json({ message: '缺少 user_id 或 area_id' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM characters WHERE user_id = ? AND area_id = ? ORDER BY id',
      [user_id, area_id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 角色详情
app.get('/api/characters/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM characters WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: '角色不存在' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 背包物品（包含物品详情）
app.get('/api/characters/:id/inventory', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.query(
      `SELECT i.id, i.item_id, i.quantity, i.bound, i.location, i.equip_slot,
              im.name AS item_name, im.icon_path, im.category, im.rarity
         FROM inventory i
         JOIN items im ON im.id = i.item_id
        WHERE i.character_id = ?
        ORDER BY i.id`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 宠物列表
app.get('/api/pets', async (req, res) => {
  const { character_id } = req.query;
  if (!character_id) return res.status(400).json({ message: '缺少 character_id' });
  try {
    const [rows] = await pool.query('SELECT * FROM pets WHERE character_id = ? ORDER BY id', [character_id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 聊天列表（最近50条）
app.get('/api/chat', async (req, res) => {
  const { area_id } = req.query;
  if (!area_id) return res.status(400).json({ message: '缺少 area_id' });
  try {
    const [rows] = await pool.query(
      `SELECT cm.id, cm.area_id, cm.channel, cm.content, cm.created_at,
              c.id AS sender_character_id, c.name AS sender_name
         FROM chat_messages cm
         JOIN characters c ON c.id = cm.sender_character_id
        WHERE cm.area_id = ?
        ORDER BY cm.id DESC
        LIMIT 50`,
      [area_id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 发送聊天
app.post('/api/chat/send', async (req, res) => {
  const { area_id, sender_character_id, content, channel } = req.body || {};
  if (!area_id || !sender_character_id || !content) return res.status(400).json({ message: '缺少必要字段' });
  try {
    const ch = channel || '世界';
    const [result] = await pool.query(
      'INSERT INTO chat_messages (area_id, sender_character_id, channel, content) VALUES (?, ?, ?, ?)',
      [area_id, sender_character_id, ch, content]
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});