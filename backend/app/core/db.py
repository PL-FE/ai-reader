"""
数据库连接与会话管理
-------------------
基于 SQLModel 的 SQLite 轻量数据库会话管理。
"""

import os
from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# 确保数据库文件存储在 backend 目录下
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "zhimo_assets.db"))
DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

def init_db():
    """
    初始化数据库表结构
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    FastAPI 依赖注入：获取数据库会话
    """
    with Session(engine) as session:
        yield session
