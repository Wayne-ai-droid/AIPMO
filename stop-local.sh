#!/bin/bash
# 飞书审批助手 - 停止服务脚本

echo "=== 飞书审批助手 - 停止服务 ==="
echo ""

# 读取配置中的端口
PORT=8000
if [ -f ".env" ]; then
    PORT=$(grep -E '^PORT=' .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    PORT=${PORT:-8000}
fi

echo "🛑 正在停止服务..."

# 停止后端（8000端口）
BACKEND_PIDS=$(lsof -t -i:$PORT 2>/dev/null)
if [ -n "$BACKEND_PIDS" ]; then
    echo "   停止后端服务 (端口 $PORT)..."
    kill $BACKEND_PIDS 2>/dev/null
    sleep 1
    # 强制关闭
    kill -9 $(lsof -t -i:$PORT 2>/dev/null) 2>/dev/null
    echo "   ✅ 后端已停止"
else
    echo "   ℹ️  后端服务未运行"
fi

# 停止前端（8080端口）
FRONTEND_PIDS=$(lsof -t -i:8080 2>/dev/null)
if [ -n "$FRONTEND_PIDS" ]; then
    echo "   停止前端服务 (端口 8080)..."
    kill $FRONTEND_PIDS 2>/dev/null
    sleep 1
    # 强制关闭
    kill -9 $(lsof -t -i:8080 2>/dev/null) 2>/dev/null
    echo "   ✅ 前端已停止"
else
    echo "   ℹ️  前端服务未运行"
fi

echo ""
echo "=== 服务已停止 ==="
echo ""
echo "🚀 重新启动请运行: ./start-local.sh"