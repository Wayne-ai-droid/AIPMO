# AICTO Dashboard 本地运行指南

## 📋 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- **PostgreSQL** >= 14（可选，可使用SQLite快速体验）

## 🚀 快速开始

### 1. 克隆代码

```bash
git clone https://github.com/Wayne-ai-droid/AIPMO.git
cd AIPMO/aicto
```

### 2. 启动后端服务

```bash
# 进入后端目录
cd src/backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改以下配置：
# - DATABASE_URL: 数据库连接（可选，默认使用SQLite）
# - YUNXIAO_TOKEN: 你的云效Token（当前使用模拟数据，可不填）

# 初始化数据库
npx prisma generate
npx prisma migrate dev --name init

# 插入测试数据（可选）
npx prisma db seed

# 启动开发服务器
npm run dev
```

后端服务启动后，访问 http://localhost:3001/health 查看状态

### 3. 启动前端服务

```bash
# 新开一个终端，进入前端目录
cd src/frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务启动后，访问 http://localhost:5173

### 4. 查看效果

打开浏览器访问：http://localhost:5173

---

## 🔧 详细配置

### 后端配置 (.env)

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置（二选一）
# 方案1: PostgreSQL（生产环境）
DATABASE_URL="postgresql://user:password@localhost:5432/aicto?schema=public"

# 方案2: SQLite（快速体验，无需安装PostgreSQL）
DATABASE_URL="file:./dev.db"

# 云效API配置（当前使用模拟数据，可不填）
YUNXIAO_TOKEN=your-yunxiao-token
YUNXIAO_BASE_URL=https://devops.aliyun.com/api

# 日志级别
LOG_LEVEL=info
```

### 前端配置

前端无需额外配置，默认连接 localhost:3001

如需修改API地址，编辑 `src/frontend/src/api/dashboard.ts`：
```typescript
const API_BASE_URL = 'http://localhost:3001/api';
```

---

## 📁 项目结构

```
aicto/
├── src/
│   ├── backend/              # 后端代码
│   │   ├── src/
│   │   │   ├── index.ts      # 入口
│   │   │   ├── routes/       # API路由
│   │   │   ├── services/     # 业务逻辑
│   │   │   └── ...
│   │   ├── prisma/
│   │   │   └── schema.prisma # 数据库模型
│   │   └── package.json
│   │
│   └── frontend/             # 前端代码
│       ├── src/
│       │   ├── App.tsx       # 应用入口
│       │   ├── pages/        # 页面组件
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Projects.tsx
│       │   │   ├── ProjectDetail.tsx
│       │   │   └── Settings.tsx
│       │   └── api/          # API封装
│       └── package.json
│
└── docs/                     # 文档
```

---

## 🎯 功能预览

启动后，你可以查看以下功能：

### 1. Dashboard首页 (http://localhost:5173/)
- 统计卡片：项目数、需求数、缺陷数、风险项目
- 项目健康度列表（5个模拟项目）
- 风险预警面板

### 2. 项目列表 (http://localhost:5173/projects)
- 所有项目表格展示
- 健康度、状态、负责人等信息

### 3. 项目详情 (http://localhost:5173/projects/1)
- 项目概览标签页
- 需求列表标签页
- 缺陷列表标签页
- 项目配置标签页

### 4. 配置中心 (http://localhost:5173/settings)
- 项目配置：绑定云效/飞书、同步设置
- 监控指标：启用/禁用、阈值设置
- 通知设置：飞书通知开关

---

## 🐛 常见问题

### 问题1: npm install 失败
```bash
# 尝试清除缓存后重试
npm cache clean --force
npm install
```

### 问题2: 端口被占用
```bash
# 后端默认端口3001，前端默认端口5173
# 修改后端端口：编辑 .env 文件
PORT=3002

# 修改前端端口：启动时指定
npm run dev -- --port 5174
```

### 问题3: 数据库连接失败
```bash
# 如果使用PostgreSQL，确保服务已启动
# 或使用SQLite（无需安装）
# 编辑 .env：
DATABASE_URL="file:./dev.db"
```

### 问题4: 前端无法连接后端
```bash
# 检查后端是否启动
 curl http://localhost:3001/health

# 检查前端API地址配置
# 编辑 src/frontend/src/api/dashboard.ts
```

---

## 🔄 使用模拟数据

当前系统使用**模拟数据**展示功能，数据文件位置：

- **Dashboard**: `src/frontend/src/pages/Dashboard.tsx` 中的 `mockData`
- **项目详情**: `src/frontend/src/pages/ProjectDetail.tsx` 中的 `mockProjectDetail`

如需修改模拟数据，直接编辑对应文件即可。

---

## ☁️ 接入真实云效数据

当云效API问题解决后，只需：

1. **更新Token**: 在 `.env` 文件中填写有效的 `YUNXIAO_TOKEN`

2. **启动数据同步**:
```bash
# 手动同步所有项目
curl -X POST http://localhost:3001/api/sync/projects

# 或等待定时任务自动同步（每15分钟）
```

3. **前端自动显示真实数据**: 无需修改前端代码

---

## 📞 技术支持

遇到问题可以：
1. 查看日志：`backend/logs/combined.log`
2. 在GitHub Issue #2 中提问
3. 联系开发团队

---

## 🎉 开始使用

按照上述步骤操作，5分钟后即可在浏览器中查看完整的AICTO Dashboard效果！
