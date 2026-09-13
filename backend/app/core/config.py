"""
核心配置模块 (Config)
---------------------
【前端概念类比】：
类似于前端项目中的 `src/config/env.ts` 或者 Vite 的 `import.meta.env`。
不同的是，Python 这里使用了 Pydantic 的 `BaseSettings`，不仅能自动读取 `.env` 文件，
还会自动校验每个变量的类型（字符串、数字、布尔值等），类型不对会在启动时立即抛出清晰的错误。
"""

import os
from pydantic_settings import BaseSettings

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

class Settings(BaseSettings):
    # 项目基本信息
    PROJECT_NAME: str = "AI 智能网页研报速读助手"
    API_V1_STR: str = "/api"
    
    # 大模型服务配置 (默认支持 DeepSeek / 任何兼容 OpenAI 格式的接口)
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.deepseek.com/v1"
    MODEL_NAME: str = "deepseek-chat"

    # 数据库路径 (SQLite 单文件，零运维)
    DATABASE_URL: str = "sqlite:///./ai_reader.db"

    class Config:
        # 支持同时读取 .env 和 .env.local，兼顾根目录或 backend 目录运行
        env_file = (
            os.path.join(backend_dir, ".env"),
            os.path.join(backend_dir, ".env.local"),
            ".env",
            ".env.local"
        )
        env_file_encoding = "utf-8"
        extra = "ignore"

# 导出一个全局单例配置对象，供整个应用直接 import 使用
settings = Settings()
