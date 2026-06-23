import React from 'react';
import { RecoverySchedule } from '../types/scheduling';
import { ShieldAlert, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  plan: any; // Can pass the parsed recoveryPlan from SchedulingAnalysisResponse
}

export function RecoveryScheduleCard({ plan }: Props) {
  if (!plan) {
    return (
      <div className="bg-white border border-slate-200 rounded-[12px] p-6 text-center space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          Autonomous Recovery Schedule
        </h3>
        <div className="py-6 flex flex-col items-center gap-2 text-slate-500 text-[11px]">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <span className="font-semibold text-slate-800">All Goals Safe & Healthy</span>
          <span>No recovery actions needed. Keep maintaining execution velocity!</span>
        </div>
      </div>
    );
  }

  const boost = plan.predicted_probability - plan.current_probability;

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
        Autonomous Recovery Schedule
      </h3>

      <div className="space-y-4">
        {/* Goal details */}
        <div>
          <span className="text-[10px] font-bold text-rose-700 px-2 py-0.5 bg-rose-50 border border-rose-250 rounded-[4px]">
            Goal Critical Alert
          </span>
          <h4 className="text-xs font-bold text-slate-950 mt-1.5 leading-snug">
            {plan.goal_title}
          </h4>
        </div>

        {/* Probability comparison */}
        <div className="border border-slate-100 bg-slate-50/20 p-3 rounded-[8px] space-y-2.5">
          <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
            <span className="text-[9.5px] font-bold text-slate-800 uppercase tracking-wider">Forecast Comparison</span>
            {boost > 0 && (
              <div className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-[4px] flex items-center shrink-0">
                +{boost}% Boost
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <span className="block text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Current</span>
              <span className="block text-sm font-bold text-slate-800">{plan.current_probability}% Success</span>
            </div>
            <div className="space-y-0.5 border-l border-slate-200 pl-3">
              <span className="block text-[9.5px] font-semibold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-500 shrink-0" />
                With Plan
              </span>
              <span className="block text-sm font-bold text-indigo-700">{plan.predicted_probability}% Success</span>
            </div>
          </div>
        </div>

        {/* Generated plan text */}
        <div className="space-y-2">
          <span className="block text-[10px] font-bold text-slate-800">Actionable Recovery Timeline</span>
          <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-[10.5px] text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-[180px] overflow-y-auto pr-1">
            {plan.generated_plan}
          </div>
        </div>

        {/* Specific recovery tasks checklist */}
        {plan.recovery_tasks && plan.recovery_tasks.length > 0 && (
          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-slate-800">Priority Recovery Tasks</span>
            <div className="space-y-2">
              {plan.recovery_tasks.map((t: any, idx: number) => (
                <div key={idx} className="p-2.5 border border-slate-150 bg-white rounded-[6px] space-y-1 shadow-xs">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10.5px] font-bold text-slate-900 leading-tight">{t.title}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-slate-50 border border-slate-200 text-slate-550 rounded-[4px]">
                      {t.end_time ? new Date(t.end_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'Soon'}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-[10px] text-slate-500 leading-normal">{t.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
