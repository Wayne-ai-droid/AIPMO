#!/bin/bash
# 管理脚本

case "$1" in
    start)
        echo "启动服务..."
        systemctl start feishu-approval-agent
        ;;
    stop)
        echo "停止服务..."
        systemctl stop feishu-approval-agent
        ;;
    restart)
        echo "重启服务..."
        systemctl restart feishu-approval-agent
        ;;
    status)
        systemctl status feishu-approval-agent
        ;;
    logs)
        journalctl -u feishu-approval-agent -f
        ;;
    test)
        echo "测试服务..."
        curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
        echo ""
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs|test}"
        exit 1
        ;;
esac