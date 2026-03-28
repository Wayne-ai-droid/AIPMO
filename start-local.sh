#!/bin/bash
# 飞书审批助手 - 本地启动脚本（修复版）

echo "=== 飞书审批助手 - 本地启动 ==="
echo ""

# 检查是否在项目目录
if [ ! -f "app/main.py" ]; then
    echo "❌ 错误：请在项目目录下运行此脚本"
    echo "   cd AIPMO"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，正在从模板创建..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请编辑配置后重新运行"
    echo "   nano .env"
    exit 1
fi

# 生成前端配置
echo "📝 生成前端配置..."
python3 generate_config.py
if [ $? -ne 0 ]; then
    echo "❌ 配置生成失败"
    exit 1
fi

# 检查依赖
echo "🔍 检查依赖..."
python3 -c "import fastapi, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 安装依赖..."
    pip3 install fastapi uvicorn requests python-dotenv httpx
fi

echo ""
echo "=== 启动服务 ==="
echo ""

# 终端1：启动后端（使用模块方式运行，解决Mac导入问题）
echo "🚀 启动后端服务..."
echo "   地址: http://127.0.0.1:8000"
echo ""

# 在项目根目录使用模块方式运行
nohup python3 -m app.main > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ! curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "⚠️  后端启动可能需要更多时间，请查看日志: logs/backend.log"
fi

# 终端2：启动前端
echo ""
echo "🌐 启动前端服务..."
echo "   地址: http://127.0.0.1:8080"
echo ""

cd frontend
nohup python3 -m http.server 8080 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端已启动 (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "=== 服务启动完成 ==="
echo ""
echo "📋 访问地址："
echo "   前端页面: http://localhost:8080"
echo "   后端API:  http://localhost:8000"
echo "   API文档:  http://localhost:8000/docs"
echo ""
echo "🛑 停止服务："
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📁 日志文件："
echo "   后端日志: logs/backend.log"
echo "   前端日志: logs/frontend.log"
echo ""

# 如果有图形界面，尝试打开浏览器
if command -v open > /dev/null 2>&1; then
    echo "🌍 正在打开浏览器..."
    sleep 2
    open http://localhost:8080
elif command -v xdg-open > /dev/null 2>&1; then
    echo "🌍 正在打开浏览器..."
    sleep 2
    xdg-open http://localhost:8080
fi