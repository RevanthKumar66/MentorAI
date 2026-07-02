'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { goalService } from '@/features/lifesaver/services/GoalService';
import { taskService } from '@/features/lifesaver/services/TaskService';
import { riskPredictionService } from '@/features/lifesaver/services/RiskPredictionService';
import { recoveryPlanningService } from '@/features/lifesaver/services/RecoveryPlanningService';
import { GoalRisk, RecoveryPlan, getRiskLevelStyles } from '@/features/lifesaver/types/risk';
import { Milestone } from '@/features/lifesaver/types/planner';
import { supabase } from '@/lib/supabase';

import { RiskOverviewCard } from '@/features/lifesaver/components/RiskOverviewCard';
import { ForecastCard } from '@/features/lifesaver/components/ForecastCard';
import { RecoveryPlanCard } from '@/features/lifesaver/components/RecoveryPlanCard';
import { WarningFeed } from '@/features/lifesaver/components/WarningFeed';

import { AlertTriangle, RefreshCw, Brain, Flag } from 'lucide-react';
import Link from 'next/link';

const LOADING_STEPS = [
  'Scanning Goal Progress...',
  'Forecasting Completion Probability...',
  'Assessing Risk Factors...',
  'Building Recovery Strategy...',
  'Finalizing Recommendations...',
];

export default function RiskCenterPage() {
  const [risks, setRisks] = useState<Record<string, GoalRisk>>({});
  const [plans, setPlans] = useState<Record<string, RecoveryPlan>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['lifesaver-goals'],
    queryFn: () => goalService.getGoals(),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['lifesaver-tasks'],
    queryFn: () => taskService.getTasks(),
  });

  const activeGoals = goals.filter((g) => g.status === 'active');

  // Advance loading steps
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setLoadingStep(0), 0);
      return () => clearTimeout(t);
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load existing persisted data on mount
  useEffect(() => {
    if (loadingGoals || loadingTasks || goals.length === 0) return;

    const loadData = async () => {
      try {
        const persistedRisks = await riskPredictionService.loadGoalRisks();
        setRisks(persistedRisks);

        const loadedPlans: Record<string, RecoveryPlan> = {};
        const allWarnings: string[] = [];

        for (const g of activeGoals) {
          const plan = await recoveryPlanningService.getPlanForGoal(g.id);
          if (plan) {
            loadedPlans[g.id] = plan;
          }
          const risk = persistedRisks[g.id];
          if (risk && risk.forecast_summary) {
            if (risk.risk_level === 'High Risk' || risk.risk_level === 'Critical') {
              allWarnings.push(`Goal "${g.title}" is currently at ${risk.risk_level.toLowerCase()} level (${risk.risk_score}/100).`);
            }
          }
        }
        setPlans(loadedPlans);
        setWarnings(allWarnings);
      } catch (err) {
        console.error('Failed to load risk center data:', err);
      }
    };

    loadData();
  }, [goals, loadingGoals, loadingTasks]);

  // Run full analysis pipeline
  const runRiskPipeline = useCallback(async () => {
    if (isLoading || loadingGoals || loadingTasks || activeGoals.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch milestones
      const { data: msData } = await supabase
        .from('lifesaver_milestones')
        .select('*')
        .in('goal_id', activeGoals.map(g => g.id));
      const milestones: Milestone[] = msData || [];

      // Run analysis
      const result = await riskPredictionService.runRiskAnalysis(goals, tasks, milestones);
      setRisks(result.risks);

      const newPlans: Record<string, RecoveryPlan> = {};
      const newWarnings: string[] = [];

      for (const r of result.raw.goals) {
        const goal = goals.find((g) => g.id === r.goal_id);
        if (!goal) continue;

        // Fetch saved recovery plan
        const fullPlan = await recoveryPlanningService.getPlanForGoal(r.goal_id);
        if (fullPlan) {
          newPlans[r.goal_id] = fullPlan;
        }

        // Collect warning strings
        if (r.warnings) {
          newWarnings.push(...r.warnings.map(w => `${goal.title}: ${w}`));
        }
      }

      setPlans(newPlans);
      setWarnings(newWarnings);
    } catch (err) {
      console.error('Risk analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Risk assessment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [goals, tasks, isLoading, loadingGoals, loadingTasks]);

  // Auto-run guard on mount if data is loaded but risks are empty
  const autoRunTriggered = React.useRef(false);
  useEffect(() => {
    if (!loadingGoals && !loadingTasks && activeGoals.length > 0 && Object.keys(risks).length === 0 && !error && !autoRunTriggered.current) {
      autoRunTriggered.current = true;
      const t = setTimeout(() => { void runRiskPipeline(); }, 0);
      return () => clearTimeout(t);
    }
  }, [loadingGoals, loadingTasks, activeGoals.length, risks, error, runRiskPipeline]);

  // Toggle recovery task checkbox
  const handleToggleRecoveryTaskStatus = async (taskId: string, currentStatus: 'pending' | 'completed') => {
    try {
      await recoveryPlanningService.toggleTaskStatus(taskId, currentStatus);
      // Reload recovery plans to update state
      const updatedPlans: Record<string, RecoveryPlan> = { ...plans };
      for (const goalId of Object.keys(plans)) {
        const plan = await recoveryPlanningService.getPlanForGoal(goalId);
        if (plan) {
          updatedPlans[goalId] = plan;
        }
      }
      setPlans(updatedPlans);
    } catch (err) {
      console.error('Failed to toggle recovery task:', err);
    }
  };

  // Calculations for stats overview
  const activeRisks = activeGoals.map((g) => risks[g.id]).filter(Boolean);
  const atRiskCount = activeRisks.filter((r) => r.risk_level === 'Moderate Risk' || r.risk_level === 'High Risk').length;
  const criticalCount = activeRisks.filter((r) => r.risk_level === 'Critical').length;
  const recoveryOpportunities = Object.values(plans).filter((p) => p.recovery_tasks && p.recovery_tasks.some(t => t.status === 'pending')).length;

  const totalProb = activeRisks.reduce((acc, curr) => acc + curr.completion_probability, 0);
  const avgProbability = activeRisks.length > 0 ? Math.round(totalProb / activeRisks.length) : 100;

  // Empty State: No active goals
  if (!loadingGoals && activeGoals.length === 0) {
    return (
      <main className="w-full px-14 py-6">
        <div className="bg-white border border-slate-200/60 rounded-[12px] p-10 text-center space-y-4">
          <Flag className="w-8 h-8 text-slate-450 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-955 uppercase tracking-wider">No Active Goals</h2>
          <p className="text-[10.5px] text-slate-700 font-medium">
            Create active goals to initiate AI risk forecasting and recovery planning.
          </p>
          <Link href="/mentors/momentum/goals?action=create" className="inline-flex py-2 px-4 rounded-[6px] bg-slate-950 text-white text-[10px] font-semibold hover:bg-slate-900 transition-colors">
            Establish New Goal
          </Link>
        </div>
      </main>
    );
  }

  // Loading Screen
  if (isLoading || loadingGoals || loadingTasks) {
    return (
      <main className="w-full px-14 py-6">
        <div className="bg-white border border-slate-200/60 rounded-[12px] min-h-[360px] flex flex-col items-center justify-center gap-6 px-8 py-12">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 border-2 border-slate-200 border-t-slate-950 rounded-full animate-spin" />
            <Brain className="w-6 h-6 text-slate-900 absolute" />
          </div>
          <div className="text-center space-y-2 max-w-sm">
            <h3 className="text-xs font-semibold text-slate-955 uppercase tracking-wider">AI Risk Prediction Engine</h3>
            <p className="text-[10px] text-slate-650 font-semibold animate-pulse">
              {LOADING_STEPS[loadingStep]}
            </p>
          </div>
          <div className="flex gap-1.5">
            {LOADING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i <= loadingStep ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Error Screen
  if (error) {
    return (
      <main className="w-full px-14 py-6">
        <div className="bg-white border border-rose-200 rounded-[12px] p-8 text-center space-y-4">
          <p className="text-[10.5px] text-rose-705 font-medium">{error}</p>
          <button
            onClick={runRiskPipeline}
            className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-[6px] bg-slate-950 text-white text-[10px] font-semibold hover:bg-slate-900 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-14 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
            <h1 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Risk Center
            </h1>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            AI-driven failure predictions and recovery tactics.
          </p>
        </div>
        <button
          onClick={runRiskPipeline}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/60 text-[10px] font-semibold text-slate-955 rounded-[6px] hover:bg-[#fcfbf9] transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Re-Analyze Risks
        </button>
      </div>

      {/* Section 1: Overview stats */}
      <section>
        <RiskOverviewCard
          atRiskCount={atRiskCount}
          criticalCount={criticalCount}
          avgProbability={avgProbability}
          recoveryOpportunities={recoveryOpportunities}
        />
      </section>

      {/* Warnings Feed */}
      {warnings.length > 0 && (
        <section>
          <WarningFeed warnings={warnings} />
        </section>
      )}

      {/* Section 2 & 3: High Risk Goals & Forecasts list */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: At Risk List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">Goal Risk Levels</h2>
          <div className="space-y-2.5">
            {activeGoals.map((g) => {
              const risk = risks[g.id];
              if (!risk) return null;
              const styles = getRiskLevelStyles(risk.risk_level);
              return (
                <div key={g.id} className="p-3 bg-white border border-slate-200/60 rounded-[8px] space-y-2">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <span className="text-[11.5px] font-bold text-slate-955 truncate block">{g.title}</span>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-bold border shrink-0 uppercase tracking-wider ${styles.badge}`}>
                      {risk.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-semibold text-slate-700">
                    <span>Risk Score: {risk.risk_score}/100</span>
                    <span>Prob: {risk.completion_probability}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Forecasts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">Forecast Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((g) => {
              const risk = risks[g.id];
              if (!risk) return null;

              // Compute current completed task count vs total
              const goalTasks = tasks.filter((t) => t.goal_id === g.id);
              const total = goalTasks.length;
              const completed = goalTasks.filter((t) => t.status === 'completed').length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <ForecastCard
                  key={g.id}
                  goalTitle={g.title}
                  currentProgress={pct}
                  predictedProgress={risk.completion_probability}
                  forecastText={risk.forecast_summary || 'Trajectory is currently stable.'}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Recovery Plans */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">Tactical Recovery Plans</h2>
        {Object.keys(plans).length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-[12px] p-8 text-center">
            <p className="text-[10px] text-slate-700 font-semibold italic">No active recovery plans required. All goals are in good shape!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeGoals.map((g) => {
              const plan = plans[g.id];
              if (!plan) return null;
              return (
                <RecoveryPlanCard
                  key={g.id}
                  plan={plan}
                  onToggleTaskStatus={handleToggleRecoveryTaskStatus}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
