import React, { useState } from 'react';
import { Download, Copy, Sparkles, Ruler, Check } from 'lucide-react';
import type { ModelAssetItem } from '../services/api';

interface AssetCardProps {
  asset: ModelAssetItem;
  onClick: () => void;
  onFindSimilar: (e: React.MouseEvent) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onFindSimilar }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 复制局域网直接下载链接（团队内任何电脑浏览器粘入即可取用）
    const downloadUrl = `${window.location.origin}/api/assets/${asset.id}/download`;
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/assets/${asset.id}/download`, '_blank');
  };

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900/90 transition-all duration-300 hover:border-zinc-700 hover:shadow-2xl hover:shadow-amber-500/5 cursor-pointer"
    >
      {/* 缩略图视口 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
        <img
          src={asset.thumbnail_url}
          alt={asset.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLElement).setAttribute('src', '/thumbnails/default_model.png');
          }}
        />

        {/* 顶部悬浮角标 */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
          <span className="rounded-md bg-zinc-950/80 px-2 py-0.5 text-[11px] font-bold text-amber-400 backdrop-blur-md border border-amber-500/20 shadow-sm">
            {asset.su_version}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5">
          <span className="rounded-md bg-zinc-950/70 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-md border border-zinc-800">
            {asset.file_size_display}
          </span>
        </div>

        {/* 快捷悬浮操作浮层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-between p-3">
          <button
            onClick={onFindSimilar}
            className="flex items-center space-x-1 rounded-lg bg-amber-500/90 hover:bg-amber-400 px-2.5 py-1 text-xs font-semibold text-zinc-950 shadow-md backdrop-blur-sm transition"
            title="以图及特征查找库内相似款"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>找相似</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyPath}
              className="flex items-center space-x-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 px-2 py-1 text-xs text-zinc-200 border border-zinc-700 transition"
              title="复制局域网直链（局域网内任意浏览器打开即可直接下载）"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? '已复制直链' : '复制直链'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="rounded-lg bg-zinc-900/90 hover:bg-zinc-800 p-1.5 text-zinc-200 border border-zinc-700 transition"
              title="下载 .skp 原始源文件"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 底部信息区 */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-zinc-100 group-hover:text-amber-400 transition">
            {asset.title}
          </h3>
        </div>

        {/* 核心辨识要素：三维尺寸胶囊 */}
        <div className="mt-2 flex items-center space-x-1.5 text-zinc-400">
          <Ruler className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <span className="rounded bg-zinc-950 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-300 border border-zinc-800">
            {asset.dimensions.display}
          </span>
        </div>

        {/* 标签与组件预览 */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
            {asset.category}
          </span>
          {asset.tags.slice(0, 2).map((t, idx) => (
            <span
              key={idx}
              className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400"
            >
              {t}
            </span>
          ))}
        </div>

        {/* 内部构件提示 */}
        {asset.components && asset.components.length > 0 && (
          <div className="mt-2 text-[10px] text-zinc-500 line-clamp-1">
            包含: {asset.components.join(' / ')}
          </div>
        )}
      </div>
    </div>
  );
};
