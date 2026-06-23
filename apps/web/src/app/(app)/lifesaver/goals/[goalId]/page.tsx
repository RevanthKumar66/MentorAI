'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Goal } from '@/features/lifesaver/types/goal';
import { GoalPlan, Milestone, Recommendation } from '@/features/lifesaver/types/planner';
import { Task } from '@/features/lifesaver/types/task';
import { GoalHealth } from '@/features/lifesaver/types/focus';
import { goalPlanningService } from '@/features/lifesaver/services/GoalPlanningService';
import { taskService } from '@/features/lifesaver/services/TaskService';
import { goalHealthService } from '@/features/lifesaver/services/GoalHealthService';
import { GoalPlanCard } from '@/features/lifesaver/components/GoalPlanCard';
import { MilestoneCard } from '@/features/lifesaver/components/MilestoneCard';
import { RecommendationCard } from '@/features/lifesaver/components/RecommendationCard';
import { TimelineView } from '@/features/lifesaver/components/TimelineView';
import { TaskCard } from '@/features/lifesaver/components/TaskCard';
import { GoalHealthCard } from '@/features/lifesaver/components/GoalHealthCard';
import { goalRiskRepository } from '@/features/lifesaver/repositories/GoalRiskRepository';
import { recoveryPlanningService } from '@/features/lifesaver/services/RecoveryPlanningService';
import { GoalRisk, RecoveryPlan } from '@/features/lifesaver/types/risk';
import { RiskScoreCard } from '@/features/lifesaver/components/RiskScoreCard';
import { ForecastCard } from '@/features/lifesaver/components/ForecastCard';
import { RecoveryPlanCard } from '@/features/lifesaver/components/RecoveryPlanCard';
import { RescheduleSuggestion } from '@/features/lifesaver/types/execution';
import { executionAgentService } from '@/features/lifesaver/services/ExecutionAgentService';
import { Calendar, Sparkles, ListTodo, AlertCircle, ArrowLeft, RefreshCw, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params?.goalId as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goalHealth, setGoalHealth] = useState<GoalHealth | null>(null);
  const [goalRisk, setGoalRisk] = useState<GoalRisk | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [reschedules, setReschedules] = useState<RescheduleSuggestion[]>([]);
  const [optimizations, setOptimizations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoalData = React.useCallback(async () => {
    if (!goalId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Goal Details
      const { data: goalData, error: goalError } = await supabase
        .from('lifesaver_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) {
        throw new Error('Failed To Load Goal Details.');
      }
      setGoal(goalData);

      // 2. Fetch Goal Plan details (Milestones, Plan, Recommendations)
      const details = await goalPlanningService.getGoalPlanDetails(goalId);
      setPlan(details.plan);
      setMilestones(details.milestones);
      setRecommendations(details.recommendations);

      // 3. Fetch Tasks
      const tasksData = await taskService.getTasks(goalId);
      setTasks(tasksData);

      // 4. Compute Goal Health locally
      const health = goalHealthService.computeHealthList(
        [goalData],
        tasksData,
        details.milestones
      );
      setGoalHealth(health[0] ?? null);

      // 5. Fetch Risk Prediction
      const riskData = await goalRiskRepository.getRiskForGoal(goalId);
      setGoalRisk(riskData);

      // 6. Fetch Recovery Plan
      const planData = await recoveryPlanningService.getPlanForGoal(goalId);
      setRecoveryPlan(planData);

      // 7. Fetch Rescheduling Suggestions
      const suggestions = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(suggestions);

      // 8. Fetch Optimizations
      const cachedOpts = localStorage.getItem('mentorai_execution_optimizations');
      if (cachedOpts) setOptimizations(JSON.parse(cachedOpts));
    } catch (err) {
      console.error('Error fetching goal details:', err);
      setError(err instanceof Error ? err.message : 'An Unexpected Error Occurred.');
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        void fetchGoalData();
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [goalId, fetchGoalData]);

  const handleMilestoneStatusChange = async (milestoneId: string, newStatus: Milestone['status']) => {
    try {
      const { error: updateError } = await supabase
        .from('lifesaver_milestones')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', milestoneId);

      if (updateError) throw updateError;

      // Update state locally
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      console.error('Error updating milestone status:', err);
      alert('Failed To Update Milestone Status.');
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: Task['status']) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed To Update Task Status.');
    }
  };

  const handleEditTask = () => {
    // Redirect or open modal (simplest is editing from the Tasks tab, or basic update)
    router.push('/lifesaver/tasks');
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed To Delete Task.');
    }
  };

  const handleToggleRecoveryTaskStatus = async (taskId: string, currentStatus: 'pending' | 'completed') => {
    try {
      await recoveryPlanningService.toggleTaskStatus(taskId, currentStatus);
      const planData = await recoveryPlanningService.getPlanForGoal(goalId);
      setRecoveryPlan(planData);
    } catch (err) {
      console.error('Failed to toggle recovery task:', err);
    }
  };

  const handleAcceptReschedule = async (suggestionId: string) => {
    try {
      await executionAgentService.acceptReschedule(suggestionId);
      const suggestions = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(suggestions);
      const tasksData = await taskService.getTasks(goalId);
      setTasks(tasksData);
    } catch (err) {
      console.error('Accept reschedule failed:', err);
    }
  };

  const handleRejectReschedule = async (suggestionId: string) => {
    try {
      await executionAgentService.rejectReschedule(suggestionId);
      const suggestions = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(suggestions);
    } catch (err) {
      console.error('Reject reschedule failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[50vh] space-y-4 bg-[#fcfbf9]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-950 rounded-full animate-spin" />
        <p className="text-[10px] text-slate-700 font-semibold tracking-wider uppercase">Loading Goal Roadmap...</p>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="p-6 max-w-lg mx-auto bg-white border border-slate-200/60 rounded-[12px] my-12 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-sm font-semibold text-slate-950 uppercase tracking-wider">Goal Not Found</h2>
        <p className="text-[10.5px] text-slate-700 font-medium">{error || 'The Requested Goal Plan Could Not Be Retrieved.'}</p>
        <Link
          href="/lifesaver/goals"
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-950 hover:underline"
        >
          <ArrowLeft className="w-3 h-3" />
          Back To Goals
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(goal.target_date).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const currentProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="space-y-1.5">
          <Link
            href="/lifesaver/goals"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 hover:text-slate-955 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back To Goals List
          </Link>
          <h1 className="text-base font-semibold text-slate-955 tracking-tight uppercase leading-snug">
            {goal.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-700">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Target: {formattedDate}
            </span>
            <span className="w-1 h-1 bg-slate-350 rounded-full" />
            <span className="capitalize">Category: {goal.category || 'General'}</span>
            <span className="w-1 h-1 bg-slate-350 rounded-full" />
            <span className="capitalize">Status: {goal.status}</span>
          </div>
        </div>

        <button
          onClick={fetchGoalData}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/60 text-[10px] font-semibold text-slate-950 rounded-[6px] hover:bg-[#fcfbf9] transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Plan Data
        </button>
      </div>

      {!plan ? (
        <div className="bg-white border border-slate-200/60 rounded-[12px] p-8 text-center space-y-4">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-xs font-semibold text-slate-955 uppercase tracking-wider">No AI Plan Configured</h2>
          <p className="text-[10px] text-slate-700 font-medium">
            This goal was created manually. You can generate an AI Strategic roadmap and week-by-week checkpoints for it.
          </p>
          <Link
            href="/lifesaver/planner"
            className="inline-flex py-2 px-4 rounded-[6px] bg-slate-950 text-white text-[10px] font-semibold hover:bg-slate-900 transition-colors"
          >
            Create Plan For This Goal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: AI Summary and Strategy Recommendations */}
          <div className="lg:col-span-5 space-y-6">
            <GoalPlanCard
              plan={plan}
              category={goal.category}
              hoursPerDay={goal.hours_per_day}
              experienceLevel={goal.experience_level}
            />

            {/* Goal Health Widget */}
            {goalHealth && (
              <GoalHealthCard health={goalHealth} />
            )}

            <RecommendationCard recommendations={recommendations} />

            {/* Risk Assessment */}
            {goalRisk && (
              <div className="space-y-6">
                <RiskScoreCard score={goalRisk.risk_score} level={goalRisk.risk_level} />
                <ForecastCard
                  goalTitle={goal.title}
                  currentProgress={currentProgress}
                  predictedProgress={goalRisk.completion_probability}
                  forecastText={goalRisk.forecast_summary || 'Trajectory is currently stable.'}
                />
              </div>
            )}

            {/* Recovery Plan */}
            {recoveryPlan && (
              <RecoveryPlanCard
                plan={recoveryPlan}
                onToggleTaskStatus={handleToggleRecoveryTaskStatus}
              />
            )}

            {/* AI Execution Operations */}
            {(() => {
              const goalReschedules = reschedules.filter(r => r.task_id && tasks.some(t => t.id === r.task_id));
              const suggestedShifts = goalReschedules.filter(r => r.status === 'suggested');
              const historicalShifts = goalReschedules.filter(r => r.status !== 'suggested');

              if (goalReschedules.length === 0 && optimizations.length === 0) return null;

              return (
                <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-[6px] bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-[11.5px] font-bold text-slate-955 uppercase tracking-wider">
                        AI Execution Operations
                      </h3>
                      <p className="text-[9.5px] text-slate-700 font-medium">Timeline adjustments and optimizations.</p>
                    </div>
                  </div>

                  {/* Suggested Shifts */}
                  {suggestedShifts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9.5px] font-bold text-slate-755 uppercase tracking-wider block">Suggested Timeline Shifts</span>
                      <div className="space-y-2">
                        {suggestedShifts.map((s) => (
                          <div key={s.id} className="p-2.5 bg-slate-50/70 border border-slate-200/50 rounded-[8px] space-y-1.5 text-[10.5px]">
                            <span className="font-semibold text-slate-900 block truncate">{s.lifesaver_tasks?.title || 'Untitled Task'}</span>
                            <span className="text-slate-700 italic block leading-normal text-[9.5px]">Reason: {s.reason}</span>
                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100/50">
                              <span className="text-[9px] font-bold text-slate-700">
                                {new Date(s.old_due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} →{' '}
                                <span className="text-emerald-700 font-bold">
                                  {new Date(s.new_due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleRejectReschedule(s.id)}
                                  className="px-2 py-0.5 rounded border border-slate-200 text-[9px] font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAcceptReschedule(s.id)}
                                  className="px-2 py-0.5 rounded bg-slate-950 text-white text-[9px] font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
                                >
                                  Accept
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shifts History */}
                  {historicalShifts.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[9.5px] font-bold text-slate-755 uppercase tracking-wider block">Shifts History</span>
                      <div className="space-y-1.5">
                        {historicalShifts.slice(0, 3).map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-[10px] text-slate-700 font-medium py-1 border-b border-slate-100 last:border-0">
                            <span className="truncate max-w-[160px]">{s.lifesaver_tasks?.title || 'Untitled Task'}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8.5px] text-slate-650 font-semibold">
                                {new Date(s.new_due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold border uppercase tracking-wider ${s.status === 'accepted' ? 'bg-emerald-50 text-emerald-750 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                {s.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goal Optimizations */}
                  {optimizations.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <span className="text-[9.5px] font-bold text-slate-755 uppercase tracking-wider block">Goal Workload Tips</span>
                      <div className="space-y-1.5">
                        {optimizations.slice(0, 2).map((opt, idx) => (
                          <div key={idx} className="text-[10px] text-slate-750 font-medium leading-normal bg-slate-50/40 p-2 border border-slate-100 rounded-[6px]">
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Column: Weekly roadmap progress milestones and timeline */}
          <div className="lg:col-span-7 space-y-6">
            <TimelineView weeklyPlan={plan.raw_ai_response?.weeklyPlan || []} />

            <MilestoneCard
              milestones={milestones}
              onStatusChange={handleMilestoneStatusChange}
            />

            {/* Actionable Suggested Tasks */}
            <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-slate-900 shrink-0" />
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Actionable Suggested Tasks ({tasks.length})
                </h3>
              </div>

              {tasks.length === 0 ? (
                <p className="text-[10px] text-slate-700 font-medium italic">
                  No Suggested Tasks Added For This Goal Plan.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      goals={[goal]}
                      onToggleStatus={handleToggleTaskStatus}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
