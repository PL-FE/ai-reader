"""
知模 (ZhiMoHub) 纯本地轻量视觉识别与分析引擎
---------------------------------------------
专为 Docker 与纯 CPU 环境设计，无需 GPU 显卡。
利用轻量 ONNX 引擎与图像色彩分析，实现对提取出的 3D 缩略图进行“看图识物”：
1. 视觉文字与招牌识别 (RapidOCR ONNX)：针对门头、店面、图纸，秒级提取图内汉字（如“云茶”、“咖啡”）。
2. 视觉色彩与材质分析 (PIL 色彩直方图)：识别木质暖色调、黑白极简、金属高光等风格特征。
3. 智能多模态融合打标：当文件名是盲名（如 8.skp）时，依靠视觉线索自动命名与归类。
"""

import os
from typing import List, Dict, Any, Optional
from PIL import Image

class VisionClassifier:
    """纯本地轻量视觉分析器"""
    
    _ocr_engine = None
    _ocr_initialized = False

    @classmethod
    def _get_ocr(cls):
        """延迟加载 OCR 引擎，避免启动阻塞"""
        if not cls._ocr_initialized:
            try:
                from rapidocr_onnxruntime import RapidOCR
                cls._ocr_engine = RapidOCR()
            except Exception as e:
                print(f"[VisionClassifier] RapidOCR 未就绪或加载失败: {e}")
                cls._ocr_engine = None
            cls._ocr_initialized = True
        return cls._ocr_engine

    @classmethod
    def analyze_image(cls, image_path: str) -> Dict[str, Any]:
        """
        对给定的缩略图图片进行纯本地多维视觉特征分析
        """
        if not os.path.exists(image_path):
            return {
                "detected_texts": [],
                "color_style": "现代简约",
                "visual_keywords": [],
                "suggested_title": ""
            }

        detected_texts = []
        visual_keywords = []

        # 1. 纯本地 OCR 招牌与文字识别 (ONNX 纯 CPU 毫秒级)
        ocr = cls._get_ocr()
        if ocr:
            try:
                result, elapse = ocr(image_path)
                if result:
                    for line in result:
                        text = line[1].strip()
                        conf = line[2]
                        if len(text) >= 2 and conf > 0.5:
                            detected_texts.append(text)
                            visual_keywords.append(text)
            except Exception as e:
                print(f"[VisionClassifier] OCR 识别异常: {e}")

        # 2. 视觉色彩与材质直方图分析
        color_style = "现代简约"
        try:
            with Image.open(image_path) as im:
                im_rgb = im.convert("RGB").resize((100, 100))
                pixels = list(im_rgb.getdata())
                
                # 计算平均 RGB
                r_avg = sum(p[0] for p in pixels) / len(pixels)
                g_avg = sum(p[1] for p in pixels) / len(pixels)
                b_avg = sum(p[2] for p in pixels) / len(pixels)

                # 判断色调风格
                if r_avg > 140 and g_avg > 100 and b_avg < 80:
                    color_style = "原木温润 / 暖调"
                    visual_keywords.append("原木风")
                elif g_avg > r_avg and g_avg > b_avg:
                    color_style = "绿植景观 / 商业展示"
                    visual_keywords.append("绿植展示")
                elif abs(r_avg - g_avg) < 15 and abs(g_avg - b_avg) < 15:
                    if r_avg < 80:
                        color_style = "黑白极简 / 工业风"
                        visual_keywords.append("极简深调")
                    else:
                        color_style = "现代纯白 / 极简"
                        visual_keywords.append("纯白极简")
        except Exception:
            pass

        # 3. 生成基于视觉内容的建议标题
        suggested_title = ""
        if detected_texts:
            main_text = detected_texts[0]
            if any(w in main_text for w in ["茶", "饮", "咖", "店", "房", "家", "居"]):
                suggested_title = f"{main_text}商业空间门头设计"
            else:
                suggested_title = f"{main_text}定制 3D 构件"

        return {
            "detected_texts": detected_texts,
            "color_style": color_style,
            "visual_keywords": visual_keywords,
            "suggested_title": suggested_title
        }
