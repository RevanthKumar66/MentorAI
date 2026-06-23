import React from 'react';
import { AvailabilityBlock } from '../types/scheduling';
import { Sparkles, Brain, Clock, ShieldCheck } from 'lucide-react';

interface Props {
  blocks: AvailabilityBlock[];
}

export function FocusWindowCard({ blocks }: Props) {
  const formatTimeSlot = (isoStart: string, isoEnd: string) => {
    try {
      const start = new Date(isoStart);
      const end = new Date(isoEnd);
      const day = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
        ' - ' + 
        end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${day} at ${timeStr}`;
    } catch {
      return 'Time block details unavailable';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Brain className="w-4 h-4 text-slate-500" />
        Available Focus Windows
      </h3>

      {blocks.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-[11px]">
          No open slots calculated. Connect your calendar to identify free slots.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          {blocks.map((block, idx) => (
            <div 
              key={idx} 
              className={`p-3.5 border rounded-[8px] transition-all flex items-start justify-between gap-3 ${
                block.is_deep_work 
                  ? 'bg-amber-50/15 border-amber-200' 
                  : 'bg-slate-50/20 border-slate-150'
              }`}
            >
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-slate-900 leading-tight">
                  {block.label}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatTimeSlot(block.start, block.end)}
                </span>
              </div>

              {block.is_deep_work && (
                <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 border border-amber-250 text-amber-700 rounded-[4px] flex items-center shrink-0 select-none">
                  Deep Work
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
