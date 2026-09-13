import React, { useState } from 'react';
import { SlidersHorizontal, ArrowUpDown, ChevronDown, X } from 'lucide-react';
import type { CategoryItem } from '../services/api';

interface CategoryBarProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedVersion: string;
  onSelectVersion: (ver: string) => void;
  sortBy: 'newest' | 'views' | 'size';
  onSelectSort: (sort: 'newest' | 'views' | 'size') => void;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange: (min?: number, max?: number) => void;
}

const SU_VERSIONS = [
  { label: '全部版本', value: 'all' },
  { label: 'SketchUp 2026', value: 'SketchUp 2026' },
  { label: 'SketchUp 2024', value: 'SketchUp 2024' },
  { label: 'SketchUp 2023', value: 'SketchUp 2023' },
  { label: 'SketchUp 2022', value: 'SketchUp 2022' },
  { label: 'SketchUp 2021', value: 'SketchUp 2021' },
  { label: 'SketchUp 2020 及更早', value: 'SketchUp 2020' },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedVersion,
  onSelectVersion,
  sortBy,
  onSelectSort,
  minWidth,
  maxWidth,
  onWidthChange,
}) => {
  const [showDimensionFilter, setShowDimensionFilter] = useState(false);
  const [tempMinW, setTempMinW] = useState<string>(minWidth ? String(minWidth) : '');
  const [tempMaxW, setTempMaxW] = useState<string>(maxWidth ? String(maxWidth) : '');

  const handleApplyDimension = () => {
    onWidthChange(
      tempMinW ? parseInt(tempMinW, 10) : undefined,
      tempMaxW ? parseInt(tempMaxW, 10) : undefined
    );
    setShowDimensionFilter(false);
  };

  const handleClearDimension = () => {
    setTempMinW('');
    setTempMaxW('');
    onWidthChange(undefined, undefined);
    setShowDimensionFilter(false);
  };

  const hasDimensionFilter = minWidth !== undefined || maxWidth !== undefined;

  return (
    <div className="border-b border-zinc-800 bg-zinc-950/40 py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* 第一行：一级品类胶囊切换 */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => onSelectCategory(cat.key)}
                className={`flex shrink-0 items-center space-x-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 第二行：参数复合过滤器 */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-900 text-xs">
          <div className="flex items-center space-x-3">
            {/* SU 版本过滤 */}
            <div className="flex items-center space-x-1.5">
              <span className="text-zinc-500">版本:</span>
              <select
                value={selectedVersion}
                onChange={(e) => onSelectVersion(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300 focus:border-amber-500 focus:outline-none"
              >
                {SU_VERSIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 尺寸过滤触发按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowDimensionFilter(!showDimensionFilter)}
                className={`flex items-center space-x-1.5 rounded-lg border px-2.5 py-1 transition ${
                  hasDimensionFilter
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>
                  {hasDimensionFilter
                    ? `宽: ${minWidth || 0} - ${maxWidth || '∞'} mm`
                    : '尺寸范围 (mm)'}
                </span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* 尺寸过滤弹出卡片 */}
              {showDimensionFilter && (
                <div className="absolute left-0 top-full mt-2 z-20 w-64 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                    <span className="font-semibold text-zinc-200">宽度范围 (毫米 mm)</span>
                    <button
                      onClick={() => setShowDimensionFilter(false)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="最小宽"
                      value={tempMinW}
                      onChange={(e) => setTempMinW(e.target.value)}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-zinc-500">-</span>
                    <input
                      type="number"
                      placeholder="最大宽"
                      value={tempMaxW}
                      onChange={(e) => setTempMaxW(e.target.value)}
                      className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={handleClearDimension}
                      className="text-zinc-400 hover:text-zinc-200 text-xs"
                    >
                      重置
                    </button>
                    <button
                      onClick={handleApplyDimension}
                      className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
                    >
                      应用
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 排序方式 */}
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-500">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => onSelectSort(e.target.value as any)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300 focus:border-amber-500 focus:outline-none"
            >
              <option value="newest">最新入库</option>
              <option value="views">最多查看</option>
              <option value="size">文件体积 (大到小)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
