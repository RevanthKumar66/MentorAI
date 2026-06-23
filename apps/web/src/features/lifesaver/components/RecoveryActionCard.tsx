'use client';

import React, { useState } from 'react';
import { ShieldAlert, Plus, Zap, Check, RotateCw, Loader2 } from 'lucide-react';
import { AIRecoveryAction } from '../types/execution';
import { GoalRisk } from '../types/risk';

interface RecoveryActionCardProps {
  recoveryActions: AIRecoveryAction[];
  goalRisks: GoalRisk[];
  onApplyPlan: (goalId: string, tasks: string[]) => Promise<void>;
  onGenerateAlternative: (goalId: string) => Promise<void>;
}

export const RecoveryActionCard: React.FC<RecoveryActionCardProps> = ({
  recoveryActions,
  goalRisks,
  onApplyPlan,
  onGenerateAlternative,
}) => {
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [alternativeLoadingId, setAlternativeLoadingId] = useState<string | null>(null);
  const [appliedGoals, setAppliedGoals] = useState<string[]>([]);

  const handleApply = async (goalId: string, tasks: string[]) => {
    setApplyingId(goalId);
    try {
      await onApplyPlan(goalId, tasks);
      setAppliedGoals((prev) => [...prev, goalId]);
    } catch (err) {
      console.error('Failed to apply recovery plan:', err);
    } finally {
      setApplyingId(null);
    }
  };

  const handleGenerateAlt = async (goalId: string) => {
    setAlternativeLoadingId(goalId);
    try {
      await onGenerateAlternative(goalId);
    } catch (err) {
      console.error('Failed to generate alternative plan:', err);
    } finally {
      setAlternativeLoadingId(null);
    }
  };

  if (recoveryActions.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 text-center space-y-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
          <Zap className="w-4 h-4" />
        </div>
        <h4 className="text-[12px] font-semibold text-slate-900">Goals Safe & Healthy</h4>
        <p className="text-[10px] text-slate-700 max-w-[280px] mx-auto">
          None of your active goals are at critical risk. Recovery plans are not needed.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-[8px] bg-amber-50 border border-amber-250 flex items-center justify-center text-amber-600 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-[12px] font-semibold text-slate-900 tracking-tight">Active Recovery Plans</h4>
          <p className="text-[9.5px] text-slate-700">
            Emergency interventions generated for your highest risk objectives.
          </p>
        </div>
      </div>

      {/* Recovery Plans List */}
      <div className="space-y-4">
        {recoveryActions.map((plan, index) => {
          // Find current risk metrics
          const currentRisk = goalRisks.find((r) => r.goal_id === plan.goal_id);
          const currentProb = currentRisk ? currentRisk.completion_probability : 42;
          const boostMatch = plan.expected_improvement.match(/\+?(\d+)/);
          const boostVal = boostMatch ? parseInt(boostMatch[1], 10) : 15;
          const recoveryProb = Math.min(100, currentProb + boostVal);

          return (
            <div
              key={index}
              className="p-4 bg-[#fffbeb] border border-amber-200 rounded-[10px] space-y-3"
            >
              {/* Title / expected improvement */}
              <div>
                <span className="text-[11.5px] font-semibold text-amber-955 block">
                  {plan.goal_title || 'Recovery Strategy'}
                </span>
                <span className="text-[9.5px] text-amber-800 font-medium block mt-0.5 leading-normal">
                  Action: {plan.immediate_recovery_action}
                </span>
              </div>

              {/* Visual Probability Comparison */}
              <div className="grid grid-cols-3 gap-2 bg-white/70 border border-amber-250/30 p-2 rounded-[6px] text-center select-none">
                <div className="border-r border-amber-100/60 pr-1">
                  <span className="text-[7.5px] text-slate-700 block uppercase tracking-wider font-semibold">Current</span>
                  <span className="text-rose-600 font-bold text-[11.5px]">{currentProb}%</span>
                </div>
                <div className="border-r border-amber-100/60 pr-1">
                  <span className="text-[7.5px] text-slate-700 block uppercase tracking-wider font-semibold">Recovery</span>
                  <span className="text-emerald-700 font-bold text-[11.5px]">{recoveryProb}%</span>
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-700 block uppercase tracking-wider font-semibold">Boost</span>
                  <span className="text-emerald-700 font-bold text-[11px]">+{boostVal}%</span>
                </div>
              </div>

              {/* Recovery Tasks List */}
              <div className="space-y-1.5 pt-1 border-t border-amber-100/50">
                <span className="text-[8.5px] font-semibold text-amber-800 uppercase tracking-wider block">
                  Immediate Action Steps:
                </span>
                <ul className="space-y-1">
                  {plan.priority_recovery_tasks.map((task, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[10px] text-amber-900 font-medium leading-relaxed">
                      <Plus className="w-3 h-3 text-amber-700 mt-0.5 shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-100/50">
                <button
                  disabled={applyingId === plan.goal_id || alternativeLoadingId === plan.goal_id}
                  onClick={() => handleGenerateAlt(plan.goal_id)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] border border-amber-200 text-[9px] font-semibold text-amber-900 bg-white hover:bg-amber-50/50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {alternativeLoadingId === plan.goal_id ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <RotateCw className="w-2.5 h-2.5" />
                  )}
                  Alternative
                </button>
                <button
                  disabled={applyingId === plan.goal_id || appliedGoals.includes(plan.goal_id)}
                  onClick={() => handleApply(plan.goal_id, plan.priority_recovery_tasks)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] bg-slate-950 text-white text-[9px] font-semibold hover:bg-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {applyingId === plan.goal_id ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : appliedGoals.includes(plan.goal_id) ? (
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <Check className="w-2.5 h-2.5" />
                  )}
                  {appliedGoals.includes(plan.goal_id) ? 'Applied' : 'Apply Recovery'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecoveryActionCard;
