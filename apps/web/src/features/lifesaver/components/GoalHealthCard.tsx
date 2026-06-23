'use client';

import React from 'react';
import { GoalHealth, GoalHealthStatus, getHealthLabel } from '../types/focus';
import { Calendar, CheckCircle2, Target } from 'lucide-react';

interface GoalHealthCardProps {
  health: GoalHealth;
  compact?: boolean;
}

const healthStyles: Record<GoalHealthStatus, { badge: string; dot: string; bar: string }> = {
  ON_TRACK: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-400',
  },
  AT_RISK: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    bar: 'bg-amber-400',
  },
  CRITICAL: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    bar: 'bg-rose-400',
  },
};

export const GoalHealthCard: React.FC<GoalHealthCardProps> = ({ health, compact = false }) => {
  const styles = healthStyles[health.health];
  const msProgress =
    health.milestones_total > 0
      ? Math.round((health.milestones_completed / health.milestones_total) * 100)
      : 0;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2.5 px-3 bg-white border border-slate-200/60 rounded-[8px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
          <span className="text-[11px] font-semibold text-slate-900 truncate">{health.goal_title}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-semibold border shrink-0 ${styles.badge}`}>
          {getHealthLabel(health.health)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[10px] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <h4 className="text-[11.5px] font-semibold text-slate-950 truncate">{health.goal_title}</h4>
        </div>
        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-semibold border shrink-0 ${styles.badge}`}>
          {getHealthLabel(health.health)}
        </span>
      </div>

      {/* Progress bar */}
      {health.milestones_total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-medium text-slate-600">Milestone Progress</span>
            <span className="text-[9.5px] font-semibold text-slate-900">{msProgress}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${styles.bar}`}
              style={{ width: `${msProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1 text-[9.5px] text-slate-600 font-medium">
          <Calendar className="w-3 h-3 text-slate-400" />
          {health.days_remaining} days left
        </span>
        {health.milestones_total > 0 && (
          <span className="flex items-center gap-1 text-[9.5px] text-slate-600 font-medium">
            <CheckCircle2 className="w-3 h-3 text-slate-400" />
            {health.milestones_completed}/{health.milestones_total} milestones
          </span>
        )}
      </div>
    </div>
  );
};
