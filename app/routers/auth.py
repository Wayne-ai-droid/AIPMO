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
async def auth_login(request: Request):
    """
    启动飞书OAuth授权流程
    
    用户访问此接口后，会被重定向到飞书授权页面
    """
    if not OAUTH_AVAILABLE:
        raise HTTPException(status_code=500, detail="OAuth服务未启用")
    
    oauth = get_feishu_oauth()
    
    # 生成随机的state参数（存储在session或cookie中）
    state = oauth.generate_state()
    
    # 生成授权URL
    auth_url = oauth.get_auth_url(state)
    
    # 将state存储在cookie中（简单实现，生产环境应使用session）
    response = RedirectResponse(url=auth_url)
    response.set_cookie(key="oauth_state", value=state, httponly=True, max_age=600)
    
    logger.info(f"启动OAuth授权流程，state: {state}")
    return response


@router.get("/auth/callback")
async def auth_callback(code: str, state: str, request: Request):
    """
    飞书OAuth回调接口
    
    用户授权后，飞书会重定向到此接口
    参数:
    - code: 授权码
    - state: 状态参数（防止CSRF）
    """
    if not OAUTH_AVAILABLE:
        raise HTTPException(status_code=500, detail="OAuth服务未启用")
    
    # 验证state（防止CSRF攻击）
    cookie_state = request.cookies.get("oauth_state")
    if not cookie_state or cookie_state != state:
        logger.error(f"State验证失败: cookie={cookie_state}, param={state}")
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    oauth = get_feishu_oauth()
    
    # 用授权码换取访问令牌
    token_info = oauth.exchange_code_for_token(code)
    
    if not token_info:
        raise HTTPException(status_code=400, detail="Failed to get access token")
    
    # 重定向到前端页面，并带上用户ID
    user_id = token_info.get('open_id')
    
    # 构造前端回调URL（可以自定义）
    frontend_callback = f"http://localhost:8080?auth=success&user_id={user_id}"
    
    response = RedirectResponse(url=frontend_callback)
    
    # 清除state cookie
    response.delete_cookie(key="oauth_state")
    
    # 将用户ID存储在cookie中（用于后续识别）
    response.set_cookie(key="user_id", value=user_id, httponly=True, max_age=7200)
    
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