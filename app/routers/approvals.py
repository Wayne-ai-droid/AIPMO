"""审批数据API路由"""
from fastapi import APIRouter, Query, Request, Header
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import requests

router = APIRouter()
logger = logging.getLogger(__name__)

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


def test_feishu_api(access_token: str):
    """
    测试飞书API连通性
    
    使用 /approval/v4/approvals 获取审批定义列表（最简单的测试接口）
    """
    base_url = "https://open.feishu.cn/open-apis"
    url = f"{base_url}/approval/v4/approvals"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        logger.info(f"测试飞书API连通性: {url}")
        response = requests.get(url, headers=headers, timeout=10)
        
        logger.info(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                if result.get('code') == 0:
                    approval_list = result.get('data', {}).get('approval_list', [])
                    logger.info(f"API测试成功，获取到 {len(approval_list)} 个审批定义")
                    return {
                        "success": True,
                        "approval_count": len(approval_list),
                        "approvals": approval_list[:5]  # 只返回前5个
                    }
                else:
                    return {"success": False, "error": result.get('msg'), "code": result.get('code')}
            except:
                return {"success": False, "error": "解析响应失败"}
        else:
            return {"success": False, "error": f"HTTP {response.status_code}", "detail": response.text[:200]}
            
    except Exception as e:
        logger.error(f"API测试异常: {e}")
        return {"success": False, "error": str(e)}


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
    """
    logger.info(f"获取审批列表: user_id={user_id}, days={days}")
    logger.info(f"Authorization header: {authorization[:30] if authorization else 'None'}...")
    
    # 从header中提取token
    access_token = None
    if authorization and authorization.startswith("Bearer "):
        access_token = authorization[7:]
    
    api_test_result = None
    
    # 测试飞书API连通性
    if access_token:
        logger.info("测试飞书API连通性...")
        api_test_result = test_feishu_api(access_token)
        logger.info(f"API测试结果: {api_test_result}")
    
    # 目前返回模拟数据，但附带API测试结果
    return {
        "code": 0,
        "msg": "success",
        "data": MOCK_APPROVALS,
        "total": len(MOCK_APPROVALS),
        "source": "mock",
        "api_test": api_test_result,
        "note": "已获取access_token并测试API连通性。如需真实数据，需进一步完善API调用逻辑。"
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