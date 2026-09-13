"""
FastAPI 主入口程序 (Main Application)
-------------------------------------
【前端概念类比】：
类似于前端主入口 `main.tsx`，在这里完成整个应用的初始化、中间件挂载、路由注册，
以及【核心功能】：将前端打包生成的 HTML/JS/CSS 静态资源统一托管在此服务中！
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.reader import router as reader_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="面向现代前端全栈学习者的 AI 网页研报速读与知识库系统",
    version="1.0.0",
)

# 1. 配置 CORS 跨域（方便前端在 Vite 开发环境 5173 端口调试）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 注册核心业务路由
app.include_router(reader_router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["基础监控"])
async def health_check():
    """基础健康检查接口（类似心跳检测）"""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "mode": "development" if not os.path.exists("static/index.html") else "production-hosted"
    }

# 3. 核心：统一静态资源托管（把 React 打包产物无缝托管到 Python）
# 如果 static 目录存在，挂载静态文件
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.exists(static_dir):
    # 挂载 assets 静态资源（js, css, 图片等）
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # SPA 路由兜底：非 API 请求全部返回 index.html
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            # 防止 API 404 被误重定向到页面
            return {"error": "API Not Found"}
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "前端资源尚未打包，请在 frontend/ 运行 npm run build 生成静态文件"}
