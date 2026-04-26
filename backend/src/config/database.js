const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 确保数据目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'trading.db');

let db = null;

// 初始化数据库
const initDB = async () => {
  const SQL = await initSqlJs();
  
  // 如果数据库文件存在，加载它
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('✓ SQLite 数据库加载成功:', dbPath);
  } else {
    // 创建新数据库
    db = new SQL.Database();
    console.log('✓ SQLite 数据库创建成功:', dbPath);
  }

  // 创建表
  createTables();
  
  // 保存数据库
  saveDB();
  
  return db;
};

// 创建数据库表
const createTables = () => {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 交易操作记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      symbol_name TEXT,
      action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      total_amount REAL NOT NULL,
      note TEXT,
      trade_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 持仓表
  db.run(`
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      symbol_name TEXT,
      quantity REAL NOT NULL,
      avg_cost REAL NOT NULL,
      current_price REAL,
      market_value REAL,
      profit_loss REAL,
      profit_loss_percent REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 账户资金表
  db.run(`
    CREATE TABLE IF NOT EXISTS account (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      cash REAL DEFAULT 1000000.00,
      total_assets REAL DEFAULT 1000000.00,
      total_profit_loss REAL DEFAULT 0.00,
      total_profit_loss_percent REAL DEFAULT 0.00,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.run('CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol)');
  db.run('CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id)');

  console.log('✓ 数据库表初始化完成');
};

// 保存数据库到文件
const saveDB = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

// 包装数据库操作
const dbWrapper = {
  run: (sql, params = []) => {
    try {
      db.run(sql, params);
      saveDB();
      return { changes: db.getRowsModified() };
    } catch (error) {
      console.error('SQL Error:', error);
      throw error;
    }
  },
  
  get: (sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const result = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return result;
    } catch (error) {
      console.error('SQL Error:', error);
      throw error;
    }
  },
  
  all: (sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error('SQL Error:', error);
      throw error;
    }
  },

  prepare: (sql) => {
    return {
      run: (...params) => {
        const result = dbWrapper.run(sql, params);
        // 获取最后插入的 ID
        const lastId = dbWrapper.get('SELECT last_insert_rowid() as id');
        return { 
          changes: result.changes,
          lastInsertRowid: lastId ? lastId.id : null 
        };
      },
      get: (...params) => dbWrapper.get(sql, params),
      all: (...params) => dbWrapper.all(sql, params)
    };
  },

  transaction: (fn) => {
    return (...args) => {
      try {
        const result = fn(...args);
        saveDB();
        return result;
      } catch (error) {
        throw error;
      }
    };
  },

  // 执行多个操作作为事务
  exec: (sql) => {
    try {
      db.exec(sql);
      saveDB();
    } catch (error) {
      console.error('SQL Error:', error);
      throw error;
    }
  }
};

// 导出初始化函数和数据库包装器
module.exports = {
  initDB,
  db: dbWrapper
};
