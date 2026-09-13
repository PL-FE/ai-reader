#!/bin/bash

# ==============================================================================
# AI 智能网页研报速读助手 —— 一键全栈启动脚本
# ==============================================================================

set -e

echo "🚀 [1/3] 正在使用 pnpm 编译前端资源并输出至后端静态目录..."
cd frontend
pnpm run build
cd ..

echo "⚡ [2/3] 检查 Python 虚拟环境与依赖..."
if [ ! -d "backend/venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv backend/venv
    ./backend/venv/bin/pip install -r backend/requirements.txt
fi

PORT=8000
echo "🌟 [3/3] 检查并启动统一托管服务 (端口: ${PORT})..."

# 检查端口是否被占用，若占用则自动 kill 旧进程
PIDS=$(lsof -ti:${PORT} 2>/dev/null || true)
if [ -n "$PIDS" ]; then
    echo "⚠️ 检测到端口 ${PORT} 已被占用 (PID: ${PIDS})，正在终止旧进程以释放端口..."
    kill -9 $PIDS 2>/dev/null || true
    sleep 1
fi

echo "👉 打开浏览器访问: http://127.0.0.1:${PORT}"
exec ./backend/venv/bin/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port ${PORT} --reload
