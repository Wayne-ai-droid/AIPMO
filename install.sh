#!/bin/bash
# 飞书审批助手 - 一键部署脚本
# 服务器: 47.77.187.185:8000

set -e

echo "=========================================="
echo "  飞书审批助手 - 一键部署"
echo "  服务器: 47.77.187.185:8000"
echo "=========================================="

# 检查root权限
if [ "$EUID" -ne 0 ]; then 
   echo "错误: 请使用root权限运行"
   exit 1
fi

PROJECT_DIR="/opt/feishu-approval-agent"

echo "[1/5] 安装依赖..."
apt-get update
apt-get install -y python3 python3-pip python3-venv curl

echo "[2/5] 创建项目目录..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 如果已有代码，跳过下载
if [ ! -f "app/main.py" ]; then
    echo "[3/5] 请手动上传代码文件到 $PROJECT_DIR"
    echo "需要上传的文件:"
    echo "  - app/main.py"
    echo "  - app/config.py"
    echo "  - app/routers/webhook.py"
    echo "  - requirements.txt"
    exit 1
fi

echo "[4/5] 创建虚拟环境..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[5/5] 创建systemd服务..."
cat > /etc/systemd/system/feishu-approval-agent.service << 'EOF'
[Unit]
Description=Feishu Approval Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/feishu-approval-agent
Environment="PATH=/opt/feishu-approval-agent/venv/bin"
EnvironmentFile=/opt/feishu-approval-agent/.env
ExecStart=/opt/feishu-approval-agent/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable feishu-approval-agent

echo ""
echo "=========================================="
echo "部署完成!"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 创建 .env 文件:"
echo "   nano /opt/feishu-approval-agent/.env"
echo ""
echo "2. 填入以下内容:"
echo "   FEISHU_APP_ID=cli_a9086bb17b785cef"
echo "   FEISHU_APP_SECRET=your_secret"
echo "   FEISHU_WEBHOOK_SECRET=your_webhook_secret"
echo "   MY_USER_ID=ou_a795353f084e446e25c7074e04482728"
echo "   INTERNAL_API_KEY=your_random_key"
echo ""
echo "3. 启动服务:"
echo "   systemctl start feishu-approval-agent"
echo ""
echo "4. 验证:"
echo "   curl http://47.77.187.185:8000/health"
echo ""
echo "5. 配置飞书Webhook:"
echo "   URL: http://47.77.187.185:8000/webhook/feishu/approval"
echo ""