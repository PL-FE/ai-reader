# ==============================================================================
# 知模 (ZhiMoHub) 生产环境多阶段 Dockerfile
# ==============================================================================
# 阶段 1: 前端静态资源构建 (Node.js)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# 安装依赖
COPY frontend/package.json ./
RUN npm install

# 构建生产产物 (输出至 backend/static)
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# 阶段 2: Python 全栈统一托管运行时 (Python 3.11 Slim)
FROM python:3.11-slim AS runner
WORKDIR /app

# 设置环境变量，避免 Python 缓冲与生成无用 pyc
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai

# 安装基础依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tzdata \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端核心代码
COPY backend/app/ ./app/
COPY backend/static/ ./static/

# 从前端构建阶段复制最新产物（确保静态托管完全同步）
COPY --from=frontend-builder /app/backend/static/ ./static/

# 预创建模型存储目录与缩略图目录
RUN mkdir -p /app/storage/models /app/thumbnails /app/uploads

# 暴露单端口服务
EXPOSE 8000

# 启动 FastAPI 服务
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
