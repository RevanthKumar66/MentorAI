'use client';

import React from 'react';
import { AIMission, FocusTopTask } from '../types/focus';
import { Clock, Zap, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

interface MissionCardProps {
  mission: AIMission;
  topTasks: FocusTopTask[];
  userName: string;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, topTasks, userName }) => {
  const impactColors = {
    High: 'text-slate-900 bg-slate-100 border-slate-300',
    Medium: 'text-amber-800 bg-amber-50 border-amber-200',
    Low: 'text-slate-700 bg-slate-50 border-slate-200',
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
              Today's Mission
            </span>
          </div>
          <h2 className="text-sm font-semibold text-slate-950 tracking-tight leading-snug">
            {mission.greeting}
          </h2>
        </div>
      </div>

      {/* Mission Summary */}
      <p className="text-[11.5px] text-slate-700 leading-relaxed border-t border-slate-100 pt-4">
        {mission.mission_summary}
      </p>

      {/* Warning */}
      {mission.warning && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200/70 rounded-[8px]">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10.5px] text-amber-800 font-medium leading-snug">
            {mission.warning}
          </p>
        </div>
      )}

      {/* Top Focus Tasks */}
      {topTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
            Focus On These Today
          </p>
          <div className="space-y-1.5">
            {topTasks.map((task, i) => (
              <div
                key={task.task_id}
                className="flex items-center gap-3 py-2 px-3 bg-[#fcfbf9] border border-slate-200/60 rounded-[8px]"
              >
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-900 truncate">
                    {task.task_title}
                  </p>
                  {task.goal_title && (
                    <p className="text-[9.5px] text-slate-600 truncate">{task.goal_title}</p>
                  )}
                </div>
                <span className="text-[9px] font-semibold text-slate-500 shrink-0">
                  {task.priority_score.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <div className="text-center space-y-1">
          <Clock className="w-3.5 h-3.5 text-slate-500 mx-auto" />
          <p className="text-[10px] font-semibold text-slate-900">{mission.estimated_time}</p>
          <p className="text-[9px] text-slate-600 font-medium">Est. Time</p>
        </div>
        <div className="text-center space-y-1">
          <Zap className="w-3.5 h-3.5 text-slate-500 mx-auto" />
          <p className="text-[10px] font-semibold text-slate-900">{mission.impact_level}</p>
          <p className="text-[9px] text-slate-600 font-medium">Impact</p>
        </div>
        <div className="text-center space-y-1">
          <TrendingUp className="w-3.5 h-3.5 text-slate-500 mx-auto" />
          <p className="text-[10px] font-semibold text-slate-900">{mission.progress_boost}</p>
          <p className="text-[9px] text-slate-600 font-medium">Progress Boost</p>
        </div>
      </div>
    </div>
  );
};
