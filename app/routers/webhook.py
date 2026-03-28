"""Webhook路由 - 接收飞书审批事件"""
from fastapi import APIRouter, Request, HTTPException
import logging
import json
import hmac
import hashlib
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

def verify_signature(timestamp: str, body: bytes, signature: str) -> bool:
    """验证飞书Webhook签名"""
    try:
        secret = settings.FEISHU_WEBHOOK_SECRET
        string_to_sign = f"{timestamp}\n{secret}\n{body.decode('utf-8')}\n"
        hmac_code = hmac.new(
            secret.encode('utf-8'),
            string_to_sign.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return hmac_code == signature
    except Exception as e:
        logger.error(f"签名验证失败: {e}")
        return False

@router.post("/feishu/approval")
async def receive_approval(request: Request):
    """接收飞书审批Webhook"""
    body = await request.body()
    timestamp = request.headers.get("X-Lark-Timestamp", "")
    signature = request.headers.get("X-Lark-Signature", "")
    
    # 验证签名
    if not verify_signature(timestamp, body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    data = json.loads(body)
    event_type = data.get("header", {}).get("event_type")
    
    if event_type != "approval.instance.updated":
        return {"code": 0, "msg": "ignored"}
    
    event = data.get("event", {})
    instance_code = event.get("instance_code")
    
    logger.info(f"收到审批: {instance_code}")
    
    # 检查是否是我的待办
    my_user_id = settings.MY_USER_ID
    task_list = event.get("task_list", [])
    is_my_task = any(task.get("user_id") == my_user_id for task in task_list)
    
    if not is_my_task:
        return {"code": 0, "msg": "not my approval"}
    
    # TODO: 调用Jarvis-PM分析
    
    return {"code": 0, "msg": "success", "instance_code": instance_code}

@router.get("/test")
async def test_webhook():
    """测试端点"""
    return {"status": "ok", "message": "Webhook服务正常"}