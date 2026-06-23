import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200/60 rounded-[12px] select-none min-h-[220px]">
      <div className="w-10 h-10 rounded-full bg-[#f4f3f0] border border-slate-200 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-slate-800" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-[11px] text-slate-700 max-w-[280px] leading-relaxed mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-[6px] transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
export default EmptyState;
