# 本地测试快速指南

## 🏠 本地测试模式（无需公网IP）

### 1. 准备环境

```bash
cd /root/feishu-approval-agent

# 创建本地测试配置
cat > .env << 'EOF'
# 飞书配置
FEISHU_APP_ID=cli_a9086bb17b785cef
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_WEBHOOK_SECRET=your_webhook_secret_here
MY_USER_ID=ou_a795353f084e446e25c7074e04482728
BITABLE_APP_TOKEN=E110bkV0PaGqCLsMPQfc5ElPnEf
BITABLE_TABLE_ID=tblzRgolt6NuKcxo
INTERNAL_API_KEY=change-this-secret-key

# 后端服务配置（仅本地访问）
PORT=8000
HOST=127.0.0.1

# 前端配置（本地测试）
FRONTEND_API_BASE_URL=http://127.0.0.1:8000
FRONTEND_USER_ID=ou_a795353f084e446e25c7074e04482728
FRONTEND_DAYS=7
EOF

# 安装依赖
pip3 install fastapi uvicorn requests python-dotenv httpx
```

### 2. 启动后端服务

```bash
# 终端 1：启动后端
python3 app/main.py

# 看到类似输出表示成功：
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 3. 启动前端

```bash
# 终端 2：生成前端配置
python3 generate_config.py

# 终端 2：启动前端服务（使用Python临时HTTP服务器）
cd frontend
python3 -m http.server 8080

# 看到类似输出表示成功：
# Serving HTTP on 0.0.0.0 port 8080
```

### 4. 访问测试

在服务器上打开浏览器，访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端页面 | http://127.0.0.1:8080 | 审批列表展示 |
| 后端API | http://127.0.0.1:8000 | API接口文档 |
| API测试 | http://127.0.0.1:8000/api/approvals?days=7&user_id=xxx | 审批数据 |

---

## 🌐 切换到公网部署

如果后续需要外网访问，修改 `.env`：

```bash
# 修改这两行
HOST=0.0.0.0
FRONTEND_API_BASE_URL=http://47.77.187.185:8000
```

然后运行部署脚本：
```bash
./deploy-frontend.sh
```

---

## ⚠️ 本地测试限制

本地测试模式下：
- ✅ 可以测试前端界面
- ✅ 可以测试后端API
- ✅ 可以测试AI分析功能
- ❌ **无法接收飞书Webhook**（需要公网IP）
- ❌ **无法从外部网络访问**

如果需要测试Webhook功能，需要使用公网IP或内网穿透工具（如ngrok）。