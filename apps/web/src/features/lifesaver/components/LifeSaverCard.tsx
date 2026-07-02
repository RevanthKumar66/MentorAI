import React from 'react';
import { Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface LifeSaverCardProps {
  activeGoalsCount: number;
  pendingTasksCount: number;
  completionRate: number;
}

export const LifeSaverCard: React.FC<LifeSaverCardProps> = ({
  activeGoalsCount,
  pendingTasksCount,
  completionRate,
}) => {
  return (
    <div className="bg-[#fcfbf9] text-slate-950 border border-slate-200/60 rounded-[12px] p-5 select-none flex flex-col justify-between min-h-[180px] relative overflow-hidden group">
      {/* Decorative gradient blur */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-slate-200/25 rounded-full blur-2xl group-hover:bg-slate-200/40 transition-all duration-500" />
      
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-[6px] bg-slate-900 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-semibold text-slate-600 tracking-widest uppercase">Momentum AI</span>
        </div>
        
        <h3 className="text-sm font-semibold tracking-tight leading-snug mb-1 text-slate-950">
          Never Miss What Matters
        </h3>
        <p className="text-[10.5px] text-slate-700 leading-relaxed max-w-[340px]">
          AI productivity companion that helps you plan, prioritize, and complete goals before deadlines are missed.
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-4">
        {/* Short stats summary */}
        <div className="flex items-center gap-4 text-left">
          <div>
            <span className="text-[8px] font-semibold text-slate-600 block uppercase">Active Goals</span>
            <span className="text-xs font-semibold text-slate-950">{activeGoalsCount}</span>
          </div>
          <div>
            <span className="text-[8px] font-semibold text-slate-600 block uppercase">Pending Tasks</span>
            <span className="text-xs font-semibold text-slate-950">{pendingTasksCount}</span>
          </div>
          <div>
            <span className="text-[8px] font-semibold text-slate-600 block uppercase">Completion</span>
            <span className="text-xs font-semibold text-slate-950">{completionRate}%</span>
          </div>
        </div>

        <Link
          href="/mentors/momentum"
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold text-[10.5px] rounded-[6px] transition-all duration-200 shrink-0 cursor-pointer"
        >
          Open Dashboard
          <ChevronRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
export default LifeSaverCard;
