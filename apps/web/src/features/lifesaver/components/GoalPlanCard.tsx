import React from 'react';
import { GoalPlan } from '../types/planner';
import { DifficultyBadge } from './DifficultyBadge';
import { CompletionProbabilityCard } from './CompletionProbabilityCard';
import { Clock, GraduationCap, Folder } from 'lucide-react';

interface GoalPlanCardProps {
  plan: GoalPlan;
  category?: string | null;
  hoursPerDay?: string | null;
  experienceLevel?: string | null;
}

export const GoalPlanCard: React.FC<GoalPlanCardProps> = ({
  plan,
  category,
  hoursPerDay,
  experienceLevel,
}) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">AI Strategist Overview</h3>
        {plan.difficulty && <DifficultyBadge difficulty={plan.difficulty} />}
      </div>
      
      <p className="text-xs text-slate-800 leading-relaxed font-medium">
        {plan.summary || "No summary generated for this plan."}
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
        {category && (
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-700 capitalize">
            <Folder className="w-3.5 h-3.5 text-slate-500" />
            <span>Category: {category}</span>
          </div>
        )}
        {hoursPerDay && (
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-700 capitalize">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Hours: {hoursPerDay}</span>
          </div>
        )}
        {experienceLevel && (
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-700 capitalize">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
            <span>Level: {experienceLevel}</span>
          </div>
        )}
      </div>
      
      {plan.completion_probability && (
        <div className="border-t border-slate-100 pt-3">
          <CompletionProbabilityCard probability={plan.completion_probability} />
        </div>
      )}
    </div>
  );
};
export default GoalPlanCard;
