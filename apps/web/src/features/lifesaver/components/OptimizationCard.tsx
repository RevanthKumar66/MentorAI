'use client';

import React from 'react';
import { Sliders, CheckCircle2 } from 'lucide-react';

interface OptimizationCardProps {
  suggestions: string[];
}

export const OptimizationCard: React.FC<OptimizationCardProps> = ({ suggestions }) => {
  if (suggestions.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 text-center space-y-2">
        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <Sliders className="w-4 h-4" />
        </div>
        <h4 className="text-[12px] font-semibold text-slate-900">Workloads Optimized</h4>
        <p className="text-[10px] text-slate-700 max-w-[280px] mx-auto">
          Your current workload is perfectly balanced. No optimization suggestions needed.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-[8px] bg-emerald-50 border border-emerald-250 flex items-center justify-center text-emerald-700 shrink-0">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-[12px] font-semibold text-slate-900 tracking-tight">Workload Optimizations</h4>
          <p className="text-[9.5px] text-slate-700">
            Intelligent recommendations to balance task lists and prevent burnout.
          </p>
        </div>
      </div>

      {/* Optimizations List */}
      <div className="space-y-2.5">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-2.5 bg-slate-50/40 border border-slate-100 rounded-[8px] hover:bg-slate-50 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed text-slate-800 font-medium">
              {suggestion}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptimizationCard;
