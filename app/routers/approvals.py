"""审批数据API路由"""
from fastapi import APIRouter, Query
from typing import List, Optional
from datetime import datetime, timedelta
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# 模拟数据（实际应从飞书API或数据库获取）
MOCK_APPROVALS = [
    {
        "instance_code": "APP001",
        "title": "结汇价格调整申请",
        "form_name": "结汇申请",
        "status": "PENDING",
        "initiator_id": "ou_xxx",
        "initiator_name": "张三",
        "processor_id": "ou_a795353f084e446e25c7074e04482728",
        "create_time": (datetime.now() - timedelta(days=1)).isoformat()
    },
    {
        "instance_code": "APP002",
        "title": "提现申请",
        "form_name": "提现审批",
        "status": "APPROVED",
        "initiator_id": "ou_a795353f084e446e25c7074e04482728",
        "initiator_name": "林博",
        "processor_id": "ou_xxx",
        "create_time": (datetime.now() - timedelta(days=2)).isoformat()
    },
    {
        "instance_code": "APP003",
        "title": "费用报销",
        "form_name": "报销审批",
        "status": "PENDING",
        "initiator_id": "ou_yyy",
        "initiator_name": "李四",
        "processor_id": "ou_a795353f084e446e25c7074e04482728",
        "create_time": (datetime.now() - timedelta(days=3)).isoformat()
    }
]

@router.get("/approvals")
async def get_approvals(
    days: int = Query(7, description="最近几天"),
    user_id: str = Query(..., description="用户ID"),
    status: Optional[str] = Query(None, description="状态过滤")
):
    """
    获取审批列表
    
    参数:
    - days: 最近几天（默认7天）
    - user_id: 用户ID
    - status: 状态过滤（可选）
    
    返回:
    - 审批列表
    """
    logger.info(f"获取审批列表: user_id={user_id}, days={days}")
    
    # 计算时间范围
    start_time = datetime.now() - timedelta(days=days)
    
    # 过滤数据
    filtered_data = []
    for item in MOCK_APPROVALS:
        item_time = datetime.fromisoformat(item["create_time"].replace('Z', '+00:00'))
        if item_time >= start_time:
            # 状态过滤
            if status and item["status"] != status:
                continue
            filtered_data.append(item)
    
    # 按时间倒序
    filtered_data.sort(key=lambda x: x["create_time"], reverse=True)
    
    return {
        "code": 0,
        "msg": "success",
        "data": filtered_data,
        "total": len(filtered_data)
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
    # TODO: 调用AI分析
    return {
        "code": 0,
        "msg": "success",
        "data": {
            "suggestion": "APPROVE",
            "reason": "符合审批标准",
            "confidence": 0.95
        }
    }