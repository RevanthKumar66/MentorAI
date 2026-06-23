import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  gradientFrom?: string;
  gradientTo?: string;
  iconColorClass?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  description,
  gradientFrom = 'from-slate-50',
  gradientTo = 'to-slate-100/40',
  iconColorClass = 'text-slate-800',
}) => {
  return (
    <div className={`p-5 rounded-[12px] border border-slate-200/60 bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-start justify-between gap-4 transition-all`}>
      <div className="space-y-1 min-w-0">
        <span className="text-[10px] font-semibold text-slate-700 tracking-wider uppercase block">{label}</span>
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">{value}</h3>
        {description && (
          <p className="text-[10px] text-slate-700 font-medium truncate leading-normal">{description}</p>
        )}
      </div>
      <div className="w-8 h-8 rounded-[8px] bg-white/80 border border-slate-200/50 flex items-center justify-center shrink-0">
        <Icon className={`w-4 h-4 ${iconColorClass}`} />
      </div>
    </div>
  );
};
export default StatsCard;
