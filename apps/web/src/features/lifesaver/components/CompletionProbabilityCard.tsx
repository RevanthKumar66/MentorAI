import React from 'react';

interface CompletionProbabilityCardProps {
  probability: string; // e.g. "85%"
}

export const CompletionProbabilityCard: React.FC<CompletionProbabilityCardProps> = ({ probability }) => {
  const percentage = parseInt(probability.replace(/[^0-9]/g, '')) || 0;
  
  return (
    <div className="p-4 bg-white border border-slate-200/60 rounded-[12px] space-y-2">
      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
        <span>Completion Probability</span>
        <span className="text-slate-950 font-bold text-xs">{probability}</span>
      </div>
      <div className="w-full bg-[#f4f3f0] h-1.5 rounded-full overflow-hidden border border-slate-150">
        <div 
          className="bg-slate-900 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[9.5px] text-slate-700 font-medium leading-normal">
        Calculated from daily available hours, experience level, and deadline duration.
      </p>
    </div>
  );
};
export default CompletionProbabilityCard;
