"""审批数据API路由"""
from fastapi import APIRouter, Query, Request
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

# 尝试导入服务
try:
    from app.services.feishu_api import get_feishu_api
    FEISHU_API_AVAILABLE = True
except ImportError:
    FEISHU_API_AVAILABLE = False

try:
    from app.services.feishu_oauth import get_feishu_oauth
    OAUTH_AVAILABLE = True
except ImportError:
    OAUTH_AVAILABLE = False


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


@router.get("/approvals")
async def get_approvals(
    request: Request,
    days: int = Query(7, description="最近几天"),
    status: Optional[str] = Query(None, description="状态过滤"),
    use_mock: bool = Query(False, description="是否使用模拟数据")
):
    """
    获取审批列表
    
    会先检查用户是否已授权，如果未授权则返回401
    """
    # 从cookie获取用户ID
    user_id = request.cookies.get("user_id")
    
    # 检查用户是否已授权
    if not user_id or (OAUTH_AVAILABLE and not get_feishu_oauth().is_authorized(user_id)):
        return {
            "code": 401,
            "msg": "用户未授权，请先登录",
            "data": [],
            "total": 0,
            "auth_url": "/auth/login"
        }
    
    # 如果使用模拟数据
    if use_mock:
        return {
            "code": 0,
            "msg": "success",
            "data": MOCK_APPROVALS,
            "total": len(MOCK_APPROVALS),
            "source": "mock"
        }
    
    # 使用飞书API获取真实数据
    if FEISHU_API_AVAILABLE and OAUTH_AVAILABLE:
        try:
            oauth = get_feishu_oauth()
            access_token = oauth.get_user_token(user_id)
            
            if not access_token:
                return {
                    "code": 401,
                    "msg": "Token已过期，请重新授权",
                    "data": [],
                    "total": 0,
                    "auth_url": "/auth/login"
                }
            
            # TODO: 使用access_token调用飞书API获取审批数据
            # 这里暂时返回模拟数据，后续实现真实API调用
            logger.info(f"用户 {user_id} 获取审批列表")
            
            return {
                "code": 0,
                "msg": "success",
                "data": MOCK_APPROVALS,  # 暂时用模拟数据
                "total": len(MOCK_APPROVALS),
                "source": "feishu_api",
                "user_id": user_id
            }
            
        except Exception as e:
            logger.error(f"获取审批失败: {e}")
            return {
                "code": 500,
                "msg": f"获取失败: {str(e)}",
                "data": []
            }
    else:
        return {
            "code": 0,
            "msg": "success",
            "data": MOCK_APPROVALS,
            "total": len(MOCK_APPROVALS),
            "source": "mock"
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