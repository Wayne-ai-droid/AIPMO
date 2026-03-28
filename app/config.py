import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """应用配置类"""
    
    # 飞书配置
    FEISHU_APP_ID = os.getenv("FEISHU_APP_ID", "cli_a9086bb17b785cef")
    FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET", "")
    FEISHU_WEBHOOK_SECRET = os.getenv("FEISHU_WEBHOOK_SECRET", "")
    
    # 用户配置
    MY_USER_ID = os.getenv("MY_USER_ID", "ou_a795353f084e446e25c7074e04482728")
    
    # Bitable配置
    BITABLE_APP_TOKEN = os.getenv("BITABLE_APP_TOKEN", "E110bkV0PaGqCLsMPQfc5ElPnEf")
    BITABLE_TABLE_ID = os.getenv("BITABLE_TABLE_ID", "tblzRgolt6NuKcxo")
    
    # 服务器配置
    PORT = int(os.getenv("PORT", 8000))
    HOST = os.getenv("HOST", "0.0.0.0")
    
    # 内部API密钥
    INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "change-this-secret-key")

settings = Settings()