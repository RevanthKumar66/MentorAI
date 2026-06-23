'use client';

import React from 'react';
import { Cpu, Activity, Loader2, Award, Zap, AlertCircle } from 'lucide-react';

interface ExecutionSummaryCardProps {
  focusScore: number | null;
  completionRate: number;
  totalTasks: number;
  missedTasksCount: number;
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
}

export const ExecutionSummaryCard: React.FC<ExecutionSummaryCardProps> = ({
  focusScore,
  completionRate,
  totalTasks,
  missedTasksCount,
  onAnalyze,
  isAnalyzing,
}) => {
  // Calculate execution score: combination of Focus Score and Completion Rate
  const executionScore = focusScore !== null
    ? Math.round(focusScore * 0.4 + completionRate * 0.6)
    : completionRate;

  return (
    <div className="p-5 rounded-[12px] border border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100/40 space-y-4 shadow-sm">
      {/* Upper row: Title and Trigger Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] font-semibold text-slate-700 tracking-wider uppercase block">
            System Control
          </span>
          <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">
            AI Chief of Staff Console
          </h3>
          <p className="text-[10px] text-slate-700 font-medium leading-relaxed max-w-[280px]">
            Run execution analysis to detect patterns, suggest reschedules, and update coaching plans.
          </p>
        </div>

        <button
          disabled={isAnalyzing}
          onClick={onAnalyze}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-slate-950 text-white text-[11px] font-semibold hover:bg-slate-900 transition-colors shadow-sm disabled:opacity-70 shrink-0 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5" />
              Analyze Patterns
            </>
          )}
        </button>
      </div>

      {/* Grid of micro-stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {/* Hero Execution Score */}
        <div className="p-2.5 bg-white border border-slate-250 rounded-[8px] space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-50/20 rounded-full blur-sm" />
          <span className="text-[8px] text-slate-750 font-bold uppercase tracking-wider block">
            Execution Score
          </span>
          <div className="flex items-center gap-1 relative z-10">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-[14px] font-extrabold text-slate-950">
              {executionScore}/100
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200/50 rounded-[8px] space-y-1">
          <span className="text-[8px] text-slate-700 font-semibold uppercase tracking-wider block">
            Daily Focus
          </span>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="text-[12px] font-bold text-slate-955">
              {focusScore !== null ? `${focusScore}/100` : 'N/A'}
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200/50 rounded-[8px] space-y-1">
          <span className="text-[8px] text-slate-700 font-semibold uppercase tracking-wider block">
            Completion Rate
          </span>
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="text-[12px] font-bold text-slate-955">
              {completionRate}%
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-white border border-slate-200/50 rounded-[8px] space-y-1">
          <span className="text-[8px] text-slate-700 font-semibold uppercase tracking-wider block">
            Missed Tasks
          </span>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${missedTasksCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[12px] font-bold text-slate-955">
              {missedTasksCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionSummaryCard;
