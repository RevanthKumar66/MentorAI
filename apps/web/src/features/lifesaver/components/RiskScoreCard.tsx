import React from 'react';
import { getRiskLevelStyles, GoalRisk } from '../types/risk';
import { ShieldAlert } from 'lucide-react';

interface RiskScoreCardProps {
  score: number;
  level: GoalRisk['risk_level'];
  compact?: boolean;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ score, level, compact = false }) => {
  const styles = getRiskLevelStyles(level);
  
  const circumference = 113.1;
  const dashOffset = circumference - (score / 100) * circumference;

  let strokeColor = '#10b981'; // emerald
  if (level === 'Moderate Risk') strokeColor = '#f59e0b'; // amber
  if (level === 'High Risk') strokeColor = '#ea580c'; // orange
  if (level === 'Critical') strokeColor = '#e11d48'; // rose

  if (compact) {
    return (
      <div className="p-3 bg-[#fcfbf9] border border-slate-200/60 rounded-[8px] flex items-center gap-2.5 h-14">
        <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 ${styles.badge}`}>
          <span className="text-[10px] font-bold">{score}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-900 leading-none mb-1">{level}</p>
          <p className="text-[9px] text-slate-700 font-medium">Goal Risk Assessment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
          AI Risk Score
        </span>
      </div>

      <div className="relative flex items-center justify-center">
        <svg width="88" height="88" viewBox="0 0 44 44" className="-rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#f1f5f9" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={strokeColor}
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

      <div className={`px-3 py-1 rounded-[6px] border ${styles.badge}`}>
        <p className="text-[10px] font-semibold">{level}</p>
      </div>

      <p className="text-[9.5px] text-slate-600 font-medium text-center">
        Predicted deadline failure risk level
      </p>
    </div>
  );
};
