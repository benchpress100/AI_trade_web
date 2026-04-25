# 股票交易模拟盘展示系统

## 功能特性

- 用户注册/登录系统
- 管理员发布交易操作
- 实时持仓状态展示
- 仅登录用户可查看

## 技术栈

### 后端
- Node.js + Express
- SQLite (数据库)
- JWT (身份认证)
- bcrypt (密码加密)

### 前端
- React + TypeScript
- TailwindCSS (样式)
- Axios (HTTP 请求)
- React Router (路由)

## 项目结构

```
├── backend/              # 后端服务
│   ├── src/
│   │   ├── config/      # 配置文件
│   │   ├── controllers/ # 控制器
│   │   ├── middleware/  # 中间件
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由
│   │   └── server.js    # 入口文件
│   ├── package.json
│   └── .env.example
│
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── components/  # 组件
│   │   ├── pages/       # 页面
│   │   ├── services/    # API 服务
│   │   ├── context/     # 状态管理
│   │   └── App.tsx      # 主应用
│   ├── package.json
│   └── tailwind.config.js
│
└── database/            # 数据库脚本
    └── schema.sql       # 数据库结构
```

## 快速开始

### 1. 后端启动
```bash
cd backend
npm install
cp .env.example .env  # 配置环境变量
npm run create-admin  # 创建管理员账户
npm run dev
```

### 2. 前端启动
```bash
cd frontend
npm install
npm start
```

## 环境变量配置

查看 `backend/.env.example` 文件了解需要配置的环境变量。
