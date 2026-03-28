"""
飞书OAuth授权路由 - 简化版（开发测试用）
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
import logging
import secrets

router = APIRouter()
logger = logging.getLogger(__name__)

# 导入OAuth服务
try:
    from app.services.feishu_oauth import get_feishu_oauth
    OAUTH_AVAILABLE = True
except ImportError:
    OAUTH_AVAILABLE = False
    logger.warning("OAuth服务未安装")

# 内存存储state（服务重启会丢失）
_pending_states = {}


@router.get("/auth/login")
async def auth_login(request: Request):
    """
    启动飞书OAuth授权流程
    """
    if not OAUTH_AVAILABLE:
        raise HTTPException(status_code=500, detail="OAuth服务未启用")
    
    oauth = get_feishu_oauth()
    
    # 生成state
    state = secrets.token_urlsafe(32)
    
    # 存储在内存中（5分钟有效期）
    import time
    _pending_states[state] = {
        'created_at': time.time()
    }
    
    # 生成授权URL
    auth_url = oauth.get_auth_url(state)
    
    logger.info(f"启动OAuth授权，state: {state[:10]}...")
    return RedirectResponse(url=auth_url)


@router.get("/auth/callback")
async def auth_callback(code: str, state: str, request: Request):
    """
    飞书OAuth回调接口
    
    简化版：允许state验证失败时继续（仅用于开发测试）
    """
    if not OAUTH_AVAILABLE:
        raise HTTPException(status_code=500, detail="OAuth服务未启用")
    
    import time
    
    # 验证state（开发环境可跳过严格验证）
    state_valid = False
    if state in _pending_states:
        stored = _pending_states[state]
        # 检查是否过期（5分钟）
        if time.time() - stored['created_at'] < 300:
            state_valid = True
            # 删除已使用的state
            del _pending_states[state]
    
    if not state_valid:
        # 开发环境：记录警告但继续
        logger.warning(f"State验证失败或已过期，继续处理（开发模式）")
        # 清理过期state
        expired = [k for k, v in _pending_states.items() if time.time() - v['created_at'] > 300]
        for k in expired:
            del _pending_states[k]
    
    oauth = get_feishu_oauth()
    
    # 用授权码换取访问令牌
    token_info = oauth.exchange_code_for_token(code)
    
    if not token_info:
        raise HTTPException(status_code=400, detail="获取访问令牌失败，请检查App Secret配置")
    
    user_id = token_info.get('open_id')
    user_name = token_info.get('name', '用户')
    
    logger.info(f"用户 {user_name}({user_id}) 授权成功")
    
    # 重定向到前端，带上完整授权信息（包括access_token）
    import urllib.parse
    access_token = token_info.get('access_token', '')
    frontend_callback = (
        f"http://localhost:8080?"
        f"auth=success"
        f"&user_id={user_id}"
        f"&name={urllib.parse.quote(user_name)}"
        f"&token={access_token}"  # 传递完整access_token
    )
    
    return RedirectResponse(url=frontend_callback)


@router.get("/auth/status")
async def auth_status(request: Request):
    """检查授权状态"""
    if not OAUTH_AVAILABLE:
        return JSONResponse({
            "code": 0,
            "is_authorized": False,
            "message": "OAuth服务未启用"
        })
    
    user_id = request.cookies.get("user_id")
    
    if not user_id:
        return JSONResponse({
            "code": 0,
            "is_authorized": False,
            "message": "未登录"
        })
    
    oauth = get_feishu_oauth()
    
    if oauth.is_authorized(user_id):
        user_info = oauth.get_user_info(user_id)
        return JSONResponse({
            "code": 0,
            "is_authorized": True,
            "user_id": user_id,
            "user_info": user_info
        })
    else:
        return JSONResponse({
            "code": 0,
            "is_authorized": False,
            "message": "Token已过期"
        })


@router.post("/auth/logout")
async def auth_logout(request: Request):
    """用户登出"""
    user_id = request.cookies.get("user_id")
    
    if user_id and OAUTH_AVAILABLE:
        oauth = get_feishu_oauth()
        oauth.logout(user_id)
    
    response = JSONResponse({
        "code": 0,
        "message": "登出成功"
    })
    
    response.delete_cookie(key="user_id")
    
    return response


@router.get("/auth/test")
async def auth_test():
    """测试接口"""
    return JSONResponse({
        "code": 0,
        "message": "授权服务运行正常",
        "pending_states_count": len(_pending_states),
        "oauth_available": OAUTH_AVAILABLE
    })