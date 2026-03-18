# AICTO Dashboard 技术架构设计

**版本**: v1.0  
**日期**: 2026-03-19  
**设计**: Arch Agent  
**关联Issue**: #2 (AICTO Dashboard系统 - 云效集成版)

---

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        AICTO Dashboard                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 监控视图    │  │ 配置中心    │  │ 分析洞察    │             │
│  │ (React)     │  │ (React)     │  │ (React)     │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │  REST API   │  (Node.js/Express)           │
│                    │   Gateway   │                              │
│                    └──────┬──────┘                              │
├───────────────────────────┼─────────────────────────────────────┤
│                           │         服务层                      │
│  ┌──────────┐ ┌──────────┼──┐ ┌──────────┐ ┌──────────┐       │
│  │ 项目服务 │ │ 数据同步 │  │ │ 分析服务 │ │ 通知服务 │       │
│  │          │ │ 服务     │  │ │          │ │          │       │
│  └──────────┘ └──────────┘  │ └──────────┘ └──────────┘       │
│                             │                                   │
│  ┌──────────┐ ┌────────────┼┐ ┌──────────┐                    │
│  │ 配置服务 │ │  定时任务  ││ │ 用户服务 │                    │
│  │          │ │  调度器    ││ │          │                    │
│  └──────────┘ └────────────┘│ └──────────┘                    │
│                             │                                   │
├─────────────────────────────┼───────────────────────────────────┤
│                             │        数据集成层                 │
│  ┌────────────┐  ┌──────────┼──┐  ┌────────────┐                │
│  │ 云效API    │  │ 飞书API  │  │  │ GitHubAPI  │                │
│  │ 适配器     │  │ 适配器   │  │  │ 适配器     │                │
│  └────────────┘  └──────────┘  │  └────────────┘                │
│                                │                                │
├────────────────────────────────┼────────────────────────────────┤
│                                │        数据存储层              │
│  ┌──────────────┐  ┌───────────┴──┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │    Redis     │  │ Elasticsearch│          │
│  │ (业务数据)   │  │    (缓存)    │  │  (日志/搜索) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 模块说明

| 模块 | 技术栈 | 职责 |
|------|--------|------|
| **前端** | React 18 + Ant Design 5 | Dashboard UI、配置界面 |
| **API网关** | Node.js + Express | 路由、认证、限流 |
| **服务层** | Node.js + TypeScript | 业务逻辑处理 |
| **数据集成** | 适配器模式 | 对接云效、飞书、GitHub API |
| **存储层** | PostgreSQL + Redis | 持久化 + 缓存 |
| **任务调度** | node-cron + Bull | 定时同步任务 |

---

## 2. 数据库设计

### 2.1 ER图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Project    │───────│   Demand     │       │    Bug       │
│   (项目)     │1     N│   (需求)     │       │   (缺陷)     │
└──────────────┘       └──────────────┘       └──────────────┘
        │                      │                      │
        │              ┌────────┴────────┐            │
        │              │                 │            │
┌───────┴──────┐      N│                 │N          N│
│  FeishuGroup │───────┘                 └────────────┘
│  (飞书群)    │
└──────────────┘
        │
        │N
┌───────┴──────┐
│    Metric    │
│   (监控指标) │
└──────────────┘
        │
        │N
┌───────┴──────┐
│ AlertRule    │
│  (预警规则)  │
└──────────────┘
```

### 2.2 表结构

#### projects (项目表)
```sql
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,              -- 项目名称
    yunxiao_project_id VARCHAR(50),          -- 云效项目ID
    feishu_chat_id VARCHAR(100),             -- 飞书群ID
    github_repo VARCHAR(200),                -- GitHub仓库
    status VARCHAR(20) DEFAULT 'active',     -- 状态: active/inactive
    health_score INTEGER DEFAULT 100,        -- 健康度评分
    config JSONB DEFAULT '{}',               -- 项目配置(JSON)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### demands (需求表)
```sql
CREATE TABLE demands (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    yunxiao_id VARCHAR(50),                  -- 云效需求ID
    title VARCHAR(500),                      -- 需求标题
    status VARCHAR(20),                      -- 状态: todo/doing/done
    priority VARCHAR(10),                    -- 优先级: P0/P1/P2/P3
    assignee VARCHAR(100),                   -- 负责人
    planned_start DATE,                      -- 计划开始
    planned_end DATE,                        -- 计划结束
    actual_start DATE,                       -- 实际开始
    actual_end DATE,                         -- 实际结束
    story_points INTEGER,                    -- 故事点
    progress INTEGER DEFAULT 0,              -- 进度百分比
    raw_data JSONB,                          -- 原始数据
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### bugs (缺陷表)
```sql
CREATE TABLE bugs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    yunxiao_id VARCHAR(50),                  -- 云效缺陷ID
    title VARCHAR(500),                      -- 缺陷标题
    status VARCHAR(20),                      -- 状态: new/fixing/fixed/closed
    severity VARCHAR(20),                    -- 严重程度: fatal/serious/normal/tip
    priority VARCHAR(10),                    -- 优先级
    reporter VARCHAR(100),                   -- 报告人
    assignee VARCHAR(100),                   -- 处理人
    found_version VARCHAR(50),               -- 发现版本
    fixed_version VARCHAR(50),               -- 修复版本
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,                   -- 解决时间
    raw_data JSONB
);
```

#### metrics (监控指标表)
```sql
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(100) NOT NULL,              -- 指标名称
    type VARCHAR(20),                        -- 类型: system/custom
    formula TEXT,                            -- 计算公式
    unit VARCHAR(20),                        -- 单位
    thresholds JSONB,                        -- 阈值配置: {"green": 80, "yellow": 60, "red": 0}
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### alert_rules (预警规则表)
```sql
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(100),                       -- 规则名称
    condition JSONB NOT NULL,                -- 触发条件
    notify_channels JSONB,                   -- 通知渠道: ["feishu", "email"]
    notify_targets JSONB,                    -- 通知对象
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 示例condition:
-- {"metric": "progress", "operator": "<", "value": 60, "duration": "3d"}
```

#### sync_logs (同步日志表)
```sql
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    source VARCHAR(20),                      -- 来源: yunxiao/feishu/github
    sync_type VARCHAR(20),                   -- 类型: full/incremental
    status VARCHAR(20),                      -- 状态: success/failed
    record_count INTEGER,                    -- 同步记录数
    error_message TEXT,                      -- 错误信息
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

---

## 3. API设计

### 3.1 项目相关

```
GET    /api/projects              # 获取项目列表
POST   /api/projects              # 创建项目
GET    /api/projects/:id          # 获取项目详情
PUT    /api/projects/:id          # 更新项目
DELETE /api/projects/:id          # 删除项目
GET    /api/projects/:id/dashboard # 获取项目Dashboard数据
```

### 3.2 需求相关

```
GET /api/projects/:id/demands     # 获取项目需求列表
GET /api/demands/:id              # 获取需求详情
```

### 3.3 缺陷相关

```
GET /api/projects/:id/bugs        # 获取项目缺陷列表
GET /api/bugs/:id                 # 获取缺陷详情
GET /api/projects/:id/bug-stats   # 获取缺陷统计
```

### 3.4 监控相关

```
GET  /api/projects/:id/metrics    # 获取监控指标
POST /api/projects/:id/metrics    # 创建自定义指标
PUT  /api/metrics/:id             # 更新指标
```

### 3.5 配置相关

```
GET    /api/projects/:id/config   # 获取项目配置
PUT    /api/projects/:id/config   # 更新项目配置
GET    /api/alert-rules           # 获取预警规则列表
POST   /api/alert-rules           # 创建预警规则
PUT    /api/alert-rules/:id       # 更新预警规则
DELETE /api/alert-rules/:id       # 删除预警规则
```

### 3.6 同步相关

```
POST /api/projects/:id/sync       # 手动触发同步
GET  /api/sync-logs               # 获取同步日志
```

---

## 4. 数据同步设计

### 4.1 同步策略

| 数据类型 | 同步方式 | 频率 | 说明 |
|---------|---------|------|------|
| 项目基础信息 | 定时全量 | 每1小时 | 项目列表变化较少 |
| 需求数据 | Webhook+定时 | 实时+每15分钟 | 需求状态变化频繁 |
| 缺陷数据 | Webhook+定时 | 实时+每15分钟 | 缺陷状态实时性要求高 |
| 飞书群信息 | 定时全量 | 每2小时 | 群成员变化较少 |

### 4.2 Webhook处理流程

```
云效Webhook → API Gateway → 消息队列(Redis) → 处理器 → 数据库更新 → 通知服务
```

### 4.3 增量同步逻辑

```javascript
// 伪代码
async function syncDemands(projectId, lastSyncTime) {
  // 1. 获取云效中更新时间 > lastSyncTime 的需求
  const yunxiaoDemands = await yunxiaoAPI.getDemands({
    projectId,
    updatedAfter: lastSyncTime
  });
  
  // 2. 批量更新数据库
  for (const demand of yunxiaoDemands) {
    await db.demands.upsert({
      yunxiao_id: demand.id,
      ...demand
    });
  }
  
  // 3. 记录同步日志
  await db.syncLogs.create({
    projectId,
    source: 'yunxiao',
    syncType: 'incremental',
    recordCount: yunxiaoDemands.length
  });
}
```

---

## 5. 技术选型

### 5.1 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design 5
- **状态管理**: Zustand
- **图表**: ECharts / AntV G2Plot
- **构建**: Vite

### 5.2 后端
- **运行时**: Node.js 20 LTS
- **框架**: Express 4
- **语言**: TypeScript
- **ORM**: Prisma
- **验证**: Zod

### 5.3 数据库
- **主数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **搜索**: Elasticsearch (可选)

### 5.4 部署
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana

---

## 6. 风险评估

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|---------|
| 云效API限流 | 高 | 中 | 实现重试机制和降级策略 |
| 飞书群权限不足 | 中 | 中 | 提前申请必要的API权限 |
| 数据同步延迟 | 中 | 低 | Webhook+定时双保险 |
| 性能瓶颈 | 中 | 低 | 数据库索引优化+Redis缓存 |

---

## 7. 开发计划

### 阶段1: 基础架构 (Day 1-3)
- [ ] 数据库设计和初始化
- [ ] 项目脚手架搭建
- [ ] 基础API框架
- [ ] 云效API接入

### 阶段2: 核心功能 (Day 4-10)
- [ ] 项目列表和详情页
- [ ] 需求/缺陷数据展示
- [ ] 数据同步服务
- [ ] 基础Dashboard

### 阶段3: 配置中心 (Day 11-14)
- [ ] 项目绑定配置
- [ ] 自定义指标配置
- [ ] 预警规则配置
- [ ] 飞书通知集成

### 阶段4: 分析与优化 (Day 15-18)
- [ ] 团队效率分析
- [ ] 性能优化
- [ ] 测试和Bug修复

### 阶段5: 上线 (Day 19-20)
- [ ] 生产环境部署
- [ ] 监控配置
- [ ] 文档完善

---

**架构设计完成！等待Dev Agent开始开发。**

**提交**: Arch Agent  
**分支**: feature/aicto-arch  
**关联Issue**: #2
