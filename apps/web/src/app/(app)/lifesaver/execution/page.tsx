'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { goalRepository } from '@/features/lifesaver/repositories/GoalRepository';
import { taskRepository } from '@/features/lifesaver/repositories/TaskRepository';
import { goalRiskRepository } from '@/features/lifesaver/repositories/GoalRiskRepository';
import { executionAgentService } from '@/features/lifesaver/services/ExecutionAgentService';
import { Goal } from '@/features/lifesaver/types/goal';
import { Task } from '@/features/lifesaver/types/task';
import { Milestone } from '@/features/lifesaver/types/planner';
import { GoalRisk } from '@/features/lifesaver/types/risk';
import { RescheduleSuggestion, CoachingLog, ProductivityInsight, AIRecoveryAction } from '@/features/lifesaver/types/execution';

// Components
import { CoachCard } from '@/features/lifesaver/components/CoachCard';
import { RescheduleCard } from '@/features/lifesaver/components/RescheduleCard';
import { InsightCard } from '@/features/lifesaver/components/InsightCard';
import { OptimizationCard } from '@/features/lifesaver/components/OptimizationCard';
import { RecoveryActionCard } from '@/features/lifesaver/components/RecoveryActionCard';
import { ExecutionSummaryCard } from '@/features/lifesaver/components/ExecutionSummaryCard';
import { Cpu, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { calendarIntegrationService } from '@/features/lifesaver/services/CalendarIntegrationService';

export default function ExecutionAgentPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [goalRisks, setGoalRisks] = useState<GoalRisk[]>([]);
  const [reschedules, setReschedules] = useState<RescheduleSuggestion[]>([]);
  const [coachingLogs, setCoachingLogs] = useState<CoachingLog[]>([]);
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [optimizations, setOptimizations] = useState<string[]>([]);
  const [recoveryActions, setRecoveryActions] = useState<AIRecoveryAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      try {
        const conn = await calendarIntegrationService.fetchConnection();
        setCalendarEmail(conn ? conn.email : null);
      } catch (err) {
        console.error('Failed to load calendar connection status:', err);
      }

      const loadedGoals = await goalRepository.listGoals();
      setGoals(loadedGoals);

      const loadedTasks = await taskRepository.listTasks();
      setTasks(loadedTasks);

      // Load milestones for active goals
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId && loadedGoals.length > 0) {
        const { data: msData } = await supabase
          .from('lifesaver_milestones')
          .select('*')
          .eq('user_id', userId);
        setMilestones(msData || []);
      }

      // Load risks
      const risksMap = await goalRiskRepository.getRisksForUser();
      setGoalRisks(Object.values(risksMap));

      // Load Sprint 5 db state
      const suggestions = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(suggestions);

      const logs = await executionAgentService.loadCoachingLogs();
      setCoachingLogs(logs);

      const loadedInsights = await executionAgentService.loadProductivityInsights();
      setInsights(loadedInsights);

      // Load cached suggestions from local storage
      const cachedOpts = localStorage.getItem('mentorai_execution_optimizations');
      if (cachedOpts) setOptimizations(JSON.parse(cachedOpts));

      const cachedRecovery = localStorage.getItem('mentorai_execution_recovery');
      if (cachedRecovery) {
        const parsed = JSON.parse(cachedRecovery) as AIRecoveryAction[];
        const resolved = parsed.map((action) => {
          const goal = loadedGoals.find((g) => g.id === action.goal_id);
          return {
            ...action,
            goal_title: goal ? goal.title : action.goal_title,
          };
        });
        setRecoveryActions(resolved);
      }
    } catch (error) {
      console.error('Failed to load execution page data:', error);
      setErrorMessage('Could not load workspace execution data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        void loadData();
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [loadData]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === 'completed').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Focus score defaults to completion rate + 10 points (max 100)
      const focusScore = totalTasks > 0 ? Math.min(100, Math.max(30, completionRate + 15)) : 75;

      const data = await executionAgentService.runExecutionAnalysis(
        goals,
        tasks,
        milestones,
        focusScore,
        goalRisks
      );

      // Cache optimizations and recovery actions in local storage for refresh persistence
      localStorage.setItem('mentorai_execution_optimizations', JSON.stringify(data.optimizationSuggestions));
      localStorage.setItem('mentorai_execution_recovery', JSON.stringify(data.recoveryActions));

      setOptimizations(data.optimizationSuggestions);

      const resolvedRecovery = data.recoveryActions.map((action) => {
        const goal = goals.find((g) => g.id === action.goal_id);
        return {
          ...action,
          goal_title: goal ? goal.title : action.goal_title,
        };
      });
      setRecoveryActions(resolvedRecovery);

      // Reload database lists
      const suggestions = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(suggestions);

      const logs = await executionAgentService.loadCoachingLogs();
      setCoachingLogs(logs);

      const loadedInsights = await executionAgentService.loadProductivityInsights();
      setInsights(loadedInsights);
    } catch (error) {
      console.error('Failed to execute execution analysis:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Execution analysis pipeline failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptReschedule = async (id: string) => {
    try {
      await executionAgentService.acceptReschedule(id);
      // Reload reschedules and task status
      const suggestions = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(suggestions);
      const loadedTasks = await taskRepository.listTasks();
      setTasks(loadedTasks);
    } catch (err) {
      console.error('Accept reschedule action failed:', err);
    }
  };

  const handleRejectReschedule = async (id: string) => {
    try {
      await executionAgentService.rejectReschedule(id);
      // Reload reschedules
      const suggestions = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(suggestions);
    } catch (err) {
      console.error('Reject reschedule action failed:', err);
    }
  };

  const handleApplyRecoveryPlan = async (goalId: string, recoveryTasksList: string[]) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      for (const step of recoveryTasksList) {
        await taskRepository.createTask({
          goal_id: goalId,
          title: `[Recovery] ${step}`,
          priority: 'high',
          status: 'pending',
          due_date: tomorrow.toISOString(),
          description: 'Priority recovery action generated by AI Chief of Staff.',
        });
      }

      // Reload tasks list
      const loadedTasks = await taskRepository.listTasks();
      setTasks(loadedTasks);
    } catch (err) {
      console.error('Apply recovery plan failed:', err);
      throw err;
    }
  };

  const handleGenerateAlternative = async (_goalId: string) => {
    // Re-run the main execution scan to generate fresh advice/roadmap offsets
    await handleAnalyze();
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate overdue missed tasks count
  const todayStr = new Date().toISOString().split('T')[0];
  const missedTasksCount = tasks.filter((t) => {
    if (t.status === 'completed' || !t.due_date) return false;
    const dueStr = t.due_date.split('T')[0];
    return dueStr < todayStr;
  }).length;

  const latestCoachLog = coachingLogs[0];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
        <span className="text-[11px] font-semibold text-slate-600">Loading Execution Agent...</span>
      </div>
    );
  }

  return (
    <div className="w-full px-14 py-6 space-y-6">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-slate-900 border border-slate-900 flex items-center justify-center text-white shrink-0">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-950 tracking-tight">Execution Agent</h2>
          <p className="text-[10.5px] text-slate-500 font-medium">
            Autonomous daily coach, schedule optimizers, and automated recovery actions.
          </p>
        </div>
      </div>

      {calendarEmail && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-[8px] p-3 text-[11px] text-slate-700 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-slate-800">Calendar Connected</span>
            <span className="text-slate-500 font-medium font-mono">({calendarEmail})</span>
          </div>
          <Link href="/lifesaver/scheduling" className="text-[10px] font-bold text-slate-850 hover:underline">
            Manage Calendar →
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] flex items-center gap-2.5 text-[10.5px] text-rose-800 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Control Summary */}
      <ExecutionSummaryCard
        focusScore={latestCoachLog ? latestCoachLog.focus_score : null}
        completionRate={completionRate}
        totalTasks={totalTasks}
        missedTasksCount={missedTasksCount}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Coach briefings, Insights, and Workload Balance */}
        <div className="md:col-span-2 space-y-6">
          {latestCoachLog ? (
            <CoachCard
              message={latestCoachLog.coach_message}
              focusScore={latestCoachLog.focus_score}
              productivityScore={latestCoachLog.productivity_score}
              createdAt={latestCoachLog.created_at}
            />
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-[12px] p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-[12.5px] font-semibold text-slate-900">Activate AI Chief of Staff</h4>
                <p className="text-[10px] text-slate-750 max-w-[320px] mx-auto mt-1">
                  {"You haven't run an execution scan yet today. Trigger \"Analyze Patterns\" above to compute daily focus, generate coaching briefings, and verify task lists."}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InsightCard insights={insights} />
            <OptimizationCard suggestions={optimizations} />
          </div>
        </div>

        {/* Right Column: Reschedules and Recovery Plans */}
        <div className="space-y-6">
          <RescheduleCard
            suggestions={reschedules}
            onAccept={handleAcceptReschedule}
            onReject={handleRejectReschedule}
          />
          <RecoveryActionCard
            recoveryActions={recoveryActions}
            goalRisks={goalRisks}
            onApplyPlan={handleApplyRecoveryPlan}
            onGenerateAlternative={handleGenerateAlternative}
          />
        </div>
      </div>
    </div>
  );
}
