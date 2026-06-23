'use client';

import React from 'react';
import { Sparkles, Calendar, TrendingUp } from 'lucide-react';

interface CoachCardProps {
  message: string;
  focusScore?: number | null;
  productivityScore?: number | null;
  createdAt?: string;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  message,
  focusScore,
  productivityScore,
  createdAt,
}) => {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4 hover:border-slate-300 transition-all duration-200 shadow-sm relative overflow-hidden group">
      {/* Subtle decorative background accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/40 rounded-full blur-2xl -mr-4 -mt-4 transition-all duration-300 group-hover:bg-amber-50/60" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] bg-amber-50 border border-amber-250 flex items-center justify-center text-amber-700 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[12px] font-semibold text-slate-900 tracking-tight">AI Chief of Staff</h4>
            <span className="text-[9.5px] font-medium text-slate-700 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {formattedDate}
            </span>
          </div>
        </div>
        
        {/* Scores */}
        <div className="flex items-center gap-2">
          {focusScore !== undefined && focusScore !== null && (
            <div className="text-right">
              <span className="text-[8px] text-slate-700 font-semibold uppercase tracking-wider block">Focus Score</span>
              <span className="text-xs font-semibold text-slate-900">{focusScore}/100</span>
            </div>
          )}
          {productivityScore !== undefined && productivityScore !== null && (
            <div className="text-right border-l border-slate-100 pl-2">
              <span className="text-[8px] text-slate-700 font-semibold uppercase tracking-wider block">Completed</span>
              <span className="text-xs font-semibold text-slate-900">{productivityScore}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Message Body */}
      <div className="relative z-10">
        <p className="text-[11.5px] leading-relaxed text-slate-800 font-medium italic">
          "{message}"
        </p>
      </div>

      {/* Quick advice note */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[9.5px] text-slate-700 font-semibold relative z-10">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Today's Strategy: Focus on high leverage actions & clear backlog.</span>
      </div>
    </div>
  );
};

export default CoachCard;
