import React from 'react';
import { RecoveryPlan } from '../types/risk';
import { RecoveryTaskCard } from './RecoveryTaskCard';
import { Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

interface RecoveryPlanCardProps {
  plan: RecoveryPlan;
  onToggleTaskStatus?: (id: string, currentStatus: 'pending' | 'completed') => void;
}

export const RecoveryPlanCard: React.FC<RecoveryPlanCardProps> = ({ plan, onToggleTaskStatus }) => {
  const improvement = plan.predicted_probability - plan.current_probability;

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-900 shrink-0" />
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            AI Recovery Plan
          </h4>
        </div>
        
        {/* Probability Improvement Indicator */}
        <div className="flex items-center gap-2 bg-[#fcfbf9] border border-slate-200/60 px-2.5 py-1 rounded-[6px]">
          <span className="text-[10px] text-slate-600 font-semibold">{plan.current_probability}%</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-emerald-700 font-bold">{plan.predicted_probability}%</span>
          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded">
            +{improvement}%
          </span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-[10.5px] text-slate-705 font-medium leading-relaxed">
        {plan.plan_summary}
      </p>

      {/* Recovery Tasks List */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-700" />
          <span className="text-[9.5px] font-semibold text-slate-700 uppercase tracking-wider">
            Required Recovery Steps ({plan.recovery_tasks?.length ?? 0})
          </span>
        </div>

        {(!plan.recovery_tasks || plan.recovery_tasks.length === 0) ? (
          <p className="text-[10px] text-slate-500 font-medium italic">No recovery steps generated.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {plan.recovery_tasks.map((task) => (
              <RecoveryTaskCard
                key={task.id}
                task={task}
                onToggleStatus={onToggleTaskStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default RecoveryPlanCard;
