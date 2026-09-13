import React, { useState } from 'react';
import { X, FolderSearch, CheckCircle2, AlertCircle, HardDrive } from 'lucide-react';
import { api } from '../services/api';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [folderPath, setFolderPath] = useState('backend/storage/models');
  const [scanning, setScanning] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleScan = async () => {
    if (!folderPath.trim()) return;
    setScanning(true);
    setResultMsg(null);
    try {
      const res = await api.scanDirectory(folderPath.trim());
      setResultMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message || '扫描失败，请检查路径是否正确' });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <FolderSearch className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">服务器本地模型目录全盘扫描</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <p className="text-xs text-zinc-400">
            针对存放在服务器本地磁盘或挂载硬盘中的存量 .skp 模型，后台将递归扫描所有子文件夹，无需移动文件，自动按分类建立版本、缩略图与尺寸索引。
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center space-x-1.5">
              <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
              <span>服务器本地模型文件夹路径</span>
            </label>
            <input
              type="text"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="例如: backend/storage/models 或 /data/design_models"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* 状态消息 */}
          {resultMsg && (
            <div className={`flex items-center space-x-2 rounded-lg p-3 text-xs ${
              resultMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {resultMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{resultMsg.text}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
          >
            取消
          </button>
          <button
            disabled={scanning || !folderPath.trim()}
            onClick={handleScan}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2 text-xs font-semibold text-white hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50"
          >
            {scanning ? '后台全盘扫描索引中...' : '开始全盘建立索引'}
          </button>
        </div>
      </div>
    </div>
  );
};
