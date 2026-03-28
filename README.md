# 飞书审批助手 - 代码说明

## 项目结构

```
feishu-approval-agent/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI入口
│   ├── config.py            # 配置管理
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── webhook.py       # Webhook接收
│   │   └── internal.py      # 内部API
│   ├── services/
│   │   ├── __init__.py
│   │   ├── feishu_api.py    # 飞书API封装
│   │   └── analyzer.py      # AI分析
│   └── utils/
│       ├── __init__.py
│       └── signature.py     # 签名验证
├── logs/                    # 日志目录
├── .env                     # 环境变量
├── .env.example             # 环境变量示例
├── requirements.txt         # Python依赖
├── deploy.sh                # 部署脚本
└── manage.sh                # 管理脚本
```

## 文件内容

### 1. app/main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="飞书审批助手", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])

@app.get("/")
async def root():
    return {"message": "飞书审批助手服务运行中", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2. app/config.py
```python
import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    FEISHU_APP_ID = os.getenv("FEISHU_APP_ID", "cli_a9086bb17b785cef")
    FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET", "")
    FEISHU_WEBHOOK_SECRET = os.getenv("FEISHU_WEBHOOK_SECRET", "")
    MY_USER_ID = os.getenv("MY_USER_ID", "ou_a795353f084e446e25c7074e04482728")
    BITABLE_APP_TOKEN = os.getenv("BITABLE_APP_TOKEN", "E110bkV0PaGqCLsMPQfc5ElPnEf")
    BITABLE_TABLE_ID = os.getenv("BITABLE_TABLE_ID", "tblzRgolt6NuKcxo")
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "0.0.0.0")
    INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "change-this-key")

settings = Settings()
```

### 3. requirements.txt
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
requests==2.31.0
python-dotenv==1.0.0
httpx==0.26.0
gunicorn==21.2.0
```

### 4. .env
```bash
FEISHU_APP_ID=cli_a9086bb17b785cef
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_WEBHOOK_SECRET=your_webhook_secret_here
MY_USER_ID=ou_a795353f084e446e25c7074e04482728
BITABLE_APP_TOKEN=E110bkV0PaGqCLsMPQfc5ElPnEf
BITABLE_TABLE_ID=tblzRgolt6NuKcxo
INTERNAL_API_KEY=your-secret-key
PORT=8000
HOST=0.0.0.0
```

### 5. deploy.sh
```bash
#!/bin/bash
set -e
echo "=== 部署飞书审批助手 ==="

apt update && apt install -y python3 python3-pip python3-venv
mkdir -p /opt/feishu-approval-agent
cp -r . /opt/feishu-approval-agent/
cd /opt/feishu-approval-agent

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cat > /etc/systemd/system/feishu-approval-agent.service << 'SVCF'
[Unit]
Description=Feishu Approval Agent
After=network.target
[Service]
Type=simple
User=root
WorkingDirectory=/opt/feishu-approval-agent
Environment="PATH=/opt/feishu-approval-agent/venv/bin"
ExecStart=/opt/feishu-approval-agent/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
[Install]
WantedBy=multi-user.target
SVCF

systemctl daemon-reload
systemctl enable feishu-approval-agent
echo "=== 部署完成 ==="
```

## 快速开始

1. **创建项目目录**
   ```bash
   mkdir -p feishu-approval-agent/app/routers feishu-approval-agent/app/services feishu-approval-agent/app/utils
   cd feishu-approval-agent
   ```

2. **创建上述文件**

3. **部署**
   ```bash
   ./deploy.sh
   ```

4. **配置密钥**
   ```bash
   nano /opt/feishu-approval-agent/.env
   # 填入 FEISHU_APP_SECRET 和 FEISHU_WEBHOOK_SECRET
   ```

5. **启动**
   ```bash
   systemctl start feishu-approval-agent
   curl http://47.77.187.185:8000/health
   ```

## 下一步开发

基础框架部署后，还需要实现：
1. `webhook.py` - 接收飞书审批事件
2. `feishu_api.py` - 调用飞书API
3. 与Jarvis-PM的集成接口

需要我提供这些完整代码吗？