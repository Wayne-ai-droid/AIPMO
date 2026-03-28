"""审批数据API路由"""
from fastapi import APIRouter, Query, Request, Header
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import requests

router = APIRouter()
logger = logging.getLogger(__name__)

# 尝试导入服务
try:
    from app.services.feishu_api import get_feishu_api
    FEISHU_API_AVAILABLE = True
except ImportError:
    FEISHU_API_AVAILABLE = False

# 模拟数据（用于测试或API不可用时）
MOCK_APPROVALS = [
    {
        "instance_code": "APP001",
        "title": "结汇价格调整申请",
        "form_name": "结汇申请",
        "status": "PENDING",
        "initiator_id": "ou_xxx",
        "initiator_name": "张三",
        "processor_id": "ou_a795353f084e446e25c7074e04482728",
        "create_time": datetime.now().isoformat(),
        "update_time": datetime.now().isoformat()
    },
    {
        "instance_code": "APP002",
        "title": "提现申请",
        "form_name": "提现审批",
        "status": "APPROVED",
        "initiator_id": "ou_a795353f084e446e25c7074e04482728",
        "initiator_name": "林博",
        "processor_id": "ou_xxx",
        "create_time": (datetime.now() - timedelta(hours=2)).isoformat(),
        "update_time": (datetime.now() - timedelta(hours=1)).isoformat()
    }
]


def get_feishu_approvals(access_token: str, user_id: str, days: int = 7):
    """
    调用飞书API获取审批列表
    
    文档: https://open.feishu.cn/document/server-docs/approval-v4/task/query
    注意：获取待办任务列表需要使用 /approval/v4/tasks 接口
    """
    base_url = "https://open.feishu.cn/open-apis"
    
    # 【重要】使用正确的API端点：获取待办任务列表
    # 文档：https://open.feishu.cn/document/server-docs/approval-v4/task/query
    url = f"{base_url}/approval/v4/tasks"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # 查询参数
    params = {
        "user_id": user_id,
        "page_size": 100
    }
    
    try:
        logger.info(f"调用飞书API: {url}")
        logger.info(f"Headers: Authorization=Bearer {access_token[:20]}...")
        logger.info(f"Params: {params}")
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        result = response.json()
        
        logger.info(f"飞书API响应状态码: {response.status_code}")
        logger.info(f"飞书API响应: {result}")
        
        if result.get('code') == 0:
            data = result.get('data', {})
            items = data.get('items', [])
            
            # 格式化数据
            approvals = []
            for item in items:
                approval = {
                    "instance_code": item.get('instance_code'),
                    "title": item.get('approval_name', '审批申请'),
                    "form_name": item.get('form_name', '审批'),
                    "status": item.get('status', 'PENDING'),
                    "initiator_id": item.get('user_id'),
                    "initiator_name": item.get('user_name', '未知'),
                    "create_time": item.get('create_time'),
                    "update_time": item.get('update_time')
                }
                approvals.append(approval)
            
            logger.info(f"获取到 {len(approvals)} 条审批")
            return approvals
        else:
            logger.error(f"飞书API调用失败: code={result.get('code')}, msg={result.get('msg')}")
            # 返回错误信息用于调试
            return {"error": result}
            
    except Exception as e:
        logger.error(f"调用飞书API异常: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None


@router.get("/approvals")
async def get_approvals(
    request: Request,
    days: int = Query(7, description="最近几天"),
    user_id: str = Query(..., description="用户ID"),
    status: Optional[str] = Query(None, description="状态过滤"),
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    获取审批列表
    
    如果提供了Authorization header，会尝试调用飞书API获取真实数据
    """
    logger.info(f"获取审批列表: user_id={user_id}, days={days}")
    logger.info(f"Authorization header: {authorization[:30] if authorization else 'None'}...")
    
    # 从header中提取token
    access_token = None
    if authorization and authorization.startswith("Bearer "):
        access_token = authorization[7:]  # 去掉 "Bearer " 前缀
    
    # 如果有access_token，尝试调用飞书API
    if access_token:
        logger.info(f"尝试调用飞书API... token: {access_token[:20]}...")
        feishu_result = get_feishu_approvals(access_token, user_id, days)
        
        if isinstance(feishu_result, list) and len(feishu_result) > 0:
            return {
                "code": 0,
                "msg": "success",
                "data": feishu_result,
                "total": len(feishu_result),
                "source": "feishu_api"
            }
        elif isinstance(feishu_result, dict) and "error" in feishu_result:
            error_info = feishu_result["error"]
            logger.error(f"飞书API错误: {error_info}")
    
    # 无论是否有token，都返回模拟数据用于测试
    logger.info("返回模拟数据用于展示")
    return {
        "code": 0,
        "msg": "success",
        "data": MOCK_APPROVALS,
        "total": len(MOCK_APPROVALS),
        "source": "mock",
        "debug": {"has_token": bool(access_token), "user_id": user_id}
    }


@router.get("/approvals/{instance_code}")
async def get_approval_detail(instance_code: str):
    """获取审批详情"""
    for item in MOCK_APPROVALS:
        if item["instance_code"] == instance_code:
            return {
                "code": 0,
                "msg": "success",
                "data": item
            }
    
    return {
        "code": 404,
        "msg": "审批记录不存在",
        "data": None
    }


@router.post("/approvals/{instance_code}/analyze")
async def analyze_approval(instance_code: str):
    """AI分析审批"""
    return {
        "code": 0,
        "msg": "success",
        "data": {
            "suggestion": "APPROVE",
            "reason": "符合审批标准",
            "confidence": 0.95
        }
    }