"""
知模 (ZhiMoHub) 智能分类与相似模型匹配引擎
------------------------------------------
1. 自动语义分类：根据文件名、内嵌组件名与空间特征，自动归入知末体系一级分类与二级标签。
2. 相似模型匹配：基于品类契合度、三维比例（长宽深比）、关键词重合度计算相似度。
"""

import os
import json
import re
import math
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings

class ModelClassifier:
    """
    模型分类与语义打标器（参考知末 su.znzmo.com 标准设计资产分类）
    """
    
    # 核心风景园林、街景公园分类与触发关键词映射表
    CATEGORY_RULES = {
        "园林植物与绿化": {
            "keywords": ["植物", "树木", "乔木", "灌木", "绿篱", "草坪", "草地", "盆景", "花境", "花卉", "竹林", "水生植物", "行道树", "绿化", "古树", "plant", "tree", "flower", "shrub", "garden", "green"],
            "subtags": ["大型乔木", "常绿灌木", "四季花境", "行道树种", "水生植物", "景观盆栽"]
        },
        "街景设施与城市家具": {
            "keywords": ["坐凳", "座椅", "长椅", "垃圾桶", "垃圾箱", "公交站", "候车亭", "导视", "指示牌", "护栏", "栏杆", "车止石", "隔离墩", "饮水台", "bench", "seat", "trash", "bus stop", "sign", "furniture"],
            "subtags": ["现代极简坐凳", "防腐木长凳", "不锈钢分类桶", "仿古栏杆", "智能公交亭"]
        },
        "公园小品与构筑物": {
            "keywords": ["景观亭", "凉亭", "长廊", "花架", "廊架", "木栈道", "栈道", "亲水平台", "景观桥", "张拉膜", "公厕", "管理房", "门头", "构架", "pavilion", "pergola", "bridge", "gazebo", "corridor"],
            "subtags": ["新中式景亭", "防腐木廊架", "钢构张拉膜", "亲水木栈道", "仿木景观桥"]
        },
        "景观雕塑与艺术装置": {
            "keywords": ["雕塑", "艺术装置", "景观小品", "假山", "叠石", "景石", "精神堡垒", "景墙", "形象墙", "置景", "sculpture", "art", "installation", "wall", "rockery", "stone"],
            "subtags": ["不锈钢艺术雕塑", "景观透光景墙", "入口精神堡垒", "置石自然叠石", "互动艺术装置"]
        },
        "商业街区与户外外摆": {
            "keywords": ["商业", "外摆", "遮阳伞", "餐车", "咖啡外摆", "售货亭", "招牌", "门头", "商铺", "茶区", "茶室", "集装箱", "夜市", "商用", "kiosk", "cart", "umbrella", "shop", "commercial", "tea"],
            "subtags": ["外摆遮阳伞", "商业门头设计", "网红集装箱", "移动售货餐车", "商业休闲外摆"]
        },
        "水景与地形铺装": {
            "keywords": ["水景", "喷泉", "跌水", "水幕", "旱喷", "水池", "跌级", "溪流", "铺装", "透水砖", "广场", "台阶", "踏步", "fountain", "water", "paving", "pool", "step"],
            "subtags": ["音乐旱喷", "自然叠水", "仿石透水砖", "花岗岩铺装", "阶梯叠级"]
        },
        "运动健身与儿童游乐": {
            "keywords": ["滑梯", "秋千", "攀爬", "沙坑", "游乐", "儿童", "健身器材", "运动", "跑道", "篮球场", "足球场", "playground", "slide", "swing", "fitness", "sport"],
            "subtags": ["儿童组合滑梯", "无动力乐园", "社区健身器材", "标准运动场地", "休闲秋千"]
        },
        "户外照明与亮化工程": {
            "keywords": ["路灯", "庭院灯", "草坪灯", "地埋灯", "射树灯", "洗墙灯", "景观灯", "水底灯", "智慧路灯", "灯柱", "light", "lamp", "street lamp", "bollard", "spotlight"],
            "subtags": ["太阳能路灯", "中式庭院灯", "简约草坪灯", "洗墙投光灯", "智慧多功能杆"]
        },
        "景观构件与五金材料": {
            "keywords": ["构件", "木方", "龙骨", "木工", "木架", "五金", "立柱", "连接件", "螺栓", "板材", "模块", "cube", "irregular", "pieces", "groups", "twobyfour", "wood", "hardware", "metal"],
            "subtags": ["防腐木构件", "建筑龙骨", "模块实木构架", "预埋五金件", "连接五金配件"]
        }
    }

    @classmethod
    def has_usable_data(cls, filename: str, components: List[str], raw_keywords: List[str], metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        判断当前模型是否具有可供 AI 或规则分析的有效数据特征
        """
        base_name = os.path.splitext(filename)[0].strip().lower()
        
        # 排除无意义文件名（如纯数字、极短字符、常见盲名）
        is_generic_name = (
            base_name.isdigit() or 
            len(base_name) <= 2 or 
            base_name in ["新建", "未命名", "untitled", "model", "new", "temp", "8", "1"]
        )

        has_components = bool(components and any(c.strip() for c in components if not c.isdigit() and len(c) > 2))
        has_keywords = bool(raw_keywords and any(len(k.strip()) >= 2 for k in raw_keywords))
        
        has_detected_texts = False
        if metadata and metadata.get("detected_texts"):
            has_detected_texts = bool(any(len(t.strip()) >= 2 for t in metadata["detected_texts"]))

        # 如果文件名有具体意义，或者有组件名，或者有视觉 OCR 识别出的文字，则视为有可用数据
        return (not is_generic_name) or has_components or has_keywords or has_detected_texts

    @classmethod
    def ask_ai_for_classification(cls, model_info: Dict[str, Any]) -> Optional[Tuple[str, List[str]]]:
        """
        将整理好的多模态数据提交给大模型 AI 进行专业园林与景观分类推断
        """
        # 如果未配置 API KEY，降级返回 None
        if not settings.OPENAI_API_KEY:
            return None

        try:
            from openai import OpenAI
            client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_BASE_URL,
                timeout=10.0
            )

            prompt = f"""你是一名资深的风景园林设计、公园绿地与城市规划 3D 模型资产归档专家。
现在有一个 SketchUp 3D 模型资产在预置的常用规则中无法直接归类。请根据以下提取出的全部可用多模态元数据，为其确定最贴切的一级分类名称与专业二级标签：

【模型全部可用元数据】
- 文件名: {model_info.get('filename', '未知')}
- 内嵌构件/组件: {', '.join(model_info.get('components', [])) or '无'}
- 画面 OCR 识别文字: {', '.join(model_info.get('detected_texts', [])) or '无'}
- 画面色彩与材质推断: {model_info.get('color_style', '现代简约')}
- 空间三维尺寸: 宽{model_info.get('width_mm', 0)}mm × 深{model_info.get('depth_mm', 0)}mm × 高{model_info.get('height_mm', 0)}mm
- 几何面数: {model_info.get('faces_count', '未知')}

【要求】
1. 优先从风景园林、城市街景、公园游乐、景观硬装等专业角度提炼一个精炼的一级分类名称（如：“滨水码头设施”、“假山叠水”、“精神堡垒与标识”、“特色园林廊桥”等）。若确实无法归入风景园林或完全不相关，请返回“其他”。
2. 提供 2~4 个精炼的景观专业标签（如：“防腐木质”、“现代极简”、“亲水设施”等）。
3. 必须输出严格的 JSON 格式，不要包含任何 markdown 说明：
{{"category": "分类名称", "tags": ["标签1", "标签2"]}}
"""
            response = client.chat.completions.create(
                model=settings.MODEL_NAME,
                messages=[
                    {"role": "system", "content": "你是一个严谨的风景园林资产分类助手，只输出合法 JSON。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=200
            )
            raw_content = response.choices[0].message.content.strip()
            # 清理可能的 markdown 代码块标记
            if raw_content.startswith("```"):
                raw_content = re.sub(r"^```[a-zA-Z]*\n", "", raw_content)
                raw_content = re.sub(r"\n```$", "", raw_content)
            
            data = json.loads(raw_content)
            cat = str(data.get("category", "")).strip()
            tags = [str(t).strip() for t in data.get("tags", []) if str(t).strip()]
            if cat:
                return cat, tags[:4]
        except Exception as e:
            print(f"[ModelClassifier] AI 分类推断异常或未响应: {e}")
        
        return None

    @classmethod
    def classify(
        cls,
        filename: str,
        components: Optional[List[str]] = None,
        raw_keywords: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, List[str]]:
        """
        动态三级分流分类引擎：
        1. 规则引擎快速初筛（零延迟、确定性）
        2. 若无命中规则且具备有效数据 -> 整理全部数据请求 AI 推断
        3. 若无可用数据或 AI 无法判定 -> 兜底为“其他”分类
        """
        components = components or []
        raw_keywords = raw_keywords or []
        combined_text = f"{filename} {' '.join(components)} {' '.join(raw_keywords)}".lower()

        matched_category = ""
        matched_tags = []
        max_hits = 0

        # 1. 遍历一级分类规则库，进行词频和加权匹配
        for category, rule in cls.CATEGORY_RULES.items():
            hits = 0
            for kw in rule["keywords"]:
                if kw.lower() in filename.lower():
                    hits += 5
                elif kw.lower() in combined_text:
                    hits += 1
            
            if hits > max_hits:
                max_hits = hits
                matched_category = category

        # 若命中了规则库（至少命中 1 个特征关键词）
        if max_hits > 0 and matched_category in cls.CATEGORY_RULES:
            subtags = cls.CATEGORY_RULES[matched_category]["subtags"]
            for tag in subtags:
                if tag in combined_text:
                    matched_tags.append(tag)

            # 补充景观专业材质与形态特征标签
            if "木" in combined_text or "wood" in combined_text:
                matched_tags.append("防腐原木")
            if "钢" in combined_text or "金属" in combined_text or "metal" in combined_text:
                matched_tags.append("耐候钢/金属")
            if "现代" in combined_text or "极简" in combined_text:
                matched_tags.append("现代极简")
            if "中式" in combined_text or "仿古" in combined_text:
                matched_tags.append("新中式景观")

            if not matched_tags:
                matched_tags.append("景观精选")

            return matched_category, list(set(matched_tags))[:4]

        # 2. 如果规则匹配不上：检查是否有可用数据
        has_data = cls.has_usable_data(filename, components, raw_keywords, metadata)
        
        if has_data:
            # 整理所有可用数据，提交问 AI
            model_info = {
                "filename": filename,
                "components": components,
                "detected_texts": metadata.get("detected_texts", []) if metadata else [],
                "color_style": metadata.get("color_style", "现代简约") if metadata else "现代简约",
                "width_mm": metadata.get("width_mm", 0) if metadata else 0,
                "depth_mm": metadata.get("depth_mm", 0) if metadata else 0,
                "height_mm": metadata.get("height_mm", 0) if metadata else 0,
                "faces_count": metadata.get("faces_count", "未知") if metadata else "未知",
            }
            ai_result = cls.ask_ai_for_classification(model_info)
            if ai_result:
                ai_category, ai_tags = ai_result
                return ai_category, ai_tags

        # 3. 没有可用数据 或 AI 无法推断，执行兜底分类：“其他”
        fallback_category = "其他"
        fallback_tags = ["待标注", "未分类"]
        return fallback_category, fallback_tags

    @classmethod
    def calculate_similarity(cls, target_asset: Dict[str, Any], candidate_asset: Dict[str, Any]) -> float:
        """
        计算两个模型之间的相似度得分 (0.0 ~ 1.0)
        综合考量：分类契合度 (40%) + 三维比例相似度 (30%) + 标签重叠度 (30%)
        """
        if target_asset["id"] == candidate_asset["id"]:
            return 0.0

        score = 0.0

        # 1. 分类匹配得分 (40分)
        if target_asset.get("category") == candidate_asset.get("category"):
            score += 0.40

        # 2. 空间三维比例相似度 (30分)
        # 提取宽高比 (Aspect Ratio: W/H) 和 进深高比 (D/H)
        tw = target_asset.get("width_mm", 1000)
        td = target_asset.get("depth_mm", 1000)
        th = max(target_asset.get("height_mm", 1000), 1)

        cw = candidate_asset.get("width_mm", 1000)
        cd = candidate_asset.get("depth_mm", 1000)
        ch = max(candidate_asset.get("height_mm", 1000), 1)

        t_ratio_wh = tw / th
        c_ratio_wh = cw / ch
        ratio_diff_wh = abs(t_ratio_wh - c_ratio_wh) / max(t_ratio_wh, c_ratio_wh, 0.1)

        t_ratio_dh = td / th
        c_ratio_dh = cd / ch
        ratio_diff_dh = abs(t_ratio_dh - c_ratio_dh) / max(t_ratio_dh, c_ratio_dh, 0.1)

        geom_similarity = max(0.0, 1.0 - (ratio_diff_wh + ratio_diff_dh) / 2.0)
        score += geom_similarity * 0.30

        # 3. 标签与关键词 Jaccard 相似度 (30分)
        t_tags = set(target_asset.get("tags") or [])
        c_tags = set(candidate_asset.get("tags") or [])
        if t_tags and c_tags:
            intersection = len(t_tags.intersection(c_tags))
            union = len(t_tags.union(c_tags))
            tag_score = intersection / union if union > 0 else 0
            score += tag_score * 0.30
        else:
            score += 0.10

        return round(score, 3)
