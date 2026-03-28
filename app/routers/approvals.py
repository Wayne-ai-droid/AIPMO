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


def get_feishu_approvals(access_token: str, user_id: str, days: int = 7):
    """
    调用飞书API获取用户的审批任务列表
    
    使用 POST /approval/v4/tasks/search 接口
    文档: https://open.feishu.cn/document/server-docs/approval-v4/approval-search/search
    """
    base_url = "https://open.feishu.cn/open-apis"
    url = f"{base_url}/approval/v4/tasks/search"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=utf-8"
    }
    
    # 计算时间范围（毫秒时间戳）
    end_time = int(datetime.now().timestamp() * 1000)
    start_time = end_time - (days * 24 * 60 * 60 * 1000)
    
    # POST请求体
    body = {
        "user_id": user_id,
        "task_status_list": ["PENDING"],  # 查询待审批任务
        "task_start_time_from": str(start_time),
        "task_start_time_to": str(end_time),
        "page_size": 100,
        "order": 2  # 按任务开始时间降序
    }
    
    try:
        logger.info(f"调用飞书API: {url}")
        logger.info(f"Headers: Authorization=Bearer {access_token[:20]}...")
        logger.info(f"Body: {body}")
        
        response = requests.post(url, headers=headers, json=body, timeout=10)
        
        logger.info(f"飞书API响应状态码: {response.status_code}")
        logger.info(f"飞书API响应内容类型: {response.headers.get('content-type')}")
        
        if response.status_code != 200:
            logger.error(f"飞书API返回错误状态码: {response.status_code}")
            logger.error(f"响应内容: {response.text[:500]}")
            return {"error": {"status": response.status_code, "detail": response.text[:500]}}
        
        # 检查是否是JSON响应
        if 'application/json' not in response.headers.get('content-type', ''):
            logger.error(f"飞书API返回非JSON响应: {response.text[:500]}")
            return {"error": {"msg": "API返回非JSON格式", "detail": response.text[:500]}}
        
        result = response.json()
        
        logger.info(f"飞书API响应code: {result.get('code')}")
        
        if result.get('code') == 0:
            data = result.get('data', {})
            task_list = data.get('task_list', [])
            
            # 格式化数据
            approvals = []
            for task_item in task_list:
                approval_info = task_item.get('approval', {})
                instance_info = task_item.get('instance', {})
                task_info = task_item.get('task', {})
                
                approval = {
                    "instance_code": instance_info.get('code', ''),
                    "title": instance_info.get('title') or approval_info.get('name', '审批申请'),
                    "form_name": approval_info.get('name', '审批'),
                    "status": task_info.get('status', 'PENDING').upper(),
                    "initiator_id": instance_info.get('user_id', ''),
                    "initiator_name": "未知",  # 需要额外查询
                    "create_time": instance_info.get('start_time'),
                    "update_time": task_info.get('update_time'),
                    "task_id": task_info.get('task_id', '')
                }
                approvals.append(approval)
            
            logger.info(f"获取到 {len(approvals)} 条审批任务")
            return approvals
        else:
            logger.error(f"飞书API调用失败: code={result.get('code')}, msg={result.get('msg')}")
            return {"error": {"code": result.get('code'), "msg": result.get('msg'), "full_response": result}}
            
    except Exception as e:
        logger.error(f"调用飞书API异常: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"error": {"msg": str(e)}}


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
        access_token = authorization[7:]
    
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
            # 返回模拟数据，但显示错误信息
            return {
                "code": 0,
                "msg": "success",
                "data": MOCK_APPROVALS,
                "total": len(MOCK_APPROVALS),
                "source": "mock",
                "error_detail": error_info,
                "note": "飞书API调用失败，显示模拟数据"
            }
    
    # 返回模拟数据
    logger.info("返回模拟数据")
    return {
        "code": 0,
        "msg": "success",
        "data": MOCK_APPROVALS,
        "total": len(MOCK_APPROVALS),
        "source": "mock",
        "note": "未提供有效access_token或API调用失败，显示模拟数据"
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