-- MySQL 8.x Schema for HTML Game
-- Charset/Engine
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(120) NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1, -- 1=active, 0=disabled
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Areas (servers/regions)
CREATE TABLE IF NOT EXISTS areas (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  is_open TINYINT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Characters
CREATE TABLE IF NOT EXISTS characters (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  area_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  job VARCHAR(20) NOT NULL, -- 职业（如：战士/法师等）
  level INT NOT NULL DEFAULT 1,
  exp BIGINT NOT NULL DEFAULT 0,
  exp_required BIGINT NOT NULL DEFAULT 100,
  hp INT NOT NULL DEFAULT 0,
  mp INT NOT NULL DEFAULT 0,
  atk INT NOT NULL DEFAULT 0,
  def INT NOT NULL DEFAULT 0,
  sp INT NOT NULL DEFAULT 0, -- 速度
  ap INT NOT NULL DEFAULT 0, -- 灵力
  a0 INT NOT NULL DEFAULT 0, -- 潜能
  a1 INT NOT NULL DEFAULT 0, -- 体质
  a2 INT NOT NULL DEFAULT 0, -- 魔力
  a3 INT NOT NULL DEFAULT 0, -- 力量
  a4 INT NOT NULL DEFAULT 0, -- 耐力
  a5 INT NOT NULL DEFAULT 0, -- 敏捷
  crit_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 暴率%
  crit_damage DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- 暴伤%
  gold BIGINT NOT NULL DEFAULT 0, -- 金币
  silver BIGINT NOT NULL DEFAULT 0, -- 银币
  pk_points INT NOT NULL DEFAULT 0, -- 竞技点
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_char_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_char_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT uniq_char_name_area UNIQUE (area_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Items master
CREATE TABLE IF NOT EXISTS items (
  id INT UNSIGNED PRIMARY KEY, -- 使用与前端资源一致的编号
  name VARCHAR(100) NOT NULL,
  category ENUM('道具','装备','法宝','灵饰','宠装','秘籍') NOT NULL,
  rarity TINYINT NOT NULL DEFAULT 1,
  level_required INT NOT NULL DEFAULT 1,
  stack_size INT NOT NULL DEFAULT 99,
  sell_price_gold INT NOT NULL DEFAULT 0,
  sell_price_silver INT NOT NULL DEFAULT 0,
  stats_json JSON NULL, -- 可选：加成等
  icon_path VARCHAR(200) NULL -- 例如 client/item/1027.png
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory (bag/equipped)
CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  character_id BIGINT UNSIGNED NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  bound TINYINT NOT NULL DEFAULT 0,
  location ENUM('bag','equipped','pet_bag') NOT NULL DEFAULT 'bag',
  equip_slot ENUM('weapon','armor','amulet','ring','belt','boot','helmet','necklace','bracelet','other') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_char FOREIGN KEY (character_id) REFERENCES characters(id),
  CONSTRAINT fk_inv_item FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pet species (optional taxonomy)
CREATE TABLE IF NOT EXISTS pet_species (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  tier ENUM('普通','神兽','仙兽','变异') NOT NULL DEFAULT '普通'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pets
CREATE TABLE IF NOT EXISTS pets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  character_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  species_id INT UNSIGNED NULL,
  tier ENUM('普通','神兽','仙兽','变异') NOT NULL DEFAULT '普通',
  level INT NOT NULL DEFAULT 1,
  exp BIGINT NOT NULL DEFAULT 0,
  growth DECIMAL(4,2) NOT NULL DEFAULT 1.00, -- 成长
  pf VARCHAR(10) NULL, -- 评分（如 SSS）
  atk_apt INT NOT NULL DEFAULT 1450, -- 攻击资质
  def_apt INT NOT NULL DEFAULT 1450, -- 防御资质
  hp_apt INT NOT NULL DEFAULT 1450,  -- 体力资质
  mp_apt INT NOT NULL DEFAULT 1450,  -- 法力资质
  spd_apt INT NOT NULL DEFAULT 1450, -- 速度资质
  dodge_apt INT NOT NULL DEFAULT 1450, -- 躲闪资质
  hp INT NOT NULL DEFAULT 0,
  mp INT NOT NULL DEFAULT 0,
  atk INT NOT NULL DEFAULT 0,
  def INT NOT NULL DEFAULT 0,
  sp INT NOT NULL DEFAULT 0,
  ap INT NOT NULL DEFAULT 0,
  jj_stage INT NOT NULL DEFAULT 0, -- 进阶阶数
  book_points INT NOT NULL DEFAULT 0, -- 技能书点
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pet_char FOREIGN KEY (character_id) REFERENCES characters(id),
  CONSTRAINT fk_pet_species FOREIGN KEY (species_id) REFERENCES pet_species(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pet pills usage counts（丹）
CREATE TABLE IF NOT EXISTS pet_pills (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  pet_id BIGINT UNSIGNED NOT NULL,
  pill_type ENUM('攻击丹','防御丹','体力丹','法力丹','速度丹','躲闪丹','成长丹','强化丹') NOT NULL,
  count INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_pet_pills_pet FOREIGN KEY (pet_id) REFERENCES pets(id),
  CONSTRAINT uniq_pet_pill UNIQUE (pet_id, pill_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Yuan Shen Zhi Li（元神之力） per pet
CREATE TABLE IF NOT EXISTS pet_essence_powers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  pet_id BIGINT UNSIGNED NOT NULL,
  power_type ENUM('气血','攻击','防御','速度','灵力') NOT NULL,
  points INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_pet_ys_pet FOREIGN KEY (pet_id) REFERENCES pets(id),
  CONSTRAINT uniq_pet_ys UNIQUE (pet_id, power_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE,
  skill_type ENUM('角色','宠物') NOT NULL,
  max_level INT NOT NULL DEFAULT 10,
  description TEXT NULL,
  icon_path VARCHAR(200) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Character skills
CREATE TABLE IF NOT EXISTS character_skills (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  character_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  level INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_char_skill_char FOREIGN KEY (character_id) REFERENCES characters(id),
  CONSTRAINT fk_char_skill_skill FOREIGN KEY (skill_id) REFERENCES skills(id),
  CONSTRAINT uniq_char_skill UNIQUE (character_id, skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pet skills
CREATE TABLE IF NOT EXISTS pet_skills (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  pet_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  level INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_pet_skill_pet FOREIGN KEY (pet_id) REFERENCES pets(id),
  CONSTRAINT fk_pet_skill_skill FOREIGN KEY (skill_id) REFERENCES skills(id),
  CONSTRAINT uniq_pet_skill UNIQUE (pet_id, skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pet equipment (三件：sz/yf/gl)
CREATE TABLE IF NOT EXISTS pet_equipment (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  pet_id BIGINT UNSIGNED NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  slot ENUM('sz','yf','gl') NOT NULL,
  CONSTRAINT fk_pet_eq_pet FOREIGN KEY (pet_id) REFERENCES pets(id),
  CONSTRAINT fk_pet_eq_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT uniq_pet_eq UNIQUE (pet_id, slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Marketplace listings（寄售）
CREATE TABLE IF NOT EXISTS market_listings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  area_id BIGINT UNSIGNED NOT NULL,
  seller_character_id BIGINT UNSIGNED NOT NULL,
  asset_type ENUM('item','pet') NOT NULL,
  inventory_id BIGINT UNSIGNED NULL, -- 当 asset_type=item
  pet_id BIGINT UNSIGNED NULL,       -- 当 asset_type=pet
  price_gold BIGINT NOT NULL DEFAULT 0,
  price_silver BIGINT NOT NULL DEFAULT 0,
  status ENUM('listed','sold','cancelled','expired') NOT NULL DEFAULT 'listed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ml_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT fk_ml_seller FOREIGN KEY (seller_character_id) REFERENCES characters(id),
  CONSTRAINT fk_ml_inv FOREIGN KEY (inventory_id) REFERENCES inventory(id),
  CONSTRAINT fk_ml_pet FOREIGN KEY (pet_id) REFERENCES pets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders（充值）
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
  provider VARCHAR(30) NOT NULL DEFAULT 'wechat',
  status ENUM('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  area_id BIGINT UNSIGNED NOT NULL,
  sender_character_id BIGINT UNSIGNED NOT NULL,
  channel ENUM('世界','分区','队伍','私聊') NOT NULL DEFAULT '世界',
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT fk_chat_sender FOREIGN KEY (sender_character_id) REFERENCES characters(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Blessing（祈福）示例：区总进度与个人进度
CREATE TABLE IF NOT EXISTS blessings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  area_id BIGINT UNSIGNED NOT NULL,
  total_progress BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bless_area FOREIGN KEY (area_id) REFERENCES areas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blessing_user_progress (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  area_id BIGINT UNSIGNED NOT NULL,
  character_id BIGINT UNSIGNED NOT NULL,
  progress BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bless_user_area FOREIGN KEY (area_id) REFERENCES areas(id),
  CONSTRAINT fk_bless_user_char FOREIGN KEY (character_id) REFERENCES characters(id),
  CONSTRAINT uniq_bless_user UNIQUE (area_id, character_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Index recommendations
CREATE INDEX IF NOT EXISTS idx_char_user ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_char ON inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_pet_char ON pets(character_id);
CREATE INDEX IF NOT EXISTS idx_market_area_status ON market_listings(area_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_area_time ON chat_messages(area_id, created_at);

-- Seed data (minimal demo)
INSERT INTO areas (name) VALUES ('一区') ON DUPLICATE KEY UPDATE name=name;

INSERT INTO users (username, email, password_hash) VALUES
  ('demo', 'demo@example.com', '$2y$10$examplehashplaceholder')
ON DUPLICATE KEY UPDATE email=VALUES(email);

INSERT INTO characters (user_id, area_id, name, job, level, hp, mp, atk, def, sp, ap, gold, silver)
SELECT u.id, a.id, '演示角色', '战士', 1, 100, 50, 10, 5, 5, 0, 1000, 0
FROM users u CROSS JOIN areas a
WHERE u.username='demo' AND a.name='一区'
ON DUPLICATE KEY UPDATE level=VALUES(level);

-- Sample items (use existing client/item IDs)
INSERT INTO items (id, name, category, rarity, level_required, stack_size, sell_price_gold, icon_path) VALUES
  (1027, '回城符', '道具', 1, 1, 99, 10, 'client/item/1027.png'),
  (1207, '新手剑', '装备', 1, 1, 1, 100, 'client/item/1207.png'),
  (1712, '新手护甲', '装备', 1, 1, 1, 100, 'client/item/1712.png')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Give demo character some items
INSERT INTO inventory (character_id, item_id, quantity, location)
SELECT c.id, 1027, 5, 'bag' FROM characters c WHERE c.name='演示角色'
ON DUPLICATE KEY UPDATE quantity=quantity;

INSERT INTO inventory (character_id, item_id, quantity, location, equip_slot)
SELECT c.id, 1207, 1, 'equipped', 'weapon' FROM characters c WHERE c.name='演示角色'
ON DUPLICATE KEY UPDATE location='equipped';

INSERT INTO inventory (character_id, item_id, quantity, location, equip_slot)
SELECT c.id, 1712, 1, 'equipped', 'armor' FROM characters c WHERE c.name='演示角色'
ON DUPLICATE KEY UPDATE location='equipped';

-- Demo pet for character
INSERT INTO pet_species (name, tier) VALUES ('孙悟空', '仙兽')
ON DUPLICATE KEY UPDATE tier=VALUES(tier);

INSERT INTO pets (character_id, name, species_id, tier, level, growth, pf, atk_apt, def_apt, hp_apt, mp_apt, spd_apt, dodge_apt, hp, mp, atk, def, sp)
SELECT c.id, '孙悟空', ps.id, '仙兽', 1, 1.10, 'SSS', 1450, 1450, 1450, 1450, 1450, 1450, 100, 50, 20, 10, 8
FROM characters c CROSS JOIN pet_species ps
WHERE c.name='演示角色' AND ps.name='孙悟空'
ON DUPLICATE KEY UPDATE level=VALUES(level);

-- Demo chat
INSERT INTO chat_messages (area_id, sender_character_id, channel, content)
SELECT a.id, c.id, '世界', '欢迎来到迷你梦幻（本地演示）！'
FROM areas a CROSS JOIN characters c
WHERE a.name='一区' AND c.name='演示角色';