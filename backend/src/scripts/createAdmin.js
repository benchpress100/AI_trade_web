const bcrypt = require('bcrypt');
const { db } = require('../config/database');

async function createAdmin() {
  const username = 'admin';
  const email = 'admin@example.com';
  const password = 'admin123';

  try {
    // 检查管理员是否已存在
    const existingAdmin = db.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).get(username);

    if (existingAdmin) {
      console.log('❌ 管理员账户已存在');
      console.log('用户名:', username);
      return;
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建管理员用户
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, 1)'
    ).run(username, email, passwordHash);

    const userId = result.lastInsertRowid;

    // 创建账户
    db.prepare('INSERT INTO account (user_id) VALUES (?)').run(userId);

    console.log('✓ 管理员账户创建成功！');
    console.log('用户名:', username);
    console.log('密码:', password);
    console.log('邮箱:', email);
    console.log('\n请在首次登录后修改密码！');
  } catch (error) {
    console.error('创建管理员失败:', error);
  }
}

// 等待数据库初始化后再创建管理员
const { initDB } = require('../config/database');
initDB().then(() => {
  createAdmin();
}).catch(err => {
  console.error('数据库初始化失败:', err);
});
