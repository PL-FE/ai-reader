import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { AssetCard } from './components/AssetCard';
import { AssetDetailModal } from './components/AssetDetailModal';
import { UploadModal } from './components/UploadModal';
import { ScanModal } from './components/ScanModal';
import { api } from './services/api';
import type { ModelAssetItem, CategoryItem, SearchParams } from './services/api';
import { RefreshCw, FolderSearch } from 'lucide-react';

export function App() {
  // 核心数据状态
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [assets, setAssets] = useState<ModelAssetItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // 搜索与多维过滤状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVersion, setSelectedVersion] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'size'>('newest');
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);

  // 弹窗状态
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);

  // 加载分类
  const fetchCategories = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('加载分类出错:', err);
    }
  }, []);

  // 执行多维检索
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params: SearchParams = {
        q: searchQuery,
        category: selectedCategory,
        su_version: selectedVersion,
        min_width: minWidth,
        max_width: maxWidth,
        sort_by: sortBy,
        limit: 36,
      };
      const result = await api.searchAssets(params);
      setAssets(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('检索资产出错:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedVersion, sortBy, minWidth, maxWidth]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets();
    }, 200); // 简单的输入防抖
    return () => clearTimeout(timer);
  }, [fetchAssets]);

  // 一键查找相似
  const handleFindSimilar = (e: React.MouseEvent, item: ModelAssetItem) => {
    e.stopPropagation();
    setSelectedAssetId(item.id);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
      {/* 顶部主导航 */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenScan={() => setIsScanOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 分类与多维筛选条 */}
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedVersion={selectedVersion}
        onSelectVersion={setSelectedVersion}
        sortBy={sortBy}
        onSelectSort={setSortBy}
        minWidth={minWidth}
        maxWidth={maxWidth}
        onWidthChange={(min, max) => {
          setMinWidth(min);
          setMaxWidth(max);
        }}
      />

      {/* 主体资产展示区域 */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6">
        {/* 顶部统计与筛选指示器 */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center space-x-2 text-xs text-zinc-400">
            <span>找到</span>
            <span className="font-bold text-amber-400">{total}</span>
            <span>个优质 SketchUp 模型资产</span>
            {searchQuery && (
              <span className="rounded bg-zinc-900 px-2 py-0.5 text-zinc-300 border border-zinc-800">
                匹配: "{searchQuery}"
              </span>
            )}
          </div>

          <button
            onClick={() => {
              fetchCategories();
              fetchAssets();
            }}
            className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white transition"
          >
            <RefreshCw className="h-3 w-3" />
            <span>刷新</span>
          </button>
        </div>

        {/* 资产列表内容 */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-zinc-900 bg-zinc-900/40 aspect-[4/3]"
              />
            ))}
          </div>
        ) : assets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={() => setSelectedAssetId(asset.id)}
                onFindSimilar={(e) => handleFindSimilar(e, asset)}
              />
            ))}
          </div>
        ) : (
          /* 空结果提示 */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-zinc-900 p-4 border border-zinc-800 mb-4 text-zinc-500">
              <FolderSearch className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300">未找到符合条件的模型</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm">
              尝试清除或放宽尺寸与版本筛选条件，或者点击右上角上传新模型。
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedVersion('all');
                setMinWidth(undefined);
                setMaxWidth(undefined);
              }}
              className="mt-4 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-1.5 text-xs text-amber-400 hover:bg-zinc-800"
            >
              重置所有筛选
            </button>
          </div>
        )}
      </main>

      {/* 底部 Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>知模 (ZhiMoHub) · 团队 SketchUp 3D 私有资产智能检索中心 · 毫秒级缩略图提取与语义聚类</p>
      </footer>

      {/* 资产详情弹窗 */}
      <AssetDetailModal
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
        onSelectSimilar={(id) => setSelectedAssetId(id)}
      />

      {/* 上传弹窗 */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          fetchCategories();
          fetchAssets();
        }}
      />

      {/* NAS 扫盘弹窗 */}
      <ScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onSuccess={() => {
          fetchCategories();
          fetchAssets();
        }}
      />
    </div>
  );
}

export default App;
