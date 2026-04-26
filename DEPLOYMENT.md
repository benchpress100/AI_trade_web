# 部署指南

本指南将帮助你把项目部署到云服务器（阿里云/腾讯云），让所有人都能访问。

## 准备工作

### 1. 购买服务器
- 推荐配置：2核2G，带宽1-5Mbps
- 操作系统：Ubuntu 20.04 或更高

**购买指南：**
- **阿里云**：访问 https://www.aliyun.com → 云服务器ECS → 选择地域和配置
- **腾讯云**：访问 https://cloud.tencent.com → 云服务器CVM → 选择地域和配置
- **安全组配置**：必须开放 22(SSH)、80(HTTP)、443(HTTPS) 端口
- **价格参考**：约 ¥50-100/月（新用户有优惠）

---

## 部署步骤

### 1. 安装环境

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

### 2. 上传代码

```bash
# 使用 git 克隆（注意：不要用 sudo，避免权限问题）
cd /var/www
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名

# 如果遇到权限问题，调整权限
sudo chown -R $USER:$USER /var/www/你的仓库名
```

**⚠️ 常见问题：**
- 如果提示 `git: command not found`，说明没有安装 Git，回到步骤1安装
- 注意仓库名大小写（例如：AI_trade_web 不是 Ai_trade_web）

### 3. 部署后端

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

# 使用 PM2 启动后端
pm2 start src/server.js --name backend
pm2 save
pm2 startup

# 验证后端是否运行
pm2 status
```

**⚠️ 常见问题：**
- 如果 `pm2 restart backend` 提示找不到进程，用 `pm2 list` 查看实际进程名
- 如果后端启动失败，用 `pm2 logs backend` 查看错误日志

### 4. 部署前端

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

### 5. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/trading
```

添加以下配置（注意替换你的IP和仓库名，注意大小写）：

```nginx
server {
    listen 80;
    server_name 你的服务器IP;  # 例如：47.97.57.179

    # 前端
    location / {
        root /var/www/你的仓库名/frontend/build;  # 注意仓库名大小写
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

**启用配置：**

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/trading /etc/nginx/sites-enabled/

# 测试配置是否正确（必须执行）
sudo nginx -t

# 如果提示 syntax is ok，重启 Nginx
sudo systemctl restart nginx
```

### 6. 配置防火墙和安全组

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

### 7. 配置 HTTPS（可选但推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（需要域名）
sudo certbot --nginx -d 你的域名
```

---

## 数据库管理

### 查询数据库

**重要提示：** 项目使用 sql.js 内存数据库，后端运行时会锁定数据库文件。

**查询数据库的正确方法：**

```bash
cd /var/www/你的仓库名/backend

# 1. 停止后端进程
pm2 stop backend

# 2. 查询数据库
sqlite3 data/trading.db "SELECT * FROM users;"
sqlite3 data/trading.db "SELECT * FROM account;"
sqlite3 data/trading.db "SELECT * FROM trades;"

# 3. 查询完成后重启后端
pm2 start backend
```

**常用查询命令：**

```bash
# 查看所有用户
sqlite3 data/trading.db "SELECT id, username, email FROM users;"

# 查看账户信息
sqlite3 data/trading.db "SELECT * FROM account;"

# 查看交易记录
sqlite3 data/trading.db "SELECT * FROM trades ORDER BY trade_time DESC LIMIT 10;"

# 查看持仓
sqlite3 data/trading.db "SELECT * FROM positions;"

# 统计数据
sqlite3 data/trading.db "SELECT COUNT(*) FROM users;"
sqlite3 data/trading.db "SELECT COUNT(*) FROM trades;"
```

**⚠️ 注意事项：**
- 必须先停止后端进程才能查询数据库
- 查询完成后记得重启后端进程
- 如果忘记重启后端，网站将无法访问

---

## 常见问题排查

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

**常见原因及解决方案：**

| 错误现象 | 原因 | 解决方案 |
|---------|------|---------|
| 500 错误 + "unexpected end of file" | Nginx 配置文件缺少闭合的 `}` | 检查配置文件，确保所有 `{` 都有对应的 `}` |
| 500 错误 + "rewrite or internal redirection cycle" | build 文件夹不存在或路径错误 | 执行 `npm run build` 并检查路径 |
| 404 错误 | 仓库名大小写不对 | 确认实际仓库名（例如：AI_trade_web vs Ai_trade_web） |

### 问题2：注册/登录失败（500 错误）

**排查步骤：**
```bash
# 1. 查看后端实时日志
pm2 logs backend --lines 50

# 2. 检查后端配置
cat /var/www/你的仓库名/backend/.env

# 3. 确认 JWT_EXPIRE 配置
# 应该是：JWT_EXPIRE=7d
# 不是：JWT_EXPIRES_IN=7d
```

**常见原因：**
- JWT_EXPIRE 配置错误
- 数据库文件损坏
- account 表缺失记录

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

### 问题4：数据库无法打开

**错误信息：** `Error: unable to open database file`

**原因：** 后端进程正在使用数据库文件

**解决方案：**
```bash
# 停止后端进程
pm2 stop backend

# 现在可以查询数据库了
sqlite3 data/trading.db "SELECT * FROM users;"

# 查询完成后重启后端
pm2 start backend
```

### 问题5：数据库文件损坏

**症状：** 停止后端后仍然无法打开数据库

**解决方案：**
```bash
cd /var/www/你的仓库名/backend/data

# 1. 查看备份文件
ls -la *.backup

# 2. 恢复备份
cp trading.db.backup trading.db

# 3. 如果没有备份，重新初始化数据库
cd ..
rm data/trading.db
pm2 start backend
sleep 3
pm2 stop backend
npm run create-admin
pm2 start backend
```

---

## PM2 进程管理

### 常用命令

```bash
pm2 list              # 查看所有进程
pm2 status            # 查看进程状态
pm2 logs backend      # 查看后端日志
pm2 logs backend --lines 50  # 查看最近50行日志
pm2 logs backend --lines 0   # 实时查看日志（Ctrl+C 退出）
pm2 restart backend   # 重启后端
pm2 stop backend      # 停止后端
pm2 start backend     # 启动后端
pm2 delete backend    # 删除进程
pm2 save              # 保存进程列表
pm2 startup           # 设置开机自启
```

### 重新启动后端

```bash
cd /var/www/你的仓库名/backend

# 删除旧进程
pm2 delete backend

# 启动新进程
pm2 start src/server.js --name backend
pm2 save
```

---

## 代码更新

### 更新流程

```bash
# 1. 进入项目目录
cd /var/www/你的仓库名

# 2. 拉取最新代码
git pull

# 3. 更新后端
cd backend
npm install
pm2 restart backend

# 4. 更新前端
cd ../frontend
npm install
npm run build

# 5. 重启 Nginx
sudo systemctl restart nginx

# 6. 验证
pm2 status
sudo systemctl status nginx
```

---

## 数据备份

### 手动备份

```bash
cd /var/www/你的仓库名/backend

# 停止后端
pm2 stop backend

# 备份数据库
cp data/trading.db data/trading-$(date +%Y%m%d-%H%M%S).db

# 重启后端
pm2 start backend
```

### 自动备份脚本

创建备份脚本：

```bash
sudo nano /usr/local/bin/backup-trading-db.sh
```

添加以下内容：

```bash
#!/bin/bash
PROJECT_DIR="/var/www/你的仓库名"
BACKUP_DIR="/var/backups/trading"
DATE=$(date +%Y%m%d-%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 停止后端
cd $PROJECT_DIR/backend
pm2 stop backend

# 备份数据库
cp data/trading.db $BACKUP_DIR/trading-$DATE.db

# 重启后端
pm2 start backend

# 保留最近7天的备份
find $BACKUP_DIR -name "trading-*.db" -mtime +7 -delete

echo "Backup completed: trading-$DATE.db"
```

设置权限并添加到定时任务：

```bash
# 设置执行权限
sudo chmod +x /usr/local/bin/backup-trading-db.sh

# 添加到 crontab（每天凌晨2点备份）
crontab -e

# 添加这一行
0 2 * * * /usr/local/bin/backup-trading-db.sh >> /var/log/trading-backup.log 2>&1
```

---

## 监控和日志

### 查看日志

```bash
# 后端日志
pm2 logs backend
pm2 logs backend --lines 100

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 系统日志
sudo journalctl -u nginx -f
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

## 性能优化建议

### 1. 启用 Gzip 压缩

编辑 Nginx 配置：

```bash
sudo nano /etc/nginx/nginx.conf
```

确保以下配置已启用：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 配置缓存

在 Nginx 配置中添加：

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 定期清理日志

```bash
# 清理 PM2 日志
pm2 flush

# 清理 Nginx 日志
sudo truncate -s 0 /var/log/nginx/access.log
sudo truncate -s 0 /var/log/nginx/error.log
```

---

## 安全建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **修改 SSH 端口**（可选）
   ```bash
   sudo nano /etc/ssh/sshd_config
   # 修改 Port 22 为其他端口
   sudo systemctl restart sshd
   ```

3. **禁用 root 登录**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # 设置 PermitRootLogin no
   sudo systemctl restart sshd
   ```

4. **定期备份数据**
   - 使用上面的自动备份脚本
   - 定期下载备份到本地

5. **监控服务器资源**
   ```bash
   # 查看 CPU 和内存使用
   htop
   
   # 查看磁盘使用
   df -h
   ```

---

## 故障恢复

### 服务器重启后

```bash
# 检查服务状态
pm2 status
sudo systemctl status nginx

# 如果 PM2 进程没有启动
pm2 resurrect

# 如果还是没有，手动启动
cd /var/www/你的仓库名/backend
pm2 start src/server.js --name backend
pm2 save
```

### 完全重新部署

如果遇到无法解决的问题，可以完全重新部署：

```bash
# 1. 备份数据库
cp /var/www/你的仓库名/backend/data/trading.db ~/trading-backup.db

# 2. 删除项目
rm -rf /var/www/你的仓库名

# 3. 重新克隆代码
cd /var/www
git clone https://github.com/你的用户名/你的仓库名.git

# 4. 恢复数据库
cp ~/trading-backup.db /var/www/你的仓库名/backend/data/trading.db

# 5. 按照部署步骤重新部署
```

---

## 总结

部署完成后，你的网站应该可以通过 `http://你的服务器IP` 访问了！

**记住：**
- 定期备份数据库
- 定期更新代码和系统
- 监控服务器资源使用
- 查询数据库前记得停止后端进程

如果遇到问题，参考上面的故障排查指南，或查看日志文件获取详细错误信息。
