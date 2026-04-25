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

### 2. 安装环境
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Nginx
sudo apt install -y nginx

# 安装 PM2（进程管理器）
sudo npm install -g pm2
```

### 3. 上传代码
```bash
# 使用 git 克隆
cd /var/www
sudo git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
```

### 4. 部署后端
```bash
cd backend
npm install
cp .env.example .env

# 编辑 .env 文件，配置环境变量
nano .env

# 创建管理员
npm run create-admin

# 使用 PM2 启动
pm2 start src/server.js --name trading-backend
pm2 save
pm2 startup
```

### 5. 部署前端
```bash
cd ../frontend
npm install

# 编辑 .env 文件
echo "REACT_APP_API_URL=http://你的服务器IP:5000/api" > .env

# 构建
npm run build
```

### 6. 配置 Nginx
```bash
sudo nano /etc/nginx/sites-available/trading
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端
    location / {
        root /var/www/你的仓库名/frontend/build;
        try_files $uri /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:5000;
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
sudo ln -s /etc/nginx/sites-available/trading /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 配置防火墙
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### 8. 配置 HTTPS（可选但推荐）
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d 你的域名
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
