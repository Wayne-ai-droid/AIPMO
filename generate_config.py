#!/usr/bin/env python3
"""
生成前端配置文件
从 .env 读取配置，生成 frontend/config.json
"""
import os
import json
from dotenv import load_dotenv

def generate_config():
    # 加载环境变量
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
    
    # 读取配置
    config = {
        "API_BASE_URL": os.getenv('FRONTEND_API_BASE_URL', 'http://localhost:8000'),
        "USER_ID": os.getenv('FRONTEND_USER_ID', ''),
        "DAYS": int(os.getenv('FRONTEND_DAYS', '7'))
    }
    
    # 写入前端配置文件
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    config_path = os.path.join(frontend_dir, 'config.json')
    
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"✅ 前端配置文件已生成: {config_path}")
    print(f"   API_BASE_URL: {config['API_BASE_URL']}")
    print(f"   USER_ID: {config['USER_ID']}")
    print(f"   DAYS: {config['DAYS']}")

if __name__ == '__main__':
    generate_config()