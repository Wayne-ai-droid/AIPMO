# AICTO Dashboard Backend

AICTO Dashboard 后端服务，提供项目管理 Dashboard API。

## 功能特性

- ✅ 云效 API 集成（自动同步项目/需求/缺陷数据）
- ✅ Dashboard 数据聚合和统计
- ✅ 项目健康度自动计算
- ✅ 定时数据同步（15分钟/1小时/每天）
- ✅ RESTful API 接口

## 技术栈

- **Node.js** 20 LTS
- **TypeScript**
- **Express.js**
- **Prisma** ORM
- **PostgreSQL** 数据库
- **Redis** 缓存

## 快速开始

### 1. 安装依赖

```bash
cd src/backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和云效Token
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# （可选）插入测试数据
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务将在 http://localhost:3001 启动

### 5. 生产部署

```bash
npm run build
npm start
```

## API 文档

### 基础路径
```
http://localhost:3001/api
```

### 主要接口

#### 项目
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

#### Dashboard
- `GET /api/dashboard/overview` - 获取全局概览
- `GET /api/dashboard/projects/:id` - 获取项目Dashboard数据

#### 需求
- `GET /api/demands?projectId=xxx` - 获取需求列表
- `GET /api/demands/:id` - 获取需求详情

#### 缺陷
- `GET /api/bugs?projectId=xxx` - 获取缺陷列表
- `GET /api/bugs/stats` - 获取缺陷统计

#### 数据同步
- `POST /api/sync/projects` - 同步所有项目数据
- `POST /api/sync/project/:id` - 同步单个项目
- `GET /api/sync/logs` - 获取同步日志

#### 健康检查
- `GET /health` - 服务健康状态

## 数据库模型

### Project（项目）
- id, name, yunxiaoProjectId, feishuChatId
- status, healthScore, config

### Demand（需求）
- id, projectId, yunxiaoId, title
- status, priority, assignee, progress

### Bug（缺陷）
- id, projectId, yunxiaoId, title
- status, severity, priority, assignee

### SyncLog（同步日志）
- id, projectId, source, syncType, status
- recordCount, errorMessage, startedAt, completedAt

## 定时任务

| 任务 | 频率 | 说明 |
|------|------|------|
| 增量同步 | 每15分钟 | 同步项目数据变更 |
| 健康度计算 | 每小时 | 重新计算项目健康度 |
| 全量同步 | 每天凌晨2点 | 全量刷新所有数据 |

## 目录结构

```
src/backend/
├── src/
│   ├── index.ts          # 入口文件
│   ├── routes/           # API路由
│   │   ├── projects.ts
│   │   ├── demands.ts
│   │   ├── bugs.ts
│   │   ├── dashboard.ts
│   │   └── sync.ts
│   ├── services/         # 业务逻辑
│   │   ├── yunxiaoService.ts   # 云效API
│   │   ├── cronService.ts      # 定时任务
│   │   └── healthService.ts    # 健康度计算
│   ├── middleware/       # 中间件
│   │   └── errorHandler.ts
│   └── utils/            # 工具函数
│       └── logger.ts
├── prisma/
│   └── schema.prisma     # 数据库模型
├── .env.example          # 环境变量示例
└── package.json
```

## 云效API集成

系统通过云效 OpenAPI 获取项目数据：

1. **项目列表** - 获取所有可访问的项目
2. **需求数据** - 同步需求状态和进度
3. **缺陷数据** - 同步缺陷状态和严重程度
4. **迭代数据** - 获取迭代信息（可选）

云效 Token 通过环境变量 `YUNXIAO_TOKEN` 配置。

## 开发指南

### 添加新的API路由

```typescript
// src/routes/example.ts
import { Router } from 'express';
const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // 业务逻辑
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

export default router;
```

然后在 `index.ts` 中注册：
```typescript
import exampleRoutes from './routes/example';
app.use('/api/example', exampleRoutes);
```

### 数据库变更

修改 `prisma/schema.prisma` 后：

```bash
npx prisma migrate dev --name 变更描述
npx prisma generate
```

## 许可证

MIT
