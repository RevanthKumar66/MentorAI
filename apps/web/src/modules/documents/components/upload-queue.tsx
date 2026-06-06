import React from 'react';
import { useDocumentStore } from '../store/document-store';
import { X, CheckCircle2, AlertCircle, Loader2, ArrowUpCircle } from 'lucide-react';

export const UploadQueue: React.FC = () => {
  const { uploadQueue, removeFromQueue, clearQueue } = useDocumentStore();

  if (uploadQueue.length === 0) return null;

  const activeCount = uploadQueue.filter(i => i.status === 'uploading' || i.status === 'pending').length;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-[6px] border border-[#e5e5e5] bg-[#fcfbf9]/95 backdrop-blur-md text-slate-800 overflow-hidden flex flex-col max-h-[380px]">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#f4f3f0] border-b border-[#e5e5e5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-xs text-slate-900">
            {activeCount > 0 ? `Uploading ${activeCount} file(s)...` : 'Upload Complete'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeCount === 0 && (
            <button
              onClick={clearQueue}
              className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-semibold"
            >
              Clear
            </button>
          )}
          <button
            onClick={clearQueue}
            className="text-slate-400 hover:text-slate-800 transition-colors p-0.5 rounded-[6px] hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin bg-white">
        {uploadQueue.map((item) => {
          const isUploading = item.status === 'uploading';
          const isPending = item.status === 'pending';
          const isCompleted = item.status === 'completed';
          const isFailed = item.status === 'failed';

          return (
            <div
              key={item.id}
              className="p-2.5 rounded-[6px] bg-[#fcfbf9] border border-slate-200/60 flex items-start gap-3 transition-colors animate-fade-in"
            >
              {/* Status Icon */}
              <div className="pt-0.5 shrink-0">
                {isUploading && <Loader2 className="w-3.5 h-3.5 text-slate-700 animate-spin" />}
                {isPending && <div className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-200" />}
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {isFailed && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-[11px] font-semibold truncate text-slate-800" title={item.name}>
                    {item.name}
                  </p>
                  {!isUploading && (
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded-[6px] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 font-mono">
                  <span>{formatSize(item.size)}</span>
                  {isUploading && <span>{item.progress}%</span>}
                  {isCompleted && <span className="text-emerald-600 font-semibold">Done</span>}
                  {isFailed && <span className="text-rose-500 font-semibold">Failed</span>}
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="w-full bg-[#ecebea] rounded-full h-1 mt-1.5 overflow-hidden">
                    <div
                      className="bg-slate-900 h-1 rounded-full transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {/* Error message */}
                {isFailed && item.error && (
                  <p className="text-[9px] text-rose-600 font-medium mt-1 line-clamp-2 leading-relaxed">
                    {item.error}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
