# 🧠 AI 智能网页研报速读助手 (AI Reader)

> 🚀 **专为前端工程师进阶 AI 全栈打造的实战示范项目**  
> Modern React 19 + Python FastAPI + 流式 SSE + 多轮研报智能对话 + 单端口一键极简托管

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 项目简介

**AI 智能网页研报速读助手** 是一款面向现代开发者的长文研报提炼与上下文问答工具。只需输入任意技术博客、行业分析或研报文章的 URL，系统即可自动抽取正文正文并过滤广告杂质，基于大语言模型（LLM）实现**流式生成核心要点总结**，并通过现代化对话界面对研报细节展开**多轮深度追问**。

本项目严格遵循 **“开发即教程，步步皆沉淀”** 的理念，代码中包含大量**前后端概念降维类比**注释，是前端工程师平滑转型 AI 全栈开发（AI Engineer）的开箱即用学习级模版。

---

## ✨ 核心特性

- ⚡ **URL 一键精准抽取**：基于 Trafilatura 网页提取算法，自动剔除导航、侧边栏及广告噪声，秒级还原纯净正文与元信息。
- 🌊 **毫秒级 SSE 流式打字机**：利用 Server-Sent Events (`text/event-stream`) 协议，告别漫长等待，服务端逐字推送大模型分析洞见。
- 💬 **沉浸式上下文多轮对话**：深度集成现代 `@assistant-ui/react` 交互体系，AI 结合当前研报背景提供精准解答。
- 🎨 **现代化极致 UI 美学**：采用 React 19 + TypeScript + Tailwind CSS v4 构建，支持 GFM Markdown 语法、代码高亮与动态流式呈现。
- 🚀 **单端口全栈极简托管**：FastAPI 直接托管编译后的前端 SPA 产物，`./start.sh` 脚本一键启动全栈服务，彻底告别跨端口地狱。
- 🔒 **企业级密钥安全隔离**：所有大模型 API Key 均由后端 `.env` 严格保护，前端绝不暴露任何机密凭据；内置无 Key 离线拟真回退机制。

---

## 🗺️ 前后端概念对照表（前端同学友好指南）

| 后端 / AI 概念 | 前端工程师熟悉的概念 | 通俗通晓的一句话解释 |
| :--- | :--- | :--- |
| **Python venv** | `node_modules` 文件夹 | 隔离每个项目的依赖包，防止全局版本冲突。 |
| **FastAPI** | Express / Koa / Next.js Route Handlers | 轻量、现代、带自动化 OpenAPI 文档的高性能后端框架。 |
| **Pydantic** | TypeScript interface + Zod Schema | 入参出参的强类型约束契约，字段校验失败自动拦截报错。 |
| **SSE (Server-Sent Events)** | `ReadableStream` / EventSource | 单向长链接通道，大模型打字机流式输出的功臣。 |
| **SQLModel (ORM)** | Prisma / Drizzle / TypeORM | 用对象定义代替手写原生 SQL，优雅操作数据库。 |
| **ChromaDB (向量库)** | 语义特征向量缓存池 | 把文字转化为坐标数组（Embedding），通过余弦距离检索最相似内容。 |

---

## 🛠️ 技术架构

```text
ai-reader/
├── backend/                  # 🐍 Python FastAPI 后端
│   ├── app/
│   │   ├── api/              # 路由层 (类似 Express router / Next.js app/api)
│   │   │   └── reader.py     # 提取文章、流式总结、多轮对话接口
│   │   ├── core/             # 核心配置 (Pydantic BaseSettings 读取 .env)
│   │   │   └── config.py
│   │   └── services/         # 业务服务层
│   │       ├── extractor.py  # 网页正文抓取与清洗服务 (Trafilatura)
│   │       └── llm.py        # 大模型流式调用与兜底模拟生成
│   ├── requirements.txt      # 后端依赖清单
│   └── .env.example          # 环境变量示例模版
│
├── frontend/                 # ⚛️ React 19 前端应用
│   ├── src/
│   │   ├── components/       # 业务组件 (阅读器、对话框、Markdown 渲染)
│   │   ├── App.tsx           # 主页面布局与状态编排
│   │   └── main.tsx          # 前端入口
│   ├── package.json          # 前端依赖配置 (Vite + React 19 + Tailwind v4)
│   └── vite.config.ts        # Vite 打包配置 (自动输出至 backend/static)
│
├── docs/                     # 📚 系列实战教程文档
│   └── 01-前端转型AI全栈-项目初始化与流式MVP.md
├── start.sh                  # 🚀 一键编译前端并启动全栈脚本
└── README.md
```

---

## 🚀 快速开始

### 1. 环境准备

确保您的本地环境中已安装：
- **Node.js**: >= 18.0.0
- **pnpm**: 推荐（或 npm / yarn）
- **Python**: >= 3.10

### 2. 配置环境变量

进入 `backend` 目录，复制环境变量模版并填入您的大模型 API Key：

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env` 文件：

```env
# 填入您的真实 API Key (支持 DeepSeek, OpenAI, Kimi, 智谱等兼容接口)
# 若留空，系统会自动启用高质量的本地流式拟真演示模式
OPENAI_API_KEY=sk-your-key-here

# API 地址 (默认使用高性价比的 DeepSeek)
OPENAI_BASE_URL=https://api.deepseek.com/v1

# 模型名称
MODEL_NAME=deepseek-chat
```

### 3. 一键全栈启动（生产级单端口托管模式）

在项目根目录下，直接运行一键脚本：

```bash
chmod +x start.sh
./start.sh
```

该脚本将自动：
1. 编译打包 React 前端并直接输出至后端的 `backend/static` 目录；
2. 检查并自动创建 Python 虚拟环境，补齐依赖包；
3. 检查端口占用并启动统一托管服务；
4. 浏览器访问 **`http://127.0.0.1:8000`** 即可开始使用！

---

## 💻 研发调试模式（前端热重载）

如果您需要对前端界面或组件进行频繁调整，建议开启前后端分离的热重载开发模式：

### 启动后端 API 服务：

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 启动前端 Vite 开发服务器：

```bash
cd frontend
pnpm install
pnpm run dev
```

前端将在 `http://localhost:5173` 启动，享受 Vite 8 毫秒级的热更新（HMR）。

---

## 📚 沉淀教程连载

本项目附带专门针对前端开发者的 AI 全栈进阶系列实战教程：

- 📖 **[教程 01：前端转型 AI 全栈（一）：现代 React + Python FastAPI 双层架构与单端口托管 MVP](docs/01-前端转型AI全栈-项目初始化与流式MVP.md)**
- ⏳ **教程 02**：让数据落地——用 SQLModel + SQLite 打造零运维文章知识库（即将推出）
- ⏳ **教程 03**：搞懂 RAG——接入 ChromaDB 向量数据库实现跨文章语义检索（规划中）
- ⏳ **教程 04**：极致交互体验——划词提问、原文精准回溯与一键容器化部署（规划中）

---

## 📄 开源许可证

本项目基于 [MIT](LICENSE) 许可证开源，欢迎自由学习、演进与用于个人项目。
