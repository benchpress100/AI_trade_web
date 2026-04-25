# 安装和部署指南

## 前置要求

- Node.js (v16 或更高版本)
- npm 或 yarn

## 安装步骤

### 1. 后端配置

```bash
cd backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置 JWT_SECRET
# 生成 JWT_SECRET 的方法：
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 将生成的字符串复制到 .env 文件的 JWT_SECRET 中
```

### 2. 创建管理员账户

```bash
cd backend
npm run create-admin
# 默认管理员账户：
# 用户名: admin
# 密码: admin123
# 邮箱: admin@example.com
```

### 3. 前端配置

```bash
cd frontend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 如果后端运行在不同的地址，修改 .env 文件中的 REACT_APP_API_URL
```

### 4. 启动服务

#### 开发环境

**后端：**
```bash
cd backend
npm run dev
# 服务将运行在 http://localhost:5000
```

**前端：**
```bash
cd frontend
npm start
# 应用将运行在 http://localhost:3000
```

#### 生产环境

**后端：**
```bash
cd backend
npm start
```

**前端：**
```bash
cd frontend
npm run build
# 构建产物在 build/ 目录，可以部署到任何静态服务器
```

## 使用说明

### 普通用户

1. 访问 http://localhost:3000
2. 点击"注册"创建账号
3. 登录后可以查看管理员发布的交易操作和持仓信息

### 管理员

1. 使用管理员账号登录
2. 在 Dashboard 页面可以看到"发布交易操作"表单
3. 填写股票代码、操作类型、数量、价格等信息
4. 点击"发布交易"，系统会自动更新持仓和账户信息
5. 所有登录用户都能看到你发布的交易记录和持仓状态

## 数据库说明

本项目使用 SQLite 数据库，数据文件位于 `backend/data/trading.db`。

- 无需安装额外的数据库软件
- 数据库会在首次启动时自动创建
- 所有数据存储在单个文件中，便于备份和迁移

## 常见问题

### 数据库文件丢失

- 数据库文件位于 `backend/data/trading.db`
- 如果删除此文件，下次启动会自动创建新的空数据库
- 记得重新运行 `npm run create-admin` 创建管理员账户

### 前端无法连接后端

- 确认后端服务正在运行
- 检查前端 `.env` 文件中的 API URL 是否正确
- 检查浏览器控制台是否有 CORS 错误

### 登录后立即退出

- 检查 JWT_SECRET 是否配置
- 清除浏览器的 localStorage
- 检查后端日志是否有错误

## API 文档

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息（需要认证）

### 交易接口（需要认证）

- `POST /api/trades` - 发布交易操作（仅管理员）
- `GET /api/trades` - 获取交易记录
- `GET /api/trades/positions` - 获取持仓信息
- `GET /api/trades/account` - 获取账户信息

## 部署到互联网

查看 [DEPLOYMENT.md](DEPLOYMENT.md) 了解如何将项目部署到互联网。

推荐使用 Vercel（前端）+ Railway（后端）方案，完全免费且简单易用。

## 技术支持

如有问题，请检查：
1. 后端日志输出
2. 浏览器开发者工具的控制台
3. 数据库连接状态
