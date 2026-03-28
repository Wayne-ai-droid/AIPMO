"""
飞书API服务 - 获取真实审批数据
"""
import os
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class FeishuApprovalAPI:
    """飞书审批API客户端"""
    
    def __init__(self):
        self.app_id = os.getenv('FEISHU_APP_ID')
        self.app_secret = os.getenv('FEISHU_APP_SECRET')
        self.user_access_token = os.getenv('FEISHU_USER_ACCESS_TOKEN')
        self.base_url = "https://open.feishu.cn/open-apis"
        
    def get_tenant_access_token(self) -> Optional[str]:
        """获取租户访问令牌"""
        url = f"{self.base_url}/auth/v3/tenant_access_token/internal"
        headers = {
            "Content-Type": "application/json"
        }
        data = {
            "app_id": self.app_id,
            "app_secret": self.app_secret
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=10)
            result = response.json()
            
            if result.get('code') == 0:
                return result.get('tenant_access_token')
            else:
                logger.error(f"获取token失败: {result}")
                return None
        except Exception as e:
            logger.error(f"获取token异常: {e}")
            return None
    
    def get_pending_approvals(self, user_id: str, days: int = 7) -> List[Dict]:
        """
        获取待审批列表
        
        文档: https://open.feishu.cn/document/server-docs/approval-v4/approval-instance/list
        """
        # 优先使用用户Token，如果没有则使用Tenant Token
        token = self.user_access_token or self.get_tenant_access_token()
        
        if not token:
            logger.error("无法获取访问令牌")
            return []
        
        # 计算时间范围
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days)
        
        url = f"{self.base_url}/approval/v4/instances"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 查询参数
        params = {
            "user_id": user_id,
            "status": "PENDING",  # 待审批
            "page_size": 100
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            result = response.json()
            
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
                        "update_time": item.get('update_time'),
                        "processor_id": user_id  # 当前处理人
                    }
                    approvals.append(approval)
                
                logger.info(f"获取到 {len(approvals)} 条待审批")
                return approvals
            else:
                logger.error(f"API调用失败: {result}")
                return []
                
        except Exception as e:
            logger.error(f"获取待审批列表异常: {e}")
            return []
    
    def get_approval_detail(self, instance_code: str) -> Optional[Dict]:
        """
        获取审批详情
        
        文档: https://open.feishu.cn/document/server-docs/approval-v4/approval-instance/query
        """
        token = self.user_access_token or self.get_tenant_access_token()
        
        if not token:
            return None
        
        url = f"{self.base_url}/approval/v4/instances/{instance_code}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            result = response.json()
            
            if result.get('code') == 0:
                return result.get('data')
            else:
                logger.error(f"获取审批详情失败: {result}")
                return None
        except Exception as e:
            logger.error(f"获取审批详情异常: {e}")
            return None


# 单例模式
_feishu_api = None

def get_feishu_api() -> FeishuApprovalAPI:
    """获取飞书API客户端"""
    global _feishu_api
    if _feishu_api is None:
        _feishu_api = FeishuApprovalAPI()
    return _feishu_api