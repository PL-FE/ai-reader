import React from 'react';
import { Box, UploadCloud, FolderSearch, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenScan: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenScan,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo 与品牌 */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">知模</span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                ZhiMoHub
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">风景园林与街景公园 3D 资产智能检索平台</p>
          </div>
        </div>

        {/* 顶部中央大搜索框 */}
        <div className="flex-1 max-w-xl mx-4 lg:mx-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索景观小品、街景设施、植物绿化、外摆门头（如：公园长椅、景观亭、乔木、路灯、门头）..."
              className="w-full rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-zinc-400 hover:text-white"
              >
                清除
              </button>
            )}
          </div>
        </div>

        {/* 快捷操作区 */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenScan}
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition shadow-sm"
          >
            <FolderSearch className="h-4 w-4 text-zinc-400" />
            <span className="hidden sm:inline">服务器目录扫描</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:from-amber-600 hover:to-orange-700 transition shadow-md shadow-amber-500/20"
          >
            <UploadCloud className="h-4 w-4" />
            <span>上传 .skp</span>
          </button>
        </div>
      </div>
    </header>
  );
};
