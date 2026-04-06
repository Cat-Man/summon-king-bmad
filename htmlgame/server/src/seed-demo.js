const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql2/promise');

async function upsertArea(conn, name){
  await conn.query('INSERT IGNORE INTO areas (name, is_open) VALUES (?, 1)', [name]);
  const [rows] = await conn.query('SELECT id FROM areas WHERE name = ?', [name]);
  return rows[0].id;
}

async function upsertUser(conn, username){
  await conn.query('INSERT IGNORE INTO users (username, password_hash) VALUES (?, ?)', [username, 'localdev']);
  const [rows] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
  return rows[0].id;
}

async function upsertCharacter(conn, userId, areaId, name){
  // Unique by (area_id, name)
  const [exist] = await conn.query('SELECT id FROM characters WHERE area_id = ? AND name = ?', [areaId, name]);
  if (exist.length){
    return exist[0].id;
  }
  const [res] = await conn.query(
    `INSERT INTO characters (user_id, area_id, name, job, level, exp_required, hp, mp, atk, def, sp, ap, gold, silver)
     VALUES (?, ?, ?, '战士', 5, 200, 120, 60, 25, 10, 8, 5, 12345, 678)`,
    [userId, areaId, name]
  );
  return res.insertId;
}

async function upsertItemMaster(conn, list){
  for (const it of list){
    // id is PK; use INSERT IGNORE
    await conn.query(
      'INSERT IGNORE INTO items (id, name, category, rarity, level_required, stack_size, sell_price_gold, sell_price_silver, icon_path) VALUES (?,?,?,?,?,?,?,?,?)',
      [it.id, it.name, it.category, it.rarity || 1, it.level_required || 1, it.stack_size || 99, it.sell_price_gold || 0, it.sell_price_silver || 0, it.icon_path]
    );
  }
}

async function upsertInventory(conn, characterId, entries){
  for (const e of entries){
    // naive insert; allow duplicates only if different item_id or location
    await conn.query(
      'INSERT INTO inventory (character_id, item_id, quantity, bound, location) VALUES (?,?,?,?,?)',
      [characterId, e.item_id, e.quantity || 1, e.bound || 0, e.location || 'bag']
    );
  }
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'htmlgame',
    multipleStatements: true,
  });
  try{
    const areaId = await upsertArea(conn, '本地一区');
    const userId = await upsertUser(conn, 'demo');
    const charId = await upsertCharacter(conn, userId, areaId, '演示角色');

    await upsertItemMaster(conn, [
      { id: 1027, name: '新手剑', category: '装备', icon_path: 'client/item/1027.png' },
      { id: 1207, name: '红药水', category: '道具', icon_path: 'client/item/1207.png' },
      { id: 1712, name: '灵饰·戒指', category: '灵饰', icon_path: 'client/item/1712.png' },
      { id: 1343, name: '法宝·紫焰', category: '法宝', icon_path: 'client/item/1343.png' }
    ]);

    await upsertInventory(conn, charId, [
      { item_id: 1027, quantity: 1, bound: 1 },
      { item_id: 1207, quantity: 10 },
      { item_id: 1712, quantity: 1 },
      { item_id: 1343, quantity: 1 }
    ]);

    console.log('Demo seed completed: area/user/character/items/inventory');
    process.exit(0);
  }catch(e){
    console.error('Demo seed failed:', e.message);
    process.exit(1);
  }finally{
    await conn.end();
  }
})();