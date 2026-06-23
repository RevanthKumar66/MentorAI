'use client';

import React from 'react';
import { Crosshair } from 'lucide-react';

interface FocusScoreCardProps {
  score: number;
  label: string;
  compact?: boolean;
}

const labelColor = (score: number) => {
  if (score >= 80) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 60) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (score >= 40) return { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };
  return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
};

const ringStroke = (score: number) => {
  if (score >= 80) return '#10b981'; // emerald
  if (score >= 60) return '#f59e0b'; // amber
  if (score >= 40) return '#64748b'; // slate
  return '#f43f5e'; // rose
};

export const FocusScoreCard: React.FC<FocusScoreCardProps> = ({ score, label, compact = false }) => {
  const clrs = labelColor(score);
  const stroke = ringStroke(score);
  // SVG arc: circumference = 2π × 18 ≈ 113.1
  const circumference = 113.1;
  const dashOffset = circumference - (score / 100) * circumference;

  if (compact) {
    return (
      <div className="p-3 bg-[#fcfbf9] border border-slate-200/60 rounded-[8px] flex items-center gap-2.5 h-14">
        <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 ${score >= 80 ? 'bg-emerald-900 text-emerald-100' : score >= 60 ? 'bg-amber-900 text-amber-100' : score >= 40 ? 'bg-slate-800 text-slate-200' : 'bg-rose-900 text-rose-100'}`}>
          <span className="text-[10px] font-semibold">{score}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-900 leading-none mb-1">{label}</p>
          <p className="text-[9px] text-slate-700 font-medium">AI Focus Score</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Crosshair className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
          AI Focus Score
        </span>
      </div>

      {/* SVG ring */}
      <div className="relative flex items-center justify-center">
        <svg width="88" height="88" viewBox="0 0 44 44" className="-rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#f1f5f9" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-xl font-semibold text-slate-950 leading-none">{score}</p>
          <p className="text-[8px] text-slate-500 font-semibold">/ 100</p>
        </div>
      </div>

      <div className={`px-3 py-1 rounded-[6px] border ${clrs.bg} ${clrs.border}`}>
        <p className={`text-[10px] font-semibold ${clrs.text}`}>{label}</p>
      </div>

      <p className="text-[9.5px] text-slate-600 font-medium text-center">
        Today's alignment with your priorities
      </p>
    </div>
  );
};
