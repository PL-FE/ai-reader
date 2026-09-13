"""
知模 (ZhiMoHub) 3D 模型资产数据模型
-----------------------------------
使用 SQLModel (融合 Pydantic 与 SQLAlchemy) 打造零运维模型表结构。
"""

from typing import Optional, List
import uuid
import json
from datetime import datetime
from sqlmodel import SQLModel, Field

class ModelAsset(SQLModel, table=True):
    """
    3D 模型核心资产表
    """
    __tablename__ = "model_assets"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    filename: str = Field(index=True, description="原始文件名")
    title: str = Field(default="", index=True, description="展示标题")
    file_path: str = Field(description="磁盘/NAS 物理绝对路径")
    file_size: int = Field(default=0, description="文件字节大小")
    
    # SketchUp 专有参数
    su_version: str = Field(default="SketchUp 2022", index=True, description="SketchUp 软件版本")
    thumbnail_url: str = Field(default="/thumbnails/default_model.png", description="封面缩略图路径")
    
    # 空间尺寸 (单位: 毫米 mm)
    width_mm: int = Field(default=1000, description="宽 (X 轴尺寸)")
    depth_mm: int = Field(default=1000, description="深 (Y 轴尺寸)")
    height_mm: int = Field(default=1000, description="高 (Z 轴尺寸)")

    # 深度专业技术参数 (1:1 对齐知末)
    style: str = Field(default="现代简约", index=True, description="设计风格 (新中式/意式轻奢/现代等)")
    faces_count: str = Field(default="1.2万", description="面数规模")
    textures_count: int = Field(default=0, description="贴图数")
    texture_replaceable: bool = Field(default=True, description="贴图是否可换")
    components_count: int = Field(default=1, description="组件数")
    scenes_count: int = Field(default=1, description="场景数")

    # 智能分类与标签
    category: str = Field(default="其他资产", index=True, description="一级分类")
    tags_json: str = Field(default="[]", description="二级特征标签 (JSON 字符串)")
    components_json: str = Field(default="[]", description="内部提取出的构件清单 (JSON 字符串)")
    
    # 交互统计
    views_count: int = Field(default=0, description="查看次数")
    downloads_count: int = Field(default=0, description="下载/导入取用次数")
    
    # 时间戳
    created_at: datetime = Field(default_factory=datetime.utcnow, description="入库时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")

    @property
    def tags(self) -> List[str]:
        try:
            return json.loads(self.tags_json)
        except Exception:
            return []

    @tags.setter
    def tags(self, value: List[str]):
        self.tags_json = json.dumps(value, ensure_ascii=False)

    @property
    def components(self) -> List[str]:
        try:
            return json.loads(self.components_json)
        except Exception:
            return []

    @components.setter
    def components(self, value: List[str]):
        self.components_json = json.dumps(value, ensure_ascii=False)

    @property
    def file_size_display(self) -> str:
        """格式化文件大小为 MB / KB"""
        mb = self.file_size / (1024 * 1024)
        if mb >= 1.0:
            return f"{mb:.1f} MB"
        return f"{self.file_size / 1024:.0f} KB"
