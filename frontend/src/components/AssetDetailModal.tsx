import React, { useEffect, useState } from 'react';
import { X, Download, Copy, Ruler, Layers, Sparkles, Check, Calendar, HardDrive } from 'lucide-react';
import { api } from '../services/api';
import type { ModelAssetItem, SimilarModelItem } from '../services/api';

interface AssetDetailModalProps {
  assetId: string | null;
  onClose: () => void;
  onSelectSimilar: (id: string) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  assetId,
  onClose,
  onSelectSimilar,
}) => {
  const [asset, setAsset] = useState<(ModelAssetItem & { file_path: string }) | null>(null);
  const [similarModels, setSimilarModels] = useState<SimilarModelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!assetId) {
      setAsset(null);
      return;
    }

    setLoading(true);
    Promise.all([api.getAssetDetail(assetId), api.getSimilarModels(assetId, 4)])
      .then(([detail, similar]) => {
        setAsset(detail);
        setSimilarModels(similar);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [assetId]);

  if (!assetId) return null;

  const handleCopyPath = () => {
    if (!asset) return;
    navigator.clipboard.writeText(asset.file_path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!asset) return;
    window.open(`/api/assets/${asset.id}/download`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* 顶部操作条 */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              {asset?.category || '3D 模型'}
            </span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
              {asset?.su_version}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容主体 */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-zinc-500">
              加载模型详情中...
            </div>
          ) : asset ? (
            <div className="space-y-6">
              {/* 上半部分：大图与核心参数 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* 缩略图大图 (标准工程四视图) */}
                <div className="md:col-span-7 relative overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1 group">
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center space-x-1.5 rounded-md bg-zinc-900/90 border border-blue-500/30 px-2 py-0.5 text-[11px] font-medium text-blue-400 backdrop-blur-md shadow-md">
                    <span>📐 CAD 标准四视图 (正视·侧视·顶视·3D轴测)</span>
                  </div>
                  <img
                    src={asset.thumbnail_url}
                    alt={asset.title}
                    className="max-h-[380px] w-full object-contain rounded-lg shadow-inner"
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute('src', '/thumbnails/default_model.png');
                    }}
                  />
                </div>

                {/* 右侧参数面板 */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{asset.title}</h2>
                    <p className="mt-1 text-xs text-zinc-400 break-all">{asset.filename}</p>

                    {/* 尺寸规格盒 */}
                    <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-400 mb-2">
                        <Ruler className="h-4 w-4" />
                        <span>三维空间尺寸 (BoundingBox)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500">宽度 (X)</span>
                          <p className="text-sm font-mono font-bold text-zinc-100">{asset.dimensions.width} mm</p>
                        </div>
                        <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500">进深 (Y)</span>
                          <p className="text-sm font-mono font-bold text-zinc-100">{asset.dimensions.depth} mm</p>
                        </div>
                        <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500">高度 (Z)</span>
                          <p className="text-sm font-mono font-bold text-zinc-100">{asset.dimensions.height} mm</p>
                        </div>
                      </div>
                    </div>

                    {/* 元数据指标 */}
                    <div className="mt-4 space-y-2 text-xs text-zinc-400">
                      <div className="flex items-center justify-between py-1 border-b border-zinc-800">
                        <span className="flex items-center space-x-1.5">
                          <HardDrive className="h-3.5 w-3.5" />
                          <span>文件大小:</span>
                        </span>
                        <span className="text-zinc-200 font-medium">{asset.file_size_display}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-zinc-800">
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>入库时间:</span>
                        </span>
                        <span className="text-zinc-200">{asset.created_at}</span>
                      </div>
                    </div>

                    {/* 标签列表 */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {asset.tags.map((t, idx) => (
                        <span key={idx} className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 快捷操作栏 */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleCopyPath}
                      className="w-full flex items-center justify-center space-x-2 rounded-xl border border-zinc-700 bg-zinc-800/80 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      <span>{copied ? '已复制服务器绝对路径' : '复制服务器物理文件路径'}</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-xs font-semibold text-white hover:from-amber-600 hover:to-orange-700 transition shadow-lg shadow-amber-500/20"
                    >
                      <Download className="h-4 w-4" />
                      <span>一键下载 .skp 源文件</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 更多技术参数 (知末同款 8 宫格仪表盘) */}
              {asset.specs && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-900">
                    <h4 className="text-xs font-bold text-zinc-300">更多参数</h4>
                    <span className="text-[10px] text-zinc-500">SketchUp 物理模型深度技术指标</span>
                  </div>
                  <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
                    {/* 第一行 */}
                    <div className="rounded-lg bg-zinc-900/60 py-2 px-1 border border-zinc-800/50">
                      <p className="text-sm font-bold text-zinc-100 truncate px-1">{asset.specs.style || '现代简约'}</p>
                      <span className="text-[10px] text-zinc-500">风格</span>
                    </div>
                    <div className="rounded-lg bg-zinc-900/60 py-2 px-1 border border-zinc-800/50">
                      <p className="text-sm font-bold text-zinc-100">{asset.specs.faces_count || '--'}</p>
                      <span className="text-[10px] text-zinc-500">面数</span>
                    </div>
                    <div className="rounded-lg bg-zinc-900/60 py-2 px-1 border border-zinc-800/50">
                      <p className="text-sm font-bold text-zinc-100">{asset.specs.file_size || asset.file_size_display}</p>
                      <span className="text-[10px] text-zinc-500">文件大小</span>
                    </div>
                    <div className="rounded-lg bg-zinc-900/60 py-2 px-1 border border-zinc-800/50">
                      <p className="text-sm font-bold text-zinc-100">{asset.specs.textures_count > 0 ? `${asset.specs.textures_count} 张` : '--'}</p>
                      <span className="text-[10px] text-zinc-500">贴图数</span>
                    </div>
                    {/* 第二行 */}
                    <div className="rounded-lg bg-zinc-900/60 py-2 px-1 border border-zinc-800/50">
                      <p className="text-sm font-bold text-emerald-400">{asset.specs.texture_replaceable}</p>
                      <span className="text-[10px] text-zinc-500">贴图可换</span>
                    </div>
                    <div className="rounded-lg bg-zinc-900/60 py-2 px-1 border border-zinc-800/50">
                      <p className="text-sm font-bold text-zinc-100">{asset.specs.components_count > 0 ? `${asset.specs.components_count} 个` : '--'}</p>
                      <span className="text-[10px] text-zinc-500">组件数</span>
                    </div>
                    <div className="rounded-lg bg-zinc-900/60 py-2 px-1 border border-zinc-800/50">
                      <p className="text-sm font-bold text-zinc-100">{asset.specs.scenes_count > 0 ? `${asset.specs.scenes_count} 个` : '--'}</p>
                      <span className="text-[10px] text-zinc-500">场景数</span>
                    </div>
                    <div className="rounded-lg bg-zinc-900/60 py-2 px-1 border border-zinc-800/50">
                      <p className="text-sm font-bold text-zinc-100">{asset.specs.created_at || '2026/09/13'}</p>
                      <span className="text-[10px] text-zinc-500">上传时间</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 内部构件清单 */}
              {asset.components && asset.components.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-300 mb-2">
                    <Layers className="h-4 w-4 text-amber-500" />
                    <span>模型内部提取构件 ({asset.components.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {asset.components.map((comp, idx) => (
                      <span key={idx} className="rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-xs text-zinc-400">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 相似模型推荐（智能聚类特色） */}
              {similarModels.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">智能相似款推荐 (空间比例与构件语义匹配)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {similarModels.map((sim) => (
                      <div
                        key={sim.id}
                        onClick={() => onSelectSimilar(sim.id)}
                        className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/60 p-2 hover:border-amber-500/50 hover:bg-zinc-900 transition cursor-pointer"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-900">
                          <img
                            src={sim.thumbnail_url}
                            alt={sim.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', '/thumbnails/default_model.png');
                            }}
                          />
                          <span className="absolute top-1 right-1 rounded bg-amber-500/90 px-1.5 py-0.2 text-[9px] font-bold text-zinc-950">
                            匹配度 {sim.similarity_score}
                          </span>
                        </div>
                        <span className="mt-2 line-clamp-1 text-xs font-medium text-zinc-200 group-hover:text-amber-400 transition">
                          {sim.title}
                        </span>
                        <span className="text-[10px] text-zinc-500">{sim.dimensions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
