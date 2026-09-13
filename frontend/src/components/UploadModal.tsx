import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter((f) => f.name.toLowerCase().endsWith('.skp'));
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const selected = Array.from(e.dataTransfer.files).filter((f) => f.name.toLowerCase().endsWith('.skp'));
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setResultMsg(null);
    try {
      const res = await api.uploadFiles(files);
      setResultMsg({ type: 'success', text: res.message });
      setFiles([]);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message || '上传失败' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <UploadCloud className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">批量上传 SketchUp 模型 (.skp)</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 拖拽上传区 */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/60 p-8 text-center hover:border-amber-500/50 transition cursor-pointer"
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input
            id="file-upload-input"
            type="file"
            multiple
            accept=".skp"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadCloud className="h-10 w-10 text-zinc-500 mb-2" />
          <p className="text-sm font-semibold text-zinc-200">点击或拖拽 .skp 文件到此处</p>
          <p className="mt-1 text-xs text-zinc-500">系统将以毫秒级自动提取内嵌缩略图、软件版本及构件属性</p>
        </div>

        {/* 待上传文件列表 */}
        {files.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-xs border border-zinc-800">
                <div className="flex items-center space-x-2 truncate">
                  <FileText className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="truncate text-zinc-200">{f.name}</span>
                </div>
                <span className="text-zinc-500 shrink-0 ml-2">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            ))}
          </div>
        )}

        {/* 状态消息 */}
        {resultMsg && (
          <div className={`mt-4 flex items-center space-x-2 rounded-lg p-3 text-xs ${
            resultMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {resultMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{resultMsg.text}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
          >
            取消
          </button>
          <button
            disabled={files.length === 0 || uploading}
            onClick={handleUpload}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2 text-xs font-semibold text-white hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50"
          >
            {uploading ? '解析并入库中...' : `立即上传解析 (${files.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
