import React from 'react';

interface DifficultyBadgeProps {
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const colors: Record<string, string> = {
    beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    intermediate: 'bg-amber-50 text-amber-700 border-amber-200/60',
    advanced: 'bg-rose-50 text-rose-700 border-rose-200/60',
  };

  const normalized = (difficulty || '').toLowerCase();
  const colorClass = colors[normalized] || 'bg-slate-50 text-slate-700 border-slate-200/60';

  return (
    <span className={`px-2 py-0.5 text-[9.5px] font-semibold rounded-[4px] border ${colorClass} capitalize`}>
      {difficulty}
    </span>
  );
};
export default DifficultyBadge;
