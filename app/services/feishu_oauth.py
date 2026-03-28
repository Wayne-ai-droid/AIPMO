"""
飞书OAuth授权服务
实现完整的OAuth 2.0授权码流程
"""
import os
import requests
import secrets
from typing import Optional, Dict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class FeishuOAuth:
    """飞书OAuth管理器"""
    
    def __init__(self):
        self.app_id = os.getenv('FEISHU_APP_ID', 'cli_a9086bb17b785cef')
        self.app_secret = os.getenv('FEISHU_APP_SECRET', '')
        self.redirect_uri = os.getenv('FEISHU_REDIRECT_URI', 'http://localhost:8000/auth/callback')
        self.base_url = "https://open.feishu.cn/open-apis"
        
        # 内存中存储token（不写入文件）
        self._tokens: Dict[str, Dict] = {}
    
    def generate_state(self) -> str:
        """生成随机的state参数，防止CSRF攻击"""
        return secrets.token_urlsafe(32)
    
    def get_auth_url(self, state: str) -> str:
        """
        生成飞书授权URL
        
        文档: https://open.feishu.cn/document/server-docs/authentication-management/login-state-management/authorization-code-login
        """
        auth_url = (
            f"https://open.feishu.cn/open-apis/authen/v1/index"
            f"?app_id={self.app_id}"
            f"&redirect_uri={self.redirect_uri}"
            f"&state={state}"
        )
        return auth_url
    
    def exchange_code_for_token(self, code: str) -> Optional[Dict]:
        """
        用授权码换取访问令牌
        
        文档: https://open.feishu.cn/document/server-docs/authentication-management/login-state-management/obtain-login-user-information
        """
        url = f"{self.base_url}/authen/v1/access_token"
        headers = {
            "Content-Type": "application/json"
        }
        data = {
            "grant_type": "authorization_code",
            "code": code
        }
        
        # 使用App Access Token调用
        app_token = self._get_app_access_token()
        if app_token:
            headers["Authorization"] = f"Bearer {app_token}"
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=10)
            result = response.json()
            
            if result.get('code') == 0:
                data = result.get('data', {})
                
                # 存储token到内存
                user_id = data.get('open_id')
                if user_id:
                    self._tokens[user_id] = {
                        'access_token': data.get('access_token'),
                        'refresh_token': data.get('refresh_token'),
                        'expires_in': data.get('expires_in'),
                        'expires_at': datetime.now() + timedelta(seconds=data.get('expires_in', 7200)),
                        'open_id': user_id,
                        'name': data.get('name'),
                        'email': data.get('email'),
                        'tenant_key': data.get('tenant_key')
                    }
                    logger.info(f"用户 {user_id} 授权成功")
                    return self._tokens[user_id]
                else:
                    logger.error("授权响应中缺少open_id")
                    return None
            else:
                logger.error(f"换取token失败: {result}")
                return None
                
        except Exception as e:
            logger.error(f"换取token异常: {e}")
            return None
    
    def _get_app_access_token(self) -> Optional[str]:
        """获取App Access Token"""
        url = f"{self.base_url}/auth/v3/app_access_token/internal"
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
                return result.get('app_access_token')
            else:
                logger.error(f"获取App Token失败: {result}")
                return None
        except Exception as e:
            logger.error(f"获取App Token异常: {e}")
            return None
    
    def get_user_token(self, user_id: str) -> Optional[str]:
        """获取指定用户的访问令牌"""
        if user_id not in self._tokens:
            logger.warning(f"用户 {user_id} 未授权")
            return None
        
        token_info = self._tokens[user_id]
        
        # 检查是否过期
        if datetime.now() >= token_info['expires_at']:
            logger.info(f"用户 {user_id} 的token已过期，尝试刷新")
            return self._refresh_token(user_id)
        
        return token_info['access_token']
    
    def _refresh_token(self, user_id: str) -> Optional[str]:
        """刷新访问令牌"""
        if user_id not in self._tokens:
            return None
        
        refresh_token = self._tokens[user_id].get('refresh_token')
        if not refresh_token:
            logger.warning(f"用户 {user_id} 没有refresh_token")
            return None
        
        url = f"{self.base_url}/authen/v1/refresh_access_token"
        headers = {
            "Content-Type": "application/json"
        }
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=10)
            result = response.json()
            
            if result.get('code') == 0:
                data = result.get('data', {})
                
                # 更新内存中的token
                self._tokens[user_id].update({
                    'access_token': data.get('access_token'),
                    'refresh_token': data.get('refresh_token'),
                    'expires_in': data.get('expires_in'),
                    'expires_at': datetime.now() + timedelta(seconds=data.get('expires_in', 7200))
                })
                
                logger.info(f"用户 {user_id} 的token刷新成功")
                return data.get('access_token')
            else:
                logger.error(f"刷新token失败: {result}")
                # 刷新失败，删除旧token
                del self._tokens[user_id]
                return None
                
        except Exception as e:
            logger.error(f"刷新token异常: {e}")
            return None
    
    def is_authorized(self, user_id: str) -> bool:
        """检查用户是否已授权"""
        return user_id in self._tokens
    
    def get_user_info(self, user_id: str) -> Optional[Dict]:
        """获取用户信息"""
        if user_id not in self._tokens:
            return None
        
        token_info = self._tokens[user_id]
        return {
            'open_id': token_info.get('open_id'),
            'name': token_info.get('name'),
            'email': token_info.get('email'),
            'expires_at': token_info.get('expires_at').isoformat()
        }
    
    def logout(self, user_id: str):
        """用户登出，清除token"""
        if user_id in self._tokens:
            del self._tokens[user_id]
            logger.info(f"用户 {user_id} 已登出")


# 单例模式
_feishu_oauth = None

def get_feishu_oauth() -> FeishuOAuth:
    """获取飞书OAuth管理器"""
    global _feishu_oauth
    if _feishu_oauth is None:
        _feishu_oauth = FeishuOAuth()
    return _feishu_oauth