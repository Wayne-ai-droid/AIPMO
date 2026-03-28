"""审批数据API路由"""
from fastapi import APIRouter, Query
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

# 尝试导入飞书API服务
try:
    from app.services.feishu_api import get_feishu_api
    FEISHU_API_AVAILABLE = True
except ImportError:
    FEISHU_API_AVAILABLE = False
    logger.warning("飞书API服务未安装，使用模拟数据")


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
    },
    {
        "instance_code": "APP003",
        "title": "费用报销",
        "form_name": "报销审批",
        "status": "PENDING",
        "initiator_id": "ou_yyy",
        "initiator_name": "李四",
        "processor_id": "ou_a795353f084e446e25c7074e04482728",
        "create_time": (datetime.now() - timedelta(hours=5)).isoformat(),
        "update_time": (datetime.now() - timedelta(hours=4)).isoformat()
    }
]


@router.get("/approvals")
async def get_approvals(
    days: int = Query(7, description="最近几天"),
    user_id: str = Query(..., description="用户ID"),
    status: Optional[str] = Query(None, description="状态过滤"),
    use_mock: bool = Query(False, description="是否使用模拟数据")
):
    """
    获取审批列表
    
    参数:
    - days: 最近几天（默认7天）
    - user_id: 用户ID
    - status: 状态过滤（可选）
    - use_mock: 是否使用模拟数据（调试用）
    
    返回:
    - 审批列表
    """
    logger.info(f"获取审批列表: user_id={user_id}, days={days}, use_mock={use_mock}")
    
    # 如果使用模拟数据或飞书API不可用
    if use_mock or not FEISHU_API_AVAILABLE:
        logger.info("使用模拟数据")
        
        # 计算时间范围
        start_time = datetime.now() - timedelta(days=days)
        
        # 过滤数据
        filtered_data = []
        for item in MOCK_APPROVALS:
            item_time = datetime.fromisoformat(item["create_time"].replace('Z', '+00:00') if 'Z' in item["create_time"] else item["create_time"])
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
            "total": len(filtered_data),
            "source": "mock"
        }
    
    # 使用飞书API获取真实数据
    try:
        feishu_api = get_feishu_api()
        approvals = feishu_api.get_pending_approvals(user_id, days)
        
        return {
            "code": 0,
            "msg": "success",
            "data": approvals,
            "total": len(approvals),
            "source": "feishu_api"
        }
    except Exception as e:
        logger.error(f"获取飞书审批失败: {e}")
        return {
            "code": 500,
            "msg": f"获取失败: {str(e)}",
            "data": [],
            "total": 0
        }


@router.get("/approvals/{instance_code}")
async def get_approval_detail(instance_code: str):
    """获取审批详情"""
    # 先查模拟数据
    for item in MOCK_APPROVALS:
        if item["instance_code"] == instance_code:
            return {
                "code": 0,
                "msg": "success",
                "data": item
            }
    
    # 如果飞书API可用，查真实数据
    if FEISHU_API_AVAILABLE:
        try:
            feishu_api = get_feishu_api()
            detail = feishu_api.get_approval_detail(instance_code)
            if detail:
                return {
                    "code": 0,
                    "msg": "success",
                    "data": detail
                }
        except Exception as e:
            logger.error(f"获取审批详情失败: {e}")
    
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