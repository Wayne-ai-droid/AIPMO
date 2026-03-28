#!/bin/bash
# 飞书审批助手前端部署脚本

echo "=== 部署飞书审批助手前端 ==="

# 配置
PROJECT_DIR="/root/feishu-approval-agent"
FRONTEND_DIR="$PROJECT_DIR/frontend"
NGINX_CONF="/etc/nginx/conf.d/feishu-approval.conf"

# 检查Nginx
if ! command -v nginx &> /dev/null; then
    echo "安装Nginx..."
    yum install -y nginx
fi

# 生成前端配置文件
echo "生成前端配置文件..."
cd $PROJECT_DIR
python3 generate_config.py

# 复制前端文件到Nginx目录
echo "部署前端文件..."
mkdir -p /usr/share/nginx/html/feishu-approval
cp -r $FRONTEND_DIR/* /usr/share/nginx/html/feishu-approval/

# 创建Nginx配置
echo "配置Nginx..."
cat > $NGINX_CONF <> 'EOF'
server {
    listen 80;
    server_name 47.77.187.185;
    
    # 前端页面
    location / {
        root /usr/share/nginx/html/feishu-approval;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Webhook代理
    location /webhook/ {
        proxy_pass http://127.0.0.1:8000/webhook/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# 测试Nginx配置
nginx -t

# 启动Nginx
systemctl restart nginx
systemctl enable nginx

echo ""
echo "=== 前端部署完成 ==="
echo ""
echo "访问地址:"
echo "  前端页面: http://47.77.187.185/"
echo "  API接口: http://47.77.187.185/api/"
echo "  健康检查: http://47.77.187.185/api/health"
echo ""
echo "注意: 请确保后端服务已启动 (port 8000)"
echo "  systemctl start feishu-approval-agent"
echo ""