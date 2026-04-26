const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// 用户注册
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 检查用户是否已存在
    const userExists = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(username, email);

    if (userExists) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, passwordHash);

    const userId = result.lastInsertRowid;

    // 为新用户创建账户（使用 INSERT OR IGNORE 避免重复）
    try {
      db.prepare('INSERT OR IGNORE INTO account (user_id) VALUES (?)').run(userId);
      
      // 验证 account 是否创建成功
      const accountCreated = db.prepare('SELECT * FROM account WHERE user_id = ?').get(userId);
      if (!accountCreated) {
        throw new Error('账户创建验证失败');
      }
    } catch (accountError) {
      console.error('创建账户失败:', accountError);
      // 如果创建账户失败，删除刚创建的用户
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      return res.status(500).json({ error: '创建账户失败' });
    }

    const user = db.prepare(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?'
    ).get(userId);

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin === 1
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 用户登录
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 查找用户
    const user = db.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).get(username);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        isAdmin: user.is_admin === 1
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin === 1
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};
