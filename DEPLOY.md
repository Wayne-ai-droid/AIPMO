# 飞书审批助手 - 部署指南

## 项目结构

```
feishu-approval-agent/
├── app/                      # 后端代码
│   ├── main.py              # FastAPI入口
│   ├── config.py            # 配置
│   └── routers/             # API路由
│       ├── __init__.py
│       ├── webhook.py       # Webhook接收
│       └── approvals.py     # 审批数据API
├── frontend/                 # 前端代码
│   ├── index.html           # 审批列表页面
│   └── config.json          # 前端配置文件（由脚本生成）
├── logs/                     # 日志目录
├── requirements.txt          # Python依赖
├── .env                      # 环境变量（需手动创建）
├── .env.example              # 环境变量模板
├── generate_config.py        # 生成前端配置脚本
├── install.sh               # 后端安装脚本
└── deploy-frontend.sh       # 前端部署脚本
```

## 配置说明

所有配置集中管理在 `.env` 文件中，**无需修改代码**！

### 配置项说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `FEISHU_APP_ID` | 飞书应用ID | cli_a9086bb17b785cef |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | your_secret |
| `FEISHU_WEBHOOK_SECRET` | Webhook加密密钥 | your_secret |
| `MY_USER_ID` | 当前用户OpenID | ou_xxx |
| `INTERNAL_API_KEY` | 内部API密钥 | random_key |
| `PORT` | 后端服务端口 | 8000 |
| `HOST` | 后端服务绑定地址 | 0.0.0.0 |
| **FRONTEND_API_BASE_URL** | **前端调用的API地址** | http://your-server:8000 |
| **FRONTEND_USER_ID** | **前端默认用户ID** | ou_xxx |
| **FRONTEND_DAYS** | **前端默认查询天数** | 7 |

## 快速部署

### 1. 创建配置文件

```bash
cd /root/feishu-approval-agent

# 复制模板
cp .env.example .env

# 编辑配置（修改为您的实际值）
nano .env
```

**.env 文件示例**：
```bash
# 飞书配置
FEISHU_APP_ID=cli_a9086bb17b785cef
FEISHU_APP_SECRET=your_secret_here
FEISHU_WEBHOOK_SECRET=your_secret_here
MY_USER_ID=ou_a795353f084e446e25c7074e04482728
BITABLE_APP_TOKEN=E110bkV0PaGqCLsMPQfc5ElPnEf
BITABLE_TABLE_ID=tblzRgolt6NuKcxo
INTERNAL_API_KEY=your_random_key

# 后端服务配置
PORT=8000
HOST=0.0.0.0

# 前端配置（重要！修改为您的实际地址）
FRONTEND_API_BASE_URL=http://47.77.187.185:8000
FRONTEND_USER_ID=ou_a795353f084e446e25c7074e04482728
FRONTEND_DAYS=7
```

### 2. 部署后端服务

```bash
cd /root/feishu-approval-agent

# 安装依赖
pip3 install fastapi uvicorn requests python-dotenv httpx

# 启动后端服务
python3 app/main.py

# 或使用systemd（推荐）
systemctl start feishu-approval-agent
```

### 3. 部署前端页面

```bash
cd /root/feishu-approval-agent
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

部署脚本会自动：
1. 读取 `.env` 配置
2. 生成 `frontend/config.json`
3. 安装/配置 Nginx
4. 部署前端文件

## 访问方式

部署完成后：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端页面 | http://47.77.187.185/ | 审批列表展示 |
| 后端API | http://47.77.187.185:8000/api/ | API接口 |
| 健康检查 | http://47.77.187.185/api/health | 服务状态 |

## 修改配置

**无需重新部署代码，只需修改 `.env` 文件！**

```bash
# 1. 修改配置
nano /root/feishu-approval-agent/.env

# 2. 重新生成前端配置
cd /root/feishu-approval-agent
python3 generate_config.py

# 3. 复制新的配置到Nginx目录
cp frontend/config.json /usr/share/nginx/html/feishu-approval/

# 4. 重启Nginx
systemctl restart nginx
```

## 功能说明

### 前端功能
- 📊 **统计面板**: 展示全部/待处理/我发起的/我办理的审批数量
- 📋 **审批列表**: 最近7天的审批记录
- 🔍 **分类筛选**: 全部/我发起的/我办理的三个标签页
- 🤖 **AI分析**: 对待处理审批进行智能分析

### 后端API

#### 获取审批列表
```http
GET /api/approvals?days=7&user_id=xxx
```

响应：
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "instance_code": "APP001",
      "title": "结汇申请",
      "status": "PENDING",
      "initiator_name": "张三",
      "create_time": "2026-03-27T14:30:00"
    }
  ]
}
```

#### 获取审批详情
```http
GET /api/approvals/{instance_code}
```

#### AI分析
```http
POST /api/approvals/{instance_code}/analyze
```

## 配置文件流程

```
.env (环境变量)
    ↓
generate_config.py (读取并生成)
    ↓
frontend/config.json (前端读取)
    ↓
index.html (动态加载配置)
```

## 后续开发计划

1. **连接飞书API**: 从真实数据源获取审批数据
2. **AI分析集成**: 对接Jarvis-PM进行智能分析
3. **消息通知**: 新审批到达时飞书通知
4. **移动端适配**: 优化手机端显示

## 注意事项

1. **服务器地址配置**: 在 `.env` 文件中修改 `FRONTEND_API_BASE_URL`
2. 目前前端使用的是模拟数据，需要后续对接飞书API
3. 后端服务需要保持运行（建议使用systemd管理）
4. 前端通过Nginx代理访问后端API，解决跨域问题

## 问题排查

### 前端无法访问
```bash
# 检查Nginx状态
systemctl status nginx

# 检查防火墙
firewall-cmd --list-ports
firewall-cmd --add-port=80/tcp --permanent
firewall-cmd --reload
```

### 后端API无法访问
```bash
# 检查后端服务
ps aux | grep uvicorn

# 检查端口
curl http://127.0.0.1:8000/health
```

### 配置不生效
```bash
# 检查配置文件是否正确生成
cat /usr/share/nginx/html/feishu-approval/config.json

# 重新生成配置
cd /root/feishu-approval-agent
python3 generate_config.py
cp frontend/config.json /usr/share/nginx/html/feishu-approval/
```

### 跨域问题
确保Nginx配置中正确代理了/api/路径到后端服务。