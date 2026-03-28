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
from app.routers import webhook, approvals

# 注册路由
app.include_router(webhook.router, prefix="/webhook")
app.include_router(approvals.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "飞书审批助手服务运行中",
        "version": "1.0.0",
        "status": "ok",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "feishu-approval-agent",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)