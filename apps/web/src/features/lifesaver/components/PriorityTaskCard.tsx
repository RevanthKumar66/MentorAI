'use client';

import React from 'react';
import { Calendar, Target } from 'lucide-react';
import { TaskScore, getPriorityScoreLabel } from '../types/focus';
import { Task } from '../types/task';
import { Goal } from '../types/goal';

interface PriorityTaskCardProps {
  task: Task;
  score: TaskScore;
  goal: Goal | null;
}

const scoreRingColor = (score: number) => {
  if (score >= 80) return 'text-rose-600 border-rose-200 bg-rose-50';
  if (score >= 60) return 'text-amber-700 border-amber-200 bg-amber-50';
  if (score >= 40) return 'text-slate-700 border-slate-200 bg-slate-50';
  return 'text-slate-500 border-slate-200 bg-slate-50';
};

const labelColors: Record<string, string> = {
  Critical: 'bg-rose-100 text-rose-700 border-rose-200',
  High: 'bg-amber-100 text-amber-700 border-amber-200',
  Medium: 'bg-slate-100 text-slate-700 border-slate-200',
  Low: 'bg-slate-50 text-slate-500 border-slate-200',
};

export const PriorityTaskCard: React.FC<PriorityTaskCardProps> = ({ task, score, goal }) => {
  const label = getPriorityScoreLabel(score.priority_score);
  const ringCls = scoreRingColor(score.priority_score);
  const labelCls = labelColors[label];

  const formattedDue = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  const reasonText = (() => {
    if (score.urgency_score >= 90) return 'Deadline is today — immediate action required.';
    if (score.urgency_score >= 80) return 'Deadline approaching within 1 day.';
    if (score.urgency_score >= 65) return 'Due within 3 days, escalating urgency.';
    if (score.goal_alignment_score >= 80) return 'Critical to an active, high-priority goal.';
    if (score.impact_score >= 75) return 'High impact on current milestone progress.';
    return 'Contributes meaningfully to your active roadmap.';
  })();

  return (
    <div className="bg-white border border-slate-200/60 rounded-[10px] p-4 flex items-start gap-4 hover:border-slate-300 transition-colors">
      {/* Score Ring */}
      <div className={`w-11 h-11 rounded-[8px] border flex flex-col items-center justify-center shrink-0 ${ringCls}`}>
        <span className="text-sm font-semibold leading-none">{score.priority_score.toFixed(0)}</span>
        <span className="text-[8px] font-semibold mt-0.5 uppercase tracking-wide">Score</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-[11.5px] font-semibold text-slate-950 leading-snug truncate">{task.title}</h4>
          <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-semibold border ${labelCls} shrink-0`}>
            {label}
          </span>
        </div>

        <p className="text-[10px] text-slate-600 leading-snug">{reasonText}</p>

        <div className="flex items-center gap-3 flex-wrap">
          {goal && (
            <span className="flex items-center gap-1 text-[9.5px] text-slate-600 font-medium">
              <Target className="w-3 h-3 text-slate-400" />
              {goal.title}
            </span>
          )}
          {formattedDue && (
            <span className="flex items-center gap-1 text-[9.5px] text-slate-600 font-medium">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
