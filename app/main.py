"""
飞书审批助手 - 应用入口
支持模块方式运行: python3 -m app.main
"""
import sys
import os

# 添加项目根目录到Python路径（解决Mac模块导入问题）
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="飞书审批助手",
    description="AI驱动的飞书审批处理助手",
    version="1.0.0"
)

# CORS配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 导入路由
from app.routers import webhook, approvals, auth

# 注册路由
app.include_router(webhook.router, prefix="/webhook")
app.include_router(approvals.router, prefix="/api")
app.include_router(auth.router)  # OAuth路由不需要前缀

@app.get("/")
async def root():
    return {
        "message": "飞书审批助手服务运行中",
        "version": "1.0.0",
        "status": "ok",
        "docs": "/docs",
        "auth_url": "/auth/login",
        "api_base": "/api"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "feishu-approval-agent",
        "version": "1.0.0"
    }

# 模块运行入口
if __name__ == "__main__":
    import uvicorn
    # 从环境变量读取配置
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '8000'))
    uvicorn.run(app, host=host, port=port)