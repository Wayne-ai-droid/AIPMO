#!/bin/bash
# 飞书审批助手 - CentOS/RHEL 专用安装脚本
# 服务器: 47.77.187.185:8000

set -e

echo "=========================================="
echo "  飞书审批助手 - CentOS安装脚本"
echo "  服务器: 47.77.187.185:8000"
echo "=========================================="

# 检查root权限
if [ "$EUID" -ne 0 ]; then 
   echo "错误: 请使用root权限运行"
   exit 1
fi

PROJECT_DIR="/opt/feishu-approval-agent"

echo "[1/5] 安装系统依赖..."
yum update -y
yum install -y python3 python3-pip curl

# 安装virtualenv（CentOS上python3-venv包名不同）
if ! python3 -m virtualenv --help > /dev/null 2>&1; then
    echo "  安装virtualenv..."
    pip3 install virtualenv
fi

echo "[2/5] 创建项目目录..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 检查是否有代码文件
if [ ! -f "app/main.py" ]; then
    echo "错误: 未找到代码文件"
    echo "请先上传 feishu-approval-agent.tar.gz 并解压"
    exit 1
fi

echo "[3/5] 创建虚拟环境..."
python3 -m virtualenv venv
source venv/bin/activate

echo "[4/5] 安装Python依赖..."
pip install --upgrade pip
pip install fastapi uvicorn requests python-dotenv httpx

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
echo "  安装完成!"
echo "=========================================="
echo ""
echo "下一步操作:"
echo ""
echo "1. 创建环境变量文件:"
echo "   cat > /opt/feishu-approval-agent/.env << 'ENVFILE'"
echo "   FEISHU_APP_ID=cli_a9086bb17b785cef"
echo "   FEISHU_APP_SECRET=your_app_secret_here"
echo "   FEISHU_WEBHOOK_SECRET=your_webhook_secret_here"
echo "   MY_USER_ID=ou_a795353f084e446e25c7074e04482728"
echo "   BITABLE_APP_TOKEN=E110bkV0PaGqCLsMPQfc5ElPnEf"
echo "   BITABLE_TABLE_ID=tblzRgolt6NuKcxo"
echo "   INTERNAL_API_KEY=your_random_key"
echo "   ENVFILE"
echo ""
echo "2. 启动服务:"
echo "   systemctl start feishu-approval-agent"
echo ""
echo "3. 查看状态:"
echo "   systemctl status feishu-approval-agent"
echo ""
echo "4. 验证部署:"
echo "   curl http://47.77.187.185:8000/health"
echo ""
echo "5. 查看日志:"
echo "   journalctl -u feishu-approval-agent -f"
echo ""
echo "6. 配置飞书Webhook:"
echo "   URL: http://47.77.187.185:8000/webhook/feishu/approval"
echo ""
echo "=========================================="