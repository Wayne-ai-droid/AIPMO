#!/bin/bash
# 查看飞书API调用日志

echo "=== 飞书API调用日志 ==="
echo ""

if [ -f "logs/backend.log" ]; then
    echo "📄 搜索飞书API相关日志:"
    echo "----------------------------------------"
    grep -A 3 -B 3 "飞书API\|approval\|tasks" logs/backend.log | tail -n 50
    echo ""
else
    echo "❌ 未找到日志文件"
fi