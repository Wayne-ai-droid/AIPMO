#!/bin/bash
# 查看飞书API调用详细日志

echo "=== 飞书API调用日志 ==="
echo ""

if [ -f "logs/backend.log" ]; then
    echo "📄 最近的API调用记录:"
    echo "----------------------------------------"
    tail -n 50 logs/backend.log | grep -E "飞书API|token|header|Authorization"
    echo ""
    
    echo "📄 所有错误信息:"
    echo "----------------------------------------"
    tail -n 100 logs/backend.log | grep -i "error\|失败\|异常"
else
    echo "❌ 未找到日志文件"
fi