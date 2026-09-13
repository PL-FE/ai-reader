"""
知模 (ZhiMoHub) 3D 资产管理与智能检索 API
------------------------------------------
提供高并发模型检索、参数过滤、相似模型聚合、多文件上传与 NAS 目录扫盘。
"""

import os
import shutil
import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlmodel import Session, select, or_, and_, col

from app.core.db import get_session
from app.models.asset import ModelAsset
from app.services.skp_parser import SKPParser
from app.services.classifier import ModelClassifier
from app.services.vision_classifier import VisionClassifier

router = APIRouter(prefix="/assets", tags=["知模 3D 资产管理"])

# 存放缩略图与模型源文件的服务器本地物理路径
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
THUMBNAIL_DIR = os.path.join(BACKEND_DIR, "thumbnails")
STORAGE_DIR = os.path.join(BACKEND_DIR, "storage", "models")
UPLOADS_DIR = os.path.join(BACKEND_DIR, "uploads")

os.makedirs(THUMBNAIL_DIR, exist_ok=True)
os.makedirs(STORAGE_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# 确保有默认占位缩略图
default_thumb = os.path.join(THUMBNAIL_DIR, "default_model.png")
if not os.path.exists(default_thumb):
    # 生成一个简单的 PNG 占位图
    pass

@router.get("/categories", summary="获取分类及模型数量统计 (支持完全动态分类)")
def get_categories(session: Session = Depends(get_session)):
    """获取所有分类及其下的资产统计，支持风景园林核心分类 + AI 动态衍生分类 + 兜底'其他'"""
    assets = session.exec(select(ModelAsset)).all()
    total_count = len(assets)

    counts = {}
    for a in assets:
        counts[a.category] = counts.get(a.category, 0) + 1

    category_list = [{"name": "全部模型", "count": total_count, "key": "all"}]
    
    # 1. 先加入预设的景观园林核心分类
    seen_cats = set()
    for cat_name in ModelClassifier.CATEGORY_RULES.keys():
        category_list.append({
            "name": cat_name,
            "count": counts.get(cat_name, 0),
            "key": cat_name
        })
        seen_cats.add(cat_name)

    # 2. 动态追加数据库中由 AI 新归纳出的扩展分类（非预设且非'其他'）
    for cat_name, cnt in counts.items():
        if cat_name not in seen_cats and cat_name != "其他":
            category_list.append({
                "name": cat_name,
                "count": cnt,
                "key": cat_name
            })
            seen_cats.add(cat_name)

    # 3. 兜底分类“其他”，始终保证在分类末尾供筛选
    category_list.append({
        "name": "其他",
        "count": counts.get("其他", 0),
        "key": "其他"
    })

    return category_list

@router.get("/search", summary="多维智能检索与参数过滤")
def search_assets(
    q: Optional[str] = Query(default=None, description="搜索关键词（标题/文件名/构件/标签）"),
    category: Optional[str] = Query(default=None, description="一级分类"),
    su_version: Optional[str] = Query(default=None, description="SketchUp 版本筛选"),
    min_width: Optional[int] = Query(default=None, description="最小宽度 (mm)"),
    max_width: Optional[int] = Query(default=None, description="最大宽度 (mm)"),
    min_height: Optional[int] = Query(default=None, description="最小高度 (mm)"),
    max_height: Optional[int] = Query(default=None, description="最大高度 (mm)"),
    sort_by: str = Query(default="newest", description="排序方式: newest, views, size"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """
    复合检索接口：支持关键词模糊搜索 + 空间尺寸过滤 + 版本过滤
    """
    # 兼容直接函数调用的参数提取
    q_str = str(q).strip() if (q is not None and not hasattr(q, "default")) else None
    cat_str = str(category).strip() if (category is not None and not hasattr(category, "default")) else None
    ver_str = str(su_version).strip() if (su_version is not None and not hasattr(su_version, "default")) else None
    sort_str = str(sort_by).strip() if not hasattr(sort_by, "default") else "newest"
    min_w = min_width if not hasattr(min_width, "default") else None
    max_w = max_width if not hasattr(max_width, "default") else None
    min_h = min_height if not hasattr(min_height, "default") else None
    max_h = max_height if not hasattr(max_height, "default") else None
    page_num = page if isinstance(page, int) else 1
    limit_num = limit if isinstance(limit, int) else 24

    statement = select(ModelAsset)

    # 1. 分类过滤
    if cat_str and cat_str != "all" and cat_str != "全部模型":
        statement = statement.where(ModelAsset.category == cat_str)

    # 2. 版本过滤
    if ver_str and ver_str != "all":
        statement = statement.where(ModelAsset.su_version == ver_str)

    # 3. 尺寸范围过滤 (宽与高)
    if min_w is not None:
        statement = statement.where(ModelAsset.width_mm >= min_w)
    if max_w is not None:
        statement = statement.where(ModelAsset.width_mm <= max_w)
    if min_h is not None:
        statement = statement.where(ModelAsset.height_mm >= min_h)
    if max_h is not None:
        statement = statement.where(ModelAsset.height_mm <= max_h)

    # 4. 关键词搜索 (标题、文件名、组件、标签)
    if q_str:
        search_kw = f"%{q_str}%"
        statement = statement.where(
            or_(
                ModelAsset.title.like(search_kw),
                ModelAsset.filename.like(search_kw),
                ModelAsset.components_json.like(search_kw),
                ModelAsset.tags_json.like(search_kw)
            )
        )

    # 5. 排序规则
    if sort_str == "views":
        statement = statement.order_by(col(ModelAsset.views_count).desc())
    elif sort_str == "size":
        statement = statement.order_by(col(ModelAsset.file_size).desc())
    else:
        statement = statement.order_by(col(ModelAsset.created_at).desc())

    # 执行查询
    all_matched = session.exec(statement).all()
    total = len(all_matched)

    # 分页切片
    start = (page_num - 1) * limit_num
    paged_items = all_matched[start : start + limit_num]

    results = []
    for item in paged_items:
        results.append({
            "id": item.id,
            "title": item.title or item.filename,
            "filename": item.filename,
            "file_size_display": item.file_size_display,
            "su_version": item.su_version,
            "thumbnail_url": item.thumbnail_url,
            "category": item.category,
            "tags": item.tags,
            "dimensions": {
                "width": item.width_mm,
                "depth": item.depth_mm,
                "height": item.height_mm,
                "display": f"W:{item.width_mm} D:{item.depth_mm} H:{item.height_mm} mm"
            },
            "specs": {
                "style": item.style or "现代简约",
                "faces_count": item.faces_count or "1.2万",
                "file_size": item.file_size_display,
                "textures_count": item.textures_count or 0,
                "texture_replaceable": "支持" if item.texture_replaceable else "否",
                "components_count": item.components_count or 1,
                "scenes_count": item.scenes_count or 1,
                "created_at": item.created_at.strftime("%Y/%m/%d")
            },
            "components": item.components,
            "views_count": item.views_count,
            "downloads_count": item.downloads_count,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return {
        "items": results,
        "total": total,
        "page": page_num,
        "limit": limit_num,
        "total_pages": (total + limit_num - 1) // limit_num if limit_num > 0 else 1
    }

@router.get("/{asset_id}", summary="获取模型详情并累加浏览量")
def get_asset_detail(asset_id: str, session: Session = Depends(get_session)):
    asset = session.get(ModelAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="模型不存在")
    
    asset.views_count += 1
    session.add(asset)
    session.commit()
    session.refresh(asset)

    return {
        "id": asset.id,
        "title": asset.title or asset.filename,
        "filename": asset.filename,
        "file_path": asset.file_path,
        "file_size_display": asset.file_size_display,
        "su_version": asset.su_version,
        "thumbnail_url": asset.thumbnail_url,
        "category": asset.category,
        "tags": asset.tags,
        "dimensions": {
            "width": asset.width_mm,
            "depth": asset.depth_mm,
            "height": asset.height_mm,
            "display": f"W:{asset.width_mm} × D:{asset.depth_mm} × H:{asset.height_mm} mm"
        },
        "specs": {
            "style": asset.style or "现代简约",
            "faces_count": asset.faces_count or "1.2万",
            "file_size": asset.file_size_display,
            "textures_count": asset.textures_count or 0,
            "texture_replaceable": "支持" if asset.texture_replaceable else "否",
            "components_count": asset.components_count or 1,
            "scenes_count": asset.scenes_count or 1,
            "created_at": asset.created_at.strftime("%Y/%m/%d")
        },
        "components": asset.components,
        "views_count": asset.views_count,
        "downloads_count": asset.downloads_count,
        "created_at": asset.created_at.strftime("%Y-%m-%d %H:%M")
    }

@router.get("/{asset_id}/similar", summary="根据三维空间比例与构件语义查找相似模型")
def get_similar_models(asset_id: str, limit: int = 6, session: Session = Depends(get_session)):
    """
    核心特色：自动识别当前模型特征，从库中聚类最相似的款式
    """
    target = session.get(ModelAsset, asset_id)
    if not target:
        raise HTTPException(status_code=404, detail="模型不存在")

    target_dict = {
        "id": target.id,
        "category": target.category,
        "tags": target.tags,
        "width_mm": target.width_mm,
        "depth_mm": target.depth_mm,
        "height_mm": target.height_mm
    }

    # 取出同分类及全库候选者
    candidates = session.exec(select(ModelAsset).where(ModelAsset.id != asset_id)).all()
    
    scored_candidates = []
    for cand in candidates:
        cand_dict = {
            "id": cand.id,
            "category": cand.category,
            "tags": cand.tags,
            "width_mm": cand.width_mm,
            "depth_mm": cand.depth_mm,
            "height_mm": cand.height_mm
        }
        score = ModelClassifier.calculate_similarity(target_dict, cand_dict)
        scored_candidates.append((score, cand))

    # 按相似度高到低排序
    scored_candidates.sort(key=lambda x: x[0], reverse=True)
    top_similar = scored_candidates[:limit]

    results = []
    for score, item in top_similar:
        results.append({
            "id": item.id,
            "title": item.title or item.filename,
            "thumbnail_url": item.thumbnail_url,
            "category": item.category,
            "su_version": item.su_version,
            "similarity_score": f"{int(score * 100)}%",
            "dimensions": f"{item.width_mm}×{item.depth_mm}×{item.height_mm}"
        })

    return results

@router.post("/upload", summary="网页端批量拖拽上传 .skp 模型并自动保存在服务器本地分类目录")
async def upload_skp_files(
    files: List[UploadFile] = File(...),
    session: Session = Depends(get_session)
):
    """
    支持设计师直接把 .skp 模型拖拽进网页，后台自动极速提取缩略图与版本，并按智能分类归档存入服务器本地存储
    """
    saved_assets = []

    for file in files:
        if not file.filename.lower().endswith(".skp"):
            continue

        temp_path = os.path.join(UPLOADS_DIR, file.filename)
        # 保存临时文件供解析
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 调用核心解析引擎
        parsed = SKPParser.parse_file(temp_path, THUMBNAIL_DIR)
        
        # 视觉多模态分析：针对提取出的缩略图进行纯本地看图识物 (OCR文字 + 颜色风格)
        thumb_physical_path = os.path.join(BACKEND_DIR, parsed["thumbnail_url"].lstrip("/"))
        vision_data = VisionClassifier.analyze_image(thumb_physical_path)
        
        # 将视觉检测到的关键词合并到语义词库中
        combined_keywords = parsed["raw_keywords"] + vision_data.get("visual_keywords", [])

        # 构造全部可用多模态元数据
        meta_info = {
            "detected_texts": vision_data.get("detected_texts", []),
            "color_style": vision_data.get("color_style", "现代简约"),
            "width_mm": parsed.get("width_mm", 0),
            "depth_mm": parsed.get("depth_mm", 0),
            "height_mm": parsed.get("height_mm", 0),
            "faces_count": parsed.get("faces_count", "1.2万")
        }

        # 智能三级动态分类引擎 (规则初筛 -> AI多模态问答 -> 兜底其他)
        category, tags = ModelClassifier.classify(
            filename=parsed["filename"],
            components=parsed["components"],
            raw_keywords=combined_keywords,
            metadata=meta_info
        )

        # 按照分类在服务器存储中归档
        cat_dir = os.path.join(STORAGE_DIR, category)
        os.makedirs(cat_dir, exist_ok=True)
        final_file_path = os.path.join(cat_dir, file.filename)
        shutil.move(temp_path, final_file_path)

        # 智能生成标题：若文件名是盲名（纯数字、未命名、新建），优先使用视觉识别标题！
        base_name = os.path.splitext(parsed["filename"])[0]
        if (base_name.isdigit() or len(base_name) <= 2 or "新建" in base_name) and vision_data.get("suggested_title"):
            title = f"{vision_data['suggested_title']}"
        else:
            title = base_name

        asset = ModelAsset(
            filename=parsed["filename"],
            title=title,
            file_path=final_file_path,
            file_size=parsed["file_size"],
            su_version=parsed["su_version"],
            thumbnail_url=parsed["thumbnail_url"],
            width_mm=parsed["width_mm"],
            depth_mm=parsed["depth_mm"],
            height_mm=parsed["height_mm"],
            style=vision_data.get("color_style") if parsed.get("style") == "现代简约" else parsed.get("style", "现代简约"),
            faces_count=parsed.get("faces_count", "1.2万"),
            textures_count=parsed.get("textures_count", 0),
            texture_replaceable=parsed.get("texture_replaceable", True),
            components_count=parsed.get("components_count", 1),
            scenes_count=parsed.get("scenes_count", 1),
            category=category,
            tags_json=json.dumps(tags, ensure_ascii=False),
            components_json=json.dumps(parsed["components"], ensure_ascii=False)
        )

        session.add(asset)
        saved_assets.append(asset)

    session.commit()
    return {"message": f"成功入库并归档至服务器 {len(saved_assets)} 个模型", "count": len(saved_assets)}

@router.post("/scan", summary="指定服务器本地模型目录全盘扫描建立索引")
def scan_server_directory(
    folder_path: str = Form(..., description="服务器本地模型文件夹绝对路径或挂载路径"),
    session: Session = Depends(get_session)
):
    """
    针对服务器本地磁盘或外部挂载盘的存量资产，递归扫描所有 .skp 文件并自动建立索引与缩略图
    """
    if not os.path.exists(folder_path):
        raise HTTPException(status_code=400, detail=f"指定路径不存在: {folder_path}")

    indexed_count = 0
    for root, _, files in os.walk(folder_path):
        for f in files:
            if f.lower().endswith(".skp") and not f.startswith("._"):
                skp_path = os.path.join(root, f)
                # 检查是否已入库
                existing = session.exec(select(ModelAsset).where(ModelAsset.file_path == skp_path)).first()
                if existing:
                    continue

                try:
                    parsed = SKPParser.parse_file(skp_path, THUMBNAIL_DIR)
                    thumb_physical_path = os.path.join(BACKEND_DIR, parsed["thumbnail_url"].lstrip("/"))
                    vision_data = VisionClassifier.analyze_image(thumb_physical_path)
                    combined_keywords = parsed["raw_keywords"] + vision_data.get("visual_keywords", [])

                    meta_info = {
                        "detected_texts": vision_data.get("detected_texts", []),
                        "color_style": vision_data.get("color_style", "现代简约"),
                        "width_mm": parsed.get("width_mm", 0),
                        "depth_mm": parsed.get("depth_mm", 0),
                        "height_mm": parsed.get("height_mm", 0),
                        "faces_count": parsed.get("faces_count", "1.2万")
                    }

                    category, tags = ModelClassifier.classify(
                        filename=parsed["filename"],
                        components=parsed["components"],
                        raw_keywords=combined_keywords,
                        metadata=meta_info
                    )
                    
                    base_name = os.path.splitext(parsed["filename"])[0]
                    if (base_name.isdigit() or len(base_name) <= 2 or "新建" in base_name) and vision_data.get("suggested_title"):
                        title = f"{vision_data['suggested_title']}"
                    else:
                        title = base_name

                    asset = ModelAsset(
                        filename=parsed["filename"],
                        title=title,
                        file_path=parsed["file_path"],
                        file_size=parsed["file_size"],
                        su_version=parsed["su_version"],
                        thumbnail_url=parsed["thumbnail_url"],
                        width_mm=parsed["width_mm"],
                        depth_mm=parsed["depth_mm"],
                        height_mm=parsed["height_mm"],
                        style=vision_data.get("color_style") if parsed.get("style") == "现代简约" else parsed.get("style", "现代简约"),
                        faces_count=parsed.get("faces_count", "1.2万"),
                        textures_count=parsed.get("textures_count", 0),
                        texture_replaceable=parsed.get("texture_replaceable", True),
                        components_count=parsed.get("components_count", 1),
                        scenes_count=parsed.get("scenes_count", 1),
                        category=category,
                        tags_json=json.dumps(tags, ensure_ascii=False),
                        components_json=json.dumps(parsed["components"], ensure_ascii=False)
                    )
                    session.add(asset)
                    indexed_count += 1
                except Exception as e:
                    print(f"解析文件失败 {skp_path}: {e}")
                    continue

    session.commit()
    return {"message": f"扫盘完成，新增建立索引 {indexed_count} 个模型", "indexed_count": indexed_count}

@router.get("/{asset_id}/download", summary="下载 .skp 原始源文件")
def download_asset_file(asset_id: str, session: Session = Depends(get_session)):
    asset = session.get(ModelAsset, asset_id)
    if not asset or not os.path.exists(asset.file_path):
        raise HTTPException(status_code=404, detail="物理文件不存在")

    asset.downloads_count += 1
    session.add(asset)
    session.commit()

    return FileResponse(
        path=asset.file_path,
        filename=asset.filename,
        media_type="application/octet-stream"
    )


