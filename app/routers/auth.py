"""
飞书OAuth授权路由
处理完整的OAuth 2.0授权流程
"""
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# 导入OAuth服务
try:
    from app.services.feishu_oauth import get_feishu_oauth
    OAUTH_AVAILABLE = True
except ImportError:
    OAUTH_AVAILABLE = False
    logger.warning("OAuth服务未安装")


@router.get("/auth/login")
async def auth_login(request: Request, redirect_uri: str = None):
    """
    启动飞书OAuth授权流程
    
    用户访问此接口后，会被重定向到飞书授权页面
    
    参数:
    - redirect_uri: 可选，前端传入的state标识（解决跨域cookie问题）
    """
    if not OAUTH_AVAILABLE:
        raise HTTPException(status_code=500, detail="OAuth服务未启用")
    
    oauth = get_feishu_oauth()
    
    # 生成随机的state参数（包含时间戳防重放）
    state = oauth.generate_state()
    
    # 将state存储在内存中（替代cookie方案）
    # 使用redirect_uri作为key来关联state
    callback_key = redirect_uri or "default"
    oauth._pending_states = getattr(oauth, '_pending_states', {})
    oauth._pending_states[callback_key] = {
        'state': state,
        'created_at': __import__('datetime').datetime.now()
    }
    
    # 生成授权URL，把callback_key编码到state中
    combined_state = f"{callback_key}:{state}"
    auth_url = oauth.get_auth_url(combined_state)
    
    # 仍然设置cookie作为备用方案
    response = RedirectResponse(url=auth_url)
    response.set_cookie(key="oauth_state", value=state, httponly=True, max_age=600, samesite='lax')
    
    logger.info(f"启动OAuth授权流程，state: {state}, key: {callback_key}")
    return response


@router.get("/auth/callback")
async def auth_callback(code: str, state: str, request: Request):
    """
    飞书OAuth回调接口
    
    用户授权后，飞书会重定向到此接口
    参数:
    - code: 授权码
    - state: 状态参数（包含callback_key:state格式）
    """
    if not OAUTH_AVAILABLE:
        raise HTTPException(status_code=500, detail="OAuth服务未启用")
    
    oauth = get_feishu_oauth()
    
    # 解析state（格式: callback_key:actual_state）
    if ':' in state:
        callback_key, actual_state = state.split(':', 1)
    else:
        callback_key = "default"
        actual_state = state
    
    # 验证state（先从内存查找，再从cookie备用）
    valid_state = None
    pending_states = getattr(oauth, '_pending_states', {})
    
    if callback_key in pending_states:
        stored = pending_states[callback_key]
        # 检查是否过期（10分钟）
        time_diff = __import__('datetime').datetime.now() - stored['created_at']
        if time_diff.total_seconds() < 600:
            valid_state = stored['state']
    
    # 如果内存中没有，尝试从cookie获取（备用方案）
    if not valid_state:
        cookie_state = request.cookies.get("oauth_state")
        if cookie_state:
            valid_state = cookie_state
    
    if not valid_state or valid_state != actual_state:
        logger.error(f"State验证失败: stored={valid_state}, received={actual_state}")
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # 清理已使用的state
    if callback_key in pending_states:
        del pending_states[callback_key]
    
    # 用授权码换取访问令牌
    token_info = oauth.exchange_code_for_token(code)
    
    if not token_info:
        raise HTTPException(status_code=400, detail="Failed to get access token")
    
    # 重定向到前端页面，并带上用户ID
    user_id = token_info.get('open_id')
    
    # 构造前端回调URL
    frontend_callback = f"http://localhost:8080?auth=success&user_id={user_id}"
    
    response = RedirectResponse(url=frontend_callback)
    
    # 清除state cookie
    response.delete_cookie(key="oauth_state")
    
    # 将用户ID存储在cookie中（用于后续识别）
    response.set_cookie(key="user_id", value=user_id, httponly=True, max_age=7200, samesite='lax')
    
    logger.info(f"用户 {user_id} 授权成功，重定向到前端")
    return response


@router.get("/auth/status")
async def auth_status(request: Request):
    """
    检查当前用户的授权状态
    """
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
            "message": "用户未登录"
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
            "message": "Token已过期，请重新授权"
        })


@router.post("/auth/logout")
async def auth_logout(request: Request):
    """
    用户登出
    """
    user_id = request.cookies.get("user_id")
    
    if user_id and OAUTH_AVAILABLE:
        oauth = get_feishu_oauth()
        oauth.logout(user_id)
    
    response = JSONResponse({
        "code": 0,
        "message": "登出成功"
    })
    
    # 清除cookie
    response.delete_cookie(key="user_id")
    
    return response


@router.get("/auth/url")
async def get_auth_url():
    """
    获取授权URL（前端可以直接使用）
    """
    if not OAUTH_AVAILABLE:
        return JSONResponse({
            "code": 500,
            "message": "OAuth服务未启用"
        })
    
    oauth = get_feishu_oauth()
    state = oauth.generate_state()
    auth_url = oauth.get_auth_url(state)
    
    return JSONResponse({
        "code": 0,
        "auth_url": auth_url,
        "state": state
    })