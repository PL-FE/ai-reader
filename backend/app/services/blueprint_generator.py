"""
四视图工程图纸生成器 (Blueprint Generator)
---------------------------------------
为 SketchUp 模型自动渲染专业建筑工程 CAD 蓝图风格的四视图：
1. 正立面图 (Front Elevation)
2. 顶平面图 (Top Plan)
3. 侧立面图 (Side Elevation)
4. 3D 轴测透视实景 (Isometric & 3D Preview)
并附带真实毫米尺寸引线标尺与标准工程图签。
"""

import os
import math
from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageFont

class BlueprintGenerator:
    """
    工业级 CAD 四视图蓝图生成器
    """

    @staticmethod
    def _get_font(size: int = 14) -> ImageFont.ImageFont:
        """获取支持中文字符的高质量字体"""
        candidate_fonts = [
            "/System/Library/Fonts/Hiragino Sans GB.ttc",
            "/System/Library/Fonts/STHeiti Light.ttc",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
        for font_path in candidate_fonts:
            if os.path.exists(font_path):
                try:
                    return ImageFont.truetype(font_path, size)
                except Exception:
                    continue
        return ImageFont.load_default()

    @classmethod
    def generate_quad_view(
        cls,
        title: str,
        width_mm: int,
        depth_mm: int,
        height_mm: int,
        category: str,
        su_version: str,
        output_path: str,
        raw_snapshot_path: Optional[str] = None,
        style: str = "现代简约"
    ) -> str:
        """
        生成标准四分格工程图纸
        """
        # 画布规格：1200 x 800 (3:2 黄金比例)
        canvas_w, canvas_h = 1200, 800

        # 色彩方案：深空蓝灰工程蓝图风
        c_bg = (18, 22, 28)           # 底色
        c_grid = (28, 34, 44)         # 背景微弱网格
        c_panel = (24, 30, 40)        # 视口面板背景
        c_border = (45, 58, 76)       # 视口边框
        c_line = (78, 168, 255)       # 构件亮蓝线条
        c_subline = (50, 110, 180)    # 辅助线条
        c_text = (210, 225, 245)      # 标题文字
        c_subtext = (120, 140, 165)   # 标注文字
        c_dim = (255, 175, 55)        # 尺寸标注醒目橙黄
        c_accent = (0, 220, 180)      # 点缀青绿

        img = Image.new("RGB", (canvas_w, canvas_h), c_bg)
        draw = ImageDraw.Draw(img)

        # 1. 绘制全局背景网格 (30px)
        grid_step = 30
        for x in range(0, canvas_w, grid_step):
            draw.line([(x, 0), (x, canvas_h)], fill=c_grid, width=1)
        for y in range(0, canvas_h, grid_step):
            draw.line([(0, y), (canvas_w, y)], fill=c_grid, width=1)

        # 2. 顶部统一工程标题栏 (高 60px)
        font_title = cls._get_font(20)
        font_sub = cls._get_font(13)
        font_dim = cls._get_font(12)
        font_view_title = cls._get_font(14)

        draw.rectangle([(20, 15), (canvas_w - 20, 65)], fill=c_panel, outline=c_border, width=1)
        display_title = title if len(title) <= 30 else title[:28] + "..."
        draw.text((36, 26), f"知模 (ZHIMOHUB) 标准工程四视图  •  {display_title}", fill=(255, 255, 255), font=font_title)
        draw.text((canvas_w - 420, 31), f"品类: {category}  |  版本: {su_version}", fill=c_accent, font=font_sub)

        # 3. 计算四分格区域 (2列 x 2行)
        margin_x = 20
        start_y = 75
        bot_bar_h = 65
        avail_h = canvas_h - start_y - bot_bar_h - 20
        col_w = (canvas_w - margin_x * 2 - 16) // 2
        row_h = (avail_h - 16) // 2

        quads = [
            (margin_x, start_y, margin_x + col_w, start_y + row_h),                                   # 左上: 正立面
            (margin_x + col_w + 16, start_y, margin_x + col_w * 2 + 16, start_y + row_h),           # 右上: 侧立面
            (margin_x, start_y + row_h + 16, margin_x + col_w, start_y + row_h * 2 + 16),           # 左下: 顶平面
            (margin_x + col_w + 16, start_y + row_h + 16, margin_x + col_w * 2 + 16, start_y + row_h * 2 + 16) # 右下: 3D视口
        ]

        inner_w = col_w - 110
        inner_h = row_h - 90
        scale = min(inner_w / max(width_mm, depth_mm, 1), inner_h / max(height_mm, depth_mm, 1)) * 0.85

        p_w = max(int(width_mm * scale), 30)
        p_d = max(int(depth_mm * scale), 30)
        p_h = max(int(height_mm * scale), 30)

        # -------------------------------------------------------------
        # 视口 ①：正立面图 (Front Elevation) - 宽 W x 高 H
        # -------------------------------------------------------------
        qx, qy, qx2, qy2 = quads[0]
        draw.rectangle([(qx, qy), (qx2, qy2)], fill=c_panel, outline=c_border, width=1)
        draw.text((qx + 16, qy + 12), "① 正立面图 (FRONT ELEVATION)", fill=c_text, font=font_view_title)

        cx = qx + col_w // 2
        cy = qy + row_h // 2 + 10
        f_left, f_top = cx - p_w // 2, cy - p_h // 2
        f_right, f_bot = f_left + p_w, f_top + p_h

        draw.rectangle([(f_left, f_top), (f_right, f_bot)], outline=c_line, width=2)
        draw.line([(f_left, cy), (f_right, cy)], fill=c_subline, width=1)
        draw.line([(cx, f_top), (cx, f_bot)], fill=c_subline, width=1)

        draw.line([(f_left, f_bot + 12), (f_right, f_bot + 12)], fill=c_dim, width=1)
        draw.line([(f_left, f_bot + 8), (f_left, f_bot + 16)], fill=c_dim, width=1)
        draw.line([(f_right, f_bot + 8), (f_right, f_bot + 16)], fill=c_dim, width=1)
        draw.text((cx - 24, f_bot + 15), f"W: {width_mm}mm", fill=c_dim, font=font_dim)

        draw.line([(f_left - 12, f_top), (f_left - 12, f_bot)], fill=c_dim, width=1)
        draw.line([(f_left - 16, f_top), (f_left - 8, f_top)], fill=c_dim, width=1)
        draw.line([(f_left - 16, f_bot), (f_left - 8, f_bot)], fill=c_dim, width=1)
        draw.text((f_left - 58, cy - 6), f"H: {height_mm}", fill=c_dim, font=font_dim)

        # -------------------------------------------------------------
        # 视口 ②：侧立面图 (Side Elevation) - 深 D x 高 H
        # -------------------------------------------------------------
        qx, qy, qx2, qy2 = quads[1]
        draw.rectangle([(qx, qy), (qx2, qy2)], fill=c_panel, outline=c_border, width=1)
        draw.text((qx + 16, qy + 12), "② 侧立面图 (SIDE ELEVATION)", fill=c_text, font=font_view_title)

        cx = qx + col_w // 2
        cy = qy + row_h // 2 + 10
        s_left, s_top = cx - p_d // 2, cy - p_h // 2
        s_right, s_bot = s_left + p_d, s_top + p_h

        draw.rectangle([(s_left, s_top), (s_right, s_bot)], outline=c_line, width=2)
        draw.line([(s_left, cy), (s_right, cy)], fill=c_subline, width=1)
        draw.line([(cx, s_top), (cx, s_bot)], fill=c_subline, width=1)

        draw.line([(s_left, s_bot + 12), (s_right, s_bot + 12)], fill=c_dim, width=1)
        draw.line([(s_left, s_bot + 8), (s_left, s_bot + 16)], fill=c_dim, width=1)
        draw.line([(s_right, s_bot + 8), (s_right, s_bot + 16)], fill=c_dim, width=1)
        draw.text((cx - 24, s_bot + 15), f"D: {depth_mm}mm", fill=c_dim, font=font_dim)

        draw.line([(s_right + 12, s_top), (s_right + 12, s_bot)], fill=c_dim, width=1)
        draw.line([(s_right + 8, s_top), (s_right + 16, s_top)], fill=c_dim, width=1)
        draw.line([(s_right + 8, s_bot), (s_right + 16, s_bot)], fill=c_dim, width=1)
        draw.text((s_right + 16, cy - 6), f"H: {height_mm}", fill=c_dim, font=font_dim)

        # -------------------------------------------------------------
        # 视口 ③：顶平面图 (Top Plan) - 宽 W x 深 D
        # -------------------------------------------------------------
        qx, qy, qx2, qy2 = quads[2]
        draw.rectangle([(qx, qy), (qx2, qy2)], fill=c_panel, outline=c_border, width=1)
        draw.text((qx + 16, qy + 12), "③ 顶平面图 (TOP PLAN)", fill=c_text, font=font_view_title)

        cx = qx + col_w // 2
        cy = qy + row_h // 2 + 10
        t_left, t_top = cx - p_w // 2, cy - p_d // 2
        t_right, t_bot = t_left + p_w, t_top + p_d

        draw.rectangle([(t_left, t_top), (t_right, t_bot)], outline=c_line, width=2)
        draw.line([(t_left, t_top), (t_right, t_bot)], fill=c_subline, width=1)
        draw.line([(t_left, t_bot), (t_right, t_top)], fill=c_subline, width=1)

        draw.line([(t_left, t_bot + 12), (t_right, t_bot + 12)], fill=c_dim, width=1)
        draw.line([(t_left, t_bot + 8), (t_left, t_bot + 16)], fill=c_dim, width=1)
        draw.line([(t_right, t_bot + 8), (t_right, t_bot + 16)], fill=c_dim, width=1)
        draw.text((cx - 24, t_bot + 15), f"W: {width_mm}mm", fill=c_dim, font=font_dim)

        draw.line([(t_left - 12, t_top), (t_left - 12, t_bot)], fill=c_dim, width=1)
        draw.line([(t_left - 16, t_top), (t_left - 8, t_top)], fill=c_dim, width=1)
        draw.line([(t_left - 16, t_bot), (t_left - 8, t_bot)], fill=c_dim, width=1)
        draw.text((t_left - 58, cy - 6), f"D: {depth_mm}", fill=c_dim, font=font_dim)

        # -------------------------------------------------------------
        # 视口 ④：3D 轴测透视实景 (Isometric & 3D Preview)
        # -------------------------------------------------------------
        qx, qy, qx2, qy2 = quads[3]
        draw.rectangle([(qx, qy), (qx2, qy2)], fill=c_panel, outline=c_border, width=1)
        draw.text((qx + 16, qy + 12), "④ 3D 等轴测透视视口 (ISOMETRIC 3D)", fill=c_text, font=font_view_title)

        rendered_success = False
        if raw_snapshot_path and os.path.exists(raw_snapshot_path):
            try:
                snap_img = Image.open(raw_snapshot_path).convert("RGBA")
                s_avail_w = col_w - 40
                s_avail_h = row_h - 50
                snap_img.thumbnail((s_avail_w, s_avail_h), Image.Resampling.LANCZOS)
                
                sx = qx + (col_w - snap_img.width) // 2
                sy = qy + 35 + (s_avail_h - snap_img.height) // 2
                
                img.paste(snap_img, (sx, sy), snap_img)
                draw.rectangle([(sx, sy), (sx + snap_img.width, sy + snap_img.height)], outline=(60, 80, 110), width=1)
                rendered_success = True
            except Exception:
                rendered_success = False

        if not rendered_success:
            iso_cx = qx + col_w // 2
            iso_cy = qy + row_h // 2 + 25
            iso_s = scale * 0.75
            iw = width_mm * iso_s
            id_ = depth_mm * iso_s
            ih = height_mm * iso_s

            cos30 = math.cos(math.radians(30))
            sin30 = math.sin(math.radians(30))

            p0 = (iso_cx, iso_cy)
            p1 = (iso_cx + iw * cos30, iso_cy - iw * sin30)
            p2 = (iso_cx + iw * cos30 - id_ * cos30, iso_cy - iw * sin30 - id_ * sin30)
            p3 = (iso_cx - id_ * cos30, iso_cy - id_ * sin30)

            t0 = (p0[0], p0[1] - ih)
            t1 = (p1[0], p1[1] - ih)
            t2 = (p2[0], p2[1] - ih)
            t3 = (p3[0], p3[1] - ih)

            draw.polygon([t0, t1, t2, t3], fill=(30, 45, 65), outline=c_line)
            draw.polygon([p0, p1, t1, t0], fill=(22, 34, 50), outline=c_line)
            draw.polygon([p0, p3, t3, t0], fill=(26, 38, 56), outline=c_line)

        # 4. 底部全宽工程图签栏 (高 55px)
        by1 = canvas_h - bot_bar_h
        by2 = canvas_h - 15
        draw.rectangle([(20, by1), (canvas_w - 20, by2)], fill=c_panel, outline=c_border, width=1)
        
        draw.line([(canvas_w // 3, by1), (canvas_w // 3, by2)], fill=c_border, width=1)
        draw.line([(canvas_w * 2 // 3, by1), (canvas_w * 2 // 3, by2)], fill=c_border, width=1)

        draw.text((36, by1 + 16), f"空间尺寸: {width_mm} × {depth_mm} × {height_mm} mm", fill=c_dim, font=font_sub)
        draw.text((canvas_w // 3 + 24, by1 + 16), f"设计风格: {style}  |  正交投影比例: 1:AutoScale", fill=c_subtext, font=font_sub)
        draw.text((canvas_w * 2 // 3 + 24, by1 + 16), "知模三维资产数字标准认证图纸 (QUAD-VIEW)", fill=c_accent, font=font_sub)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img.save(output_path, "PNG", quality=95)
        return output_path
