const express = require('express');
require('dotenv').config();

const { initDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const tradeRoutes = require('./routes/tradeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
console.log('🔧 CORS_ORIGIN:', process.env.CORS_ORIGIN);

// 手动处理 CORS（绕过 Railway 代理）
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('📨 Request from origin:', origin);
  
  // 允许所有 Vercel 部署的域名
  if (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // 处理 preflight 请求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '路由不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 初始化数据库后启动服务器
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}\n`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
