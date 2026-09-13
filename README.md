# 知模 (ZhiMoHub) —— 团队级 SketchUp 3D 资产智能检索与管理平台

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue.svg" alt="Python Version" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688.svg" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19.2+-61DAFB.svg" alt="React" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Database-SQLite%20%2F%20SQLModel-4169E1.svg" alt="SQLModel" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

> **知模 (ZhiMoHub)** 是一款专为风景园林设计院、城市规划机构与公园景观团队打造的 **SketchUp (.skp) 3D 资产私有化智能检索与管理系统**。  
> 参考知名 3D 资产平台“知末 (`su.znzmo.com`)”的高效交互体验，具备**毫秒级无头提取内嵌缩略图**、**SketchUp 2018~2026 全版本精准识别**、**空间三维尺寸过滤**、**景观智能语义自动分类**与**相似模型空间比例聚类**能力。

---

## 🎯 解决的核心痛点

1. **摆脱“黑盒找模型”**：海量景观植物、小品设施 `.skp` 文件存放在服务器或电脑中，免装 SketchUp 即可通过网页秒看真实视口高清缩略图。
2. **防踩版本不兼容坑**：精准识别 SketchUp 2026/2024/2023/2022/2021 等全版本（支持 UTF-16LE 文件头与 ZIP 容器原生解构），低版本客户端快速筛选可用模型。
3. **尺寸精准匹配**：支持长宽高（X/Y/Z）物理空间包围盒滑动筛选，找景观乔木、小品构件再也不会尺寸比例失调。
4. **风景园林专业分类与找相似**：基于文件名、构件名及三维比例（长宽深比），自动归入园林植物与绿化、街景设施与城市家具、公园小品与构筑物、景观雕塑、商业外摆等专业品类，一键查找形态相似款。

---

## 🏗️ 全栈技术架构

```mermaid
graph TD
    A[设计师 / 团队成员 Web 端 (React 19 + TailwindCSS v4)] -->|拖拽上传 .skp / 复合多维检索| B[FastAPI 高性能服务网关]
    DIR[服务器本地磁盘模型目录] -->|递归扫描索引| B
    
    B --> C[SKP 二进制无头解析引擎]
    C --> C1[版本识别: UTF-16LE 精准解析 SketchUp 2018~2026]
    C --> C2[缩略图抽取: ZIP 容器 / PNG 魔数毫秒级抽取原生原图]
    C --> C3[智能分类器: 语义规则 + 空间三维比例相似度聚类]
    
    C --> D[(SQLite + SQLModel 核心元数据库)]
    C2 --> E[服务器本地缩略图静态缓存 (thumbnails/)]
    C --> F[服务器本地模型分类存储归档 (storage/models/)]
```

- **后端体系**：Python 3.11 + FastAPI + SQLModel (SQLite 零运维单文件存储) + 纯 Python 二进制流解析。
- **前端体系**：React 19 + Vite + TailwindCSS v4 + Lucide-react 图标库。
- **架构亮点**：**单端口极简托管** —— React 打包产物直接由 FastAPI 进行静态资源托管与 SPA 兜底，启动一个 Python 进程即可服务整个局域网团队。

---

## 🚀 极速启动指南

### 1. 环境准备
- Python 3.11+
- Node.js 18+ 与 pnpm / npm

### 2. 一键启动全栈服务 (本地开发/单机运行)
项目根目录下提供了全自动化的一键编译与启动脚本：

```bash
chmod +x ./start.sh
./start.sh
```

脚本将自动完成：
1. 编译前端生产静态资源并输出至后端 `backend/static/` 目录；
2. 自动安装 Python 虚拟环境与依赖包；
3. 清理并释放 8000 端口，拉起全栈服务。

打开浏览器访问：**`http://127.0.0.1:8000`** 即可使用！

---

## 🐳 Docker 容器化一键部署 (团队推荐)

由于知模采用**单端口统一托管架构**，无需配置反向代理或复杂的多个容器，一个标准的轻量容器即可运行全部功能！

### 快速拉起 (docker-compose)
在项目根目录下直接执行：

```bash
# 后台构建并启动知模全栈服务
docker compose up -d --build
```

### 数据持久化保障
`docker-compose.yml` 已经默认配置了宿主机数据卷挂载：
- `./backend/storage`: 持久化存储模型物理 `.skp` 文件（按分类自动归档，容器销毁升级资产永不丢失）；
- `./backend/thumbnails`: 持久化存储提取的原生缩略图缓存；
- `./backend/zhimo_assets.db`: 持久化存储 SQLite 资产元数据库。

查看容器运行状态：
```bash
docker compose ps
docker compose logs -f
```
访问地址：`http://服务器IP:8000`

---

## 📂 核心目录结构说明

```
ai-reader/ (知模 ZhiMoHub)
├── start.sh                       # 一键全栈编译与启动脚本
├── README.md                      # 项目说明文档
├── AGENTS.md                      # AI 协作规范与架构指引
├── backend/                       # Python FastAPI 后端
│   ├── app/
│   │   ├── api/
│   │   │   └── assets.py          # 3D 资产管理核心路由（检索/上传/扫盘/找相似）
│   │   ├── core/
│   │   │   ├── config.py          # 全局配置 (Pydantic Settings)
│   │   │   └── db.py              # 数据库连接与 Session 管理
│   │   ├── models/
│   │   │   └── asset.py           # ModelAsset 核心数据模型
│   │   ├── services/
│   │   │   ├── skp_parser.py      # SKP 二进制解析与缩略图提取器 (支持SU 2026)
│   │   │   └── classifier.py      # 智能自动分类与空间相似度打分算法
│   │   └── main.py                # FastAPI 入口与单端口静态托管
│   ├── storage/models/            # 服务器本地模型分类归档存储
│   ├── thumbnails/                # 提取出的缩略图缓存目录
│   └── requirements.txt           # Python 依赖清单
├── frontend/                      # React 19 前端工程
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx         # 顶部品牌导航与搜索框
│   │   │   ├── CategoryBar.tsx    # 品类胶囊栏与版本/尺寸多维过滤器
│   │   │   ├── AssetCard.tsx      # 高质感模型卡片（尺寸胶囊/找相似/复制直链）
│   │   │   ├── AssetDetailModal.tsx # 详情弹窗与相似款推荐流
│   │   │   ├── UploadModal.tsx    # 拖拽上传弹窗
│   │   │   └── ScanModal.tsx      # 服务器本地目录扫盘弹窗
│   │   ├── services/api.ts        # 前端 API 交互服务
│   │   └── App.tsx                # 主看板页面
└── docs/                          # 连载实战技术教程
```

---

## 🔌 核心 API 概览

| 请求方法 | 路径 | 功能说明 |
| :--- | :--- | :--- |
| `GET` | `/api/assets/search` | 多维复合检索（支持关键词、分类、SU版本、长宽高过滤、排序） |
| `GET` | `/api/assets/categories` | 获取品类列表及各分类下的模型数量统计 |
| `GET` | `/api/assets/{id}` | 获取单个模型详情（尺寸/构件/材质），累加浏览量 |
| `GET` | `/api/assets/{id}/similar`| **智能相似模型推荐**（基于三维长宽深比与语义匹配） |
| `GET` | `/api/assets/{id}/download`| 一键下载原始 `.skp` 3D 模型物理文件 |
| `POST`| `/api/assets/upload` | 网页端拖拽上传 `.skp` 模型，毫秒级提取缩略图并按分类归档入库 |
| `POST`| `/api/assets/scan` | 指定服务器本地物理文件夹全盘扫描建立索引 |

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
