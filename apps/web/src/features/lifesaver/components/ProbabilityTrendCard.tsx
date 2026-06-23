import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ProbabilityTrendCardProps {
  currentProb: number;
  recoveredProb: number;
}

export const ProbabilityTrendCard: React.FC<ProbabilityTrendCardProps> = ({
  currentProb,
  recoveredProb,
}) => {
  const delta = recoveredProb - currentProb;

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-4 flex items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="text-[9.5px] font-semibold text-slate-705 uppercase tracking-wider block">
          Recovery Potential
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-slate-900">{recoveredProb}%</span>
          {delta > 0 && (
            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
              <ArrowUpRight className="w-2.5 h-2.5" />
              +{delta}% Boost
            </span>
          )}
        </div>
        <p className="text-[8.5px] text-slate-700 font-medium leading-none">
          If Recovery Plan is fully executed
        </p>
      </div>

      <div className="h-10 w-px bg-slate-100 shrink-0" />

      <div className="text-right space-y-1">
        <span className="text-[9.5px] font-semibold text-slate-705 uppercase tracking-wider block">
          Current Path
        </span>
        <span className="text-lg font-bold text-slate-500 block leading-none">{currentProb}%</span>
        <p className="text-[8.5px] text-slate-700 font-medium leading-none">
          On your current pace
        </p>
      </div>
    </div>
  );
};
export default ProbabilityTrendCard;
