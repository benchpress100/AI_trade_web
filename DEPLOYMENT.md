# 部署指南

本指南将帮助你把项目部署到互联网上，让所有人都能访问。

## 方案 1：Vercel + Railway（推荐，免费）

### 准备工作

1. **注册账号**
   - [Vercel](https://vercel.com) - 用于部署前端
   - [Railway](https://railway.app) - 用于部署后端
   - [GitHub](https://github.com) - 用于代码托管

2. **上传代码到 GitHub**
   ```bash
   # 在项目根目录
   git init
   git add .
   git commit -m "Initial commit"
   
   # 在 GitHub 创建新仓库后
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

---

## 第一步：部署后端到 Railway

### 1. 登录 Railway
- 访问 https://railway.app
- 使用 GitHub 账号登录

### 2. 创建新项目
- 点击 "New Project"
- 选择 "Deploy from GitHub repo"
- 选择你的仓库
- 选择 `backend` 目录

### 3. 配置环境变量
在 Railway 项目设置中添加以下环境变量：

```
NODE_ENV=production
PORT=5000
JWT_SECRET=你的JWT密钥（使用之前生成的）
JWT_EXPIRE=7d
CORS_ORIGIN=https://你的前端域名.vercel.app
```

### 4. 部署
- Railway 会自动检测并部署
- 等待部署完成
- 记下你的后端 URL，类似：`https://你的项目名.railway.app`

### 5. 创建管理员账户
在 Railway 控制台中运行：
```bash
npm run create-admin
```

---

## 第二步：部署前端到 Vercel

### 1. 登录 Vercel
- 访问 https://vercel.com
- 使用 GitHub 账号登录

### 2. 导入项目
- 点击 "Add New Project"
- 选择你的 GitHub 仓库
- Root Directory 选择 `frontend`

### 3. 配置构建设置
- Framework Preset: Create React App
- Build Command: `npm run build`
- Output Directory: `build`

### 4. 配置环境变量
添加环境变量：
```
REACT_APP_API_URL=https://你的后端URL.railway.app/api
```

### 5. 部署
- 点击 "Deploy"
- 等待部署完成
- 你会得到一个 URL，类似：`https://你的项目名.vercel.app`

### 6. 更新后端 CORS
回到 Railway，更新 `CORS_ORIGIN` 环境变量为你的 Vercel URL

---

## 方案 2：使用云服务器（阿里云/腾讯云）

### 1. 购买服务器
- 推荐配置：2核2G，带宽1-5Mbps
- 操作系统：Ubuntu 20.04 或更高

**购买指南：**
- **阿里云**：访问 https://www.aliyun.com → 云服务器ECS → 选择地域和配置
- **腾讯云**：访问 https://cloud.tencent.com → 云服务器CVM → 选择地域和配置
- **安全组配置**：必须开放 22(SSH)、80(HTTP)、443(HTTPS) 端口
- **价格参考**：约 ¥50-100/月（新用户有优惠）

### 2. 安装环境
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Git（必须先安装，否则无法克隆代码）
sudo apt install git -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2（进程管理器）
sudo npm install -g pm2
```

### 3. 上传代码
```bash
# 使用 git 克隆（注意：不要用 sudo，避免权限问题）
cd /var/www
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名

# 如果遇到权限问题，调整权限
sudo chown -R $USER:$USER /var/www/你的仓库名
```

**⚠️ 常见问题：**
- 如果提示 `git: command not found`，说明没有安装 Git，回到步骤2安装
- 注意仓库名大小写（例如：AI_trade_web 不是 Ai_trade_web）

### 4. 部署后端
```bash
cd backend
npm install
cp .env.example .env

# 编辑 .env 文件，配置环境变量
nano .env
```

**⚠️ 重要配置（必须修改）：**
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=你的随机密钥（必须改成复杂字符串，例如：k9mP2wX5zB8nQ0rT3yU7vA1cE4gI6jL9）
JWT_EXPIRE=7d  # 注意：是 JWT_EXPIRE，不是 JWT_EXPIRES_IN
CORS_ORIGIN=http://你的服务器IP  # 例如：http://47.97.57.179
```

**保存并退出 nano：**
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

```bash
# 创建管理员账号
npm run create-admin

# 使用 PM2 启动（注意进程名要用 backend）
pm2 start src/server.js --name backend
pm2 save
pm2 startup

# 验证后端是否运行
pm2 status
```

**⚠️ 常见问题：**
- 如果 `pm2 restart backend` 提示找不到进程，用 `pm2 list` 查看实际进程名
- 如果后端启动失败，用 `pm2 logs backend` 查看错误日志

### 5. 部署前端
```bash
cd ../frontend
npm install

# 创建 .env 文件（注意：通过 Nginx 代理，不需要端口号）
echo "REACT_APP_API_URL=http://你的服务器IP/api" > .env

# 例如：
# echo "REACT_APP_API_URL=http://47.97.57.179/api" > .env

# 构建前端（这一步很重要，会生成 build 文件夹）
npm run build

# 验证 build 文件夹是否生成
ls -la build
```

**⚠️ 重要说明：**
- API 地址不要加端口号（例如：`http://47.97.57.179/api`，不是 `http://47.97.57.179:3000/api`）
- 前端通过 Nginx 的 80 端口代理访问后端，更安全
- 如果修改了 .env，必须重新执行 `npm run build`
- build 文件夹必须存在，否则 Nginx 会报 500 错误

### 6. 配置 Nginx
```bash
sudo nano /etc/nginx/sites-available/trading
```

添加以下配置（注意替换你的IP和仓库名）：
```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端
    location / {
        root /var/www/你的仓库名/frontend/build;
        try_files $uri /index.html;
    }

    # 后端 API（注意端口号是3000）
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**配置示例（阿里云）：**
```nginx
server {
    listen 80;
    server_name 47.97.57.179;

    # 前端
    location / {
        root /var/www/AI_trade_web/frontend/build;  # 注意：AI 是大写
        try_files $uri /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/trading /etc/nginx/sites-enabled/

# 测试配置是否正确（必须执行）
sudo nginx -t

# 如果提示 syntax is ok，重启 Nginx
sudo systemctl restart nginx
```

**⚠️ 常见问题排查：**
```bash
# 1. 检查后端是否运行
pm2 status

# 2. 检查前端 build 文件夹是否存在（注意仓库名大小写）
ls -la /var/www/你的仓库名/frontend/build

# 3. 检查 Nginx 状态
sudo systemctl status nginx

# 4. 查看 Nginx 错误日志
sudo tail -n 50 /var/log/nginx/error.log

# 5. 查看后端日志
pm2 logs backend --lines 50
```

**⚠️ 常见错误及解决方案：**

| 错误现象 | 原因 | 解决方案 |
|---------|------|---------|
| 500 错误 + "unexpected end of file" | Nginx 配置文件缺少闭合的 `}` | 检查配置文件，确保所有 `{` 都有对应的 `}` |
| 500 错误 + "rewrite or internal redirection cycle" | build 文件夹不存在或路径错误 | 执行 `npm run build` 并检查路径 |
| 404 错误 | 仓库名大小写不对 | 确认实际仓库名（例如：AI_trade_web vs Ai_trade_web） |
| 登录返回 500 | JWT_EXPIRE 配置错误 | 确保 .env 中是 `JWT_EXPIRE=7d`，不是 `JWT_EXPIRES_IN` |
| pm2 restart 失败 | 进程名不对 | 用 `pm2 list` 查看实际进程名 |
| 前后端无法通信 | API 地址配置错误 | 前端 .env 应该是 `http://IP/api`，不带端口号 |


### 7. 配置防火墙和安全组

**服务器防火墙（UFW）：**
```bash
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 22    # SSH
sudo ufw enable
sudo ufw status
```

**⚠️ 云服务器安全组配置（重要）：**

必须在云服务商控制台配置安全组规则：

| 端口 | 协议 | 授权对象 | 说明 |
|-----|------|---------|------|
| 22 | TCP | 0.0.0.0/0 | SSH 远程登录 |
| 80 | TCP | 0.0.0.0/0 | HTTP 网站访问 |
| 443 | TCP | 0.0.0.0/0 | HTTPS 网站访问 |

**注意：**
- 不需要开放 3000 端口（后端通过 Nginx 代理访问）
- 阿里云：ECS 控制台 → 安全组 → 配置规则 → 添加入方向规则
- 腾讯云：CVM 控制台 → 安全组 → 入站规则 → 添加规则

### 8. 配置 HTTPS（可选但推荐）
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d 你的域名
```

---

## 完整故障排查指南

### 问题1：网站无法访问（500 错误）

**排查步骤：**
```bash
# 1. 查看 Nginx 错误日志
sudo tail -n 50 /var/log/nginx/error.log

# 2. 检查 Nginx 配置
sudo nginx -t

# 3. 检查后端状态
pm2 status

# 4. 检查 build 文件夹
ls -la /var/www/你的仓库名/frontend/build
```

**常见原因：**
- Nginx 配置文件语法错误（缺少 `}`）
- build 文件夹不存在或路径错误
- 仓库名大小写不对

### 问题2：登录失败（500 错误）

**排查步骤：**
```bash
# 1. 检查后端配置
cat /var/www/你的仓库名/backend/.env

# 2. 确认 JWT_EXPIRE 配置
# 应该是：JWT_EXPIRE=7d
# 不是：JWT_EXPIRES_IN=7d

# 3. 重启后端
pm2 restart backend
```

### 问题3：前后端无法通信

**排查步骤：**
```bash
# 1. 检查前端 API 配置
cat /var/www/你的仓库名/frontend/.env

# 2. 应该是：REACT_APP_API_URL=http://你的IP/api
# 不是：REACT_APP_API_URL=http://你的IP:3000/api

# 3. 重新构建前端
cd /var/www/你的仓库名/frontend
npm run build
sudo systemctl restart nginx
```

### 问题4：PM2 进程管理

**常用命令：**
```bash
pm2 list              # 查看所有进程
pm2 status            # 查看进程状态
pm2 logs backend      # 查看后端日志
pm2 restart backend   # 重启后端
pm2 stop backend      # 停止后端
pm2 delete backend    # 删除进程

# 重新启动
cd /var/www/你的仓库名/backend
pm2 start src/server.js --name backend
pm2 save
```

### 问题5：Git 相关

**常见问题：**
```bash
# git: command not found
sudo apt install git -y

# 仓库名大小写问题
cd /var/www
ls -la  # 查看实际仓库名
```

### 问题6：安全组配置

**检查清单：**
- ✅ 80 端口已开放（HTTP）
- ✅ 443 端口已开放（HTTPS）
- ✅ 22 端口已开放（SSH）
- ❌ 不需要开放 3000 端口

**验证方法：**
```bash
# 在本地电脑测试
curl http://你的服务器IP
```

### 快速重启所有服务

```bash
# 重启后端
pm2 restart backend

# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
pm2 status
sudo systemctl status nginx
```

---

## 方案 3：使用 Docker 部署

### 1. 创建 Dockerfile（后端）
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

### 2. 创建 Dockerfile（前端）
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. 创建 docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your_secret_here
      - CORS_ORIGIN=http://localhost:3000
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### 4. 启动
```bash
docker-compose up -d
```

---

## 域名配置

如果你有域名：

1. **添加 DNS 记录**
   - A 记录：指向你的服务器 IP
   - 或 CNAME：指向 Vercel/Railway 提供的域名

2. **在部署平台添加域名**
   - Vercel: Settings → Domains
   - Railway: Settings → Domains

---

## 数据备份

### 备份数据库
```bash
# 复制数据库文件
cp backend/data/trading.db backup/trading-$(date +%Y%m%d).db
```

### 自动备份脚本
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/var/backups/trading"
mkdir -p $BACKUP_DIR
cp /var/www/你的项目/backend/data/trading.db $BACKUP_DIR/trading-$(date +%Y%m%d-%H%M%S).db

# 保留最近7天的备份
find $BACKUP_DIR -name "trading-*.db" -mtime +7 -delete
```

添加到 crontab：
```bash
crontab -e
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

---

## 监控和维护

### 查看日志
```bash
# PM2 日志
pm2 logs trading-backend

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 更新代码
```bash
cd /var/www/你的项目
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart trading-backend
sudo systemctl reload nginx
```

---

## 常见问题

### 1. CORS 错误
确保后端 `.env` 中的 `CORS_ORIGIN` 设置正确

### 2. 数据库文件权限
```bash
chmod 644 backend/data/trading.db
chown www-data:www-data backend/data/trading.db
```

### 3. 端口被占用
```bash
# 查看端口占用
sudo lsof -i :5000
# 杀死进程
sudo kill -9 PID
```

---

## 推荐的部署方案对比

| 方案 | 优点 | 缺点 | 成本 |
|------|------|------|------|
| Vercel + Railway | 简单、自动部署、免费 HTTPS | 免费额度有限 | 免费/低 |
| 云服务器 | 完全控制、性能稳定 | 需要运维知识 | 中等 |
| Docker | 易于迁移、环境一致 | 需要学习 Docker | 取决于托管 |

对于初学者，推荐使用 **Vercel + Railway** 方案！
