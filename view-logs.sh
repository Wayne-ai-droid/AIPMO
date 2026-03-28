#!/bin/bash
# 查看飞书审批助手日志

echo "=== 飞书审批助手 - 日志查看 ==="
echo ""

if [ -f "logs/backend.log" ]; then
    echo "📄 后端日志 (最近50行):"
    echo "----------------------------------------"
    tail -n 50 logs/backend.log
    echo ""
else
    echo "❌ 未找到日志文件: logs/backend.log"
    echo "   请确保服务已启动"
fi

if [ -f "logs/frontend.log" ]; then
    echo "📄 前端日志 (最近20行):"
    echo "----------------------------------------"
    tail -n 20 logs/frontend.log
    echo ""
fi

echo ""
echo "💡 提示: 实时查看日志请运行:"
echo "   tail -f logs/backend.log"