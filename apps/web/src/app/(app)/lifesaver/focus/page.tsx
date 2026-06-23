'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { goalService } from '@/features/lifesaver/services/GoalService';
import { taskService } from '@/features/lifesaver/services/TaskService';
import { priorityEngineService } from '@/features/lifesaver/services/PriorityEngineService';
import { missionGenerationService, resolveUserName } from '@/features/lifesaver/services/MissionGenerationService';
import { goalHealthService } from '@/features/lifesaver/services/GoalHealthService';
import { recoveryPlanningService } from '@/features/lifesaver/services/RecoveryPlanningService';
import { MissionCard } from '@/features/lifesaver/components/MissionCard';
import { PriorityTaskCard } from '@/features/lifesaver/components/PriorityTaskCard';
import { GoalHealthCard } from '@/features/lifesaver/components/GoalHealthCard';
import { FocusScoreCard } from '@/features/lifesaver/components/FocusScoreCard';
import { RecommendationFeed } from '@/features/lifesaver/components/RecommendationFeed';
import { FocusAIResponse, GoalHealth, TaskScoreMap, FocusTopTask } from '@/features/lifesaver/types/focus';
import { RecoveryTask } from '@/features/lifesaver/types/risk';
import { Task } from '@/features/lifesaver/types/task';
import { RescheduleSuggestion } from '@/features/lifesaver/types/execution';
import { executionAgentService } from '@/features/lifesaver/services/ExecutionAgentService';
import { calendarIntegrationService } from '@/features/lifesaver/services/CalendarIntegrationService';
import { CalendarEvent } from '@/features/lifesaver/types/scheduling';
import { RescheduleCard } from '@/features/lifesaver/components/RescheduleCard';
import { supabase } from '@/lib/supabase';
import { Crosshair, Flag, CheckSquare, RefreshCw, Brain, Sparkles, Calendar } from 'lucide-react';
import Link from 'next/link';

const LOADING_STEPS = [
  'Analyzing Goals And Deadlines...',
  'Evaluating Task Priorities...',
  'Computing Priority Scores...',
  'Crafting Today\'s Mission...',
  'Generating AI Recommendations...',
];

export default function FocusAIPage() {
  const [focusData, setFocusData] = useState<FocusAIResponse | null>(null);
  const [scoreMap, setScoreMap] = useState<TaskScoreMap>({});
  const [goalHealthList, setGoalHealthList] = useState<GoalHealth[]>([]);
  const [recoveryTasks, setRecoveryTasks] = useState<RecoveryTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('there');
  const [reschedules, setReschedules] = useState<RescheduleSuggestion[]>([]);
  const [latestCoachMessage, setLatestCoachMessage] = useState<string | null>(null);

  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);

  // Fetch base data
  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['lifesaver-goals'],
    queryFn: () => goalService.getGoals(),
  });

  const { data: tasks = [], isLoading: loadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['lifesaver-tasks'],
    queryFn: () => taskService.getTasks(),
  });

  // Resolve user name, recovery tasks, coaching logs, reschedules, and calendar connection
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserName(resolveUserName(user));
    });
    recoveryPlanningService.getRecoveryTasks().then((rTasks) => {
      setRecoveryTasks(rTasks);
    });
    executionAgentService.loadRescheduleSuggestions().then(setReschedules);
    executionAgentService.loadCoachingLogs().then((logs) => {
      if (logs && logs.length > 0) {
        setLatestCoachMessage(logs[0].coach_message);
      }
    });

    calendarIntegrationService.fetchConnection().then((conn) => {
      if (conn && conn.id) {
        setCalendarEmail(conn.email);
        calendarIntegrationService.getEvents().then((evs) => {
          const todayStr = new Date().toDateString();
          const todayEvs = evs.filter(e => new Date(e.start_time).toDateString() === todayStr);
          setTodayEvents(todayEvs);
        }).catch((e) => console.error(e));
      }
    }).catch((err) => console.error('Failed to load calendar connection in focus:', err));
  }, []);

  // Advance loading steps — reset deferred so it doesn't cause a synchronous setState in effect
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

  const runFocusPipeline = useCallback(async () => {
    if (isLoading || loadingGoals || loadingTasks) return;
    if (goals.length === 0 || tasks.length === 0) return;

    setIsLoading(true);
    setError(null);
    setFocusData(null);

    try {
      // Step 1-2: Fetch milestones for all active goals
      const activeMilestones: import('@/features/lifesaver/types/planner').Milestone[] = [];
      const { data: msData } = await supabase
        .from('lifesaver_milestones')
        .select('*')
        .in('goal_id', goals.filter(g => g.status === 'active').map(g => g.id));
      if (msData) activeMilestones.push(...msData);

      // Step 3: Score tasks via backend, persist to DB
      const scores = await priorityEngineService.generateAndPersistScores(tasks, goals, activeMilestones);
      setScoreMap(scores);

      // Step 4: Evaluate goal health locally, persist
      const healthList = await goalHealthService.evaluateAndPersist(goals, tasks, activeMilestones);
      setGoalHealthList(healthList);

      // Fetch recovery tasks
      const rTasks = await recoveryPlanningService.getRecoveryTasks();
      setRecoveryTasks(rTasks);

      // Step 5: Generate AI mission (Gemini)
      const missionData = await missionGenerationService.generateMission(
        goals,
        tasks,
        activeMilestones,
        scores
      );
      setFocusData(missionData);
    } catch (err) {
      console.error('Focus AI pipeline error:', err);
      setError(err instanceof Error ? err.message : 'Focus generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [goals, tasks, isLoading, loadingGoals, loadingTasks]);

  const handleAcceptReschedule = async (id: string) => {
    try {
      await executionAgentService.acceptReschedule(id);
      const updated = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(updated);
      await refetchTasks();
      void runFocusPipeline();
    } catch (err) {
      console.error('Accept reschedule failed:', err);
    }
  };

  const handleRejectReschedule = async (id: string) => {
    try {
      await executionAgentService.rejectReschedule(id);
      const updated = await executionAgentService.loadRescheduleSuggestions();
      setReschedules(updated);
    } catch (err) {
      console.error('Reject reschedule failed:', err);
    }
  };

  const autoRunTriggered = React.useRef(false);

  // Auto-run when data is ready — deferred so setState is not synchronous in effect body
  useEffect(() => {
    if (
      !loadingGoals &&
      !loadingTasks &&
      goals.length > 0 &&
      tasks.length > 0 &&
      !focusData &&
      !error &&
      !autoRunTriggered.current
    ) {
      autoRunTriggered.current = true;
      const t = setTimeout(() => { void runFocusPipeline(); }, 0);
      return () => clearTimeout(t);
    }
  }, [loadingGoals, loadingTasks, goals.length, tasks.length, focusData, error, runFocusPipeline]);

  // Build lookup maps
  const goalMap = React.useMemo(() => {
    const m: Record<string, typeof goals[0]> = {};
    goals.forEach((g) => { m[g.id] = g; });
    return m;
  }, [goals]);

  const displayGoalHealth = focusData?.goal_health ?? goalHealthList;

  // Find critical goal IDs
  const criticalGoalIds = React.useMemo(() => {
    return displayGoalHealth
      .filter((h) => h.health === 'CRITICAL')
      .map((h) => h.goal_id);
  }, [displayGoalHealth]);

  // Find pending recovery tasks
  const pendingRecoveryTasks = React.useMemo(() => {
    return recoveryTasks.filter((rt) => rt.status === 'pending');
  }, [recoveryTasks]);

  // Build top focus tasks for Today's Mission (with recovery tasks of critical goals prepended)
  const todayMissionTopTasks = React.useMemo(() => {
    if (!focusData) return [];

    // Find recovery tasks for critical goals
    const criticalRecoveryTasks = pendingRecoveryTasks.filter(
      (rt) => rt.goal_id && criticalGoalIds.includes(rt.goal_id)
    );

    const transformedRecoveryTasks: FocusTopTask[] = criticalRecoveryTasks.map((rt) => {
      const goal = rt.goal_id ? goalMap[rt.goal_id] : null;
      return {
        task_id: rt.id || '',
        task_title: `[Recovery] ${rt.title}`,
        goal_title: goal ? goal.title : null,
        priority_score: 99,
        urgency_score: 99,
        due_date: rt.due_date || null,
      };
    });

    // Combine them, putting recovery tasks first
    return [...transformedRecoveryTasks, ...focusData.top_tasks];
  }, [focusData, pendingRecoveryTasks, criticalGoalIds, goalMap]);

  // Priority tasks — top 8 scored (with recovery tasks of critical goals prepended)
  const priorityTasks = React.useMemo(() => {
    // 1. Get recovery tasks for critical goals
    const criticalRecoveryTasks = pendingRecoveryTasks.filter(
      (rt) => rt.goal_id && criticalGoalIds.includes(rt.goal_id)
    );

    const transformedRecoveryTasks = criticalRecoveryTasks.map((rt) => {
      // Map RecoveryTask to Task shape
      const mockTask: Task = {
        id: rt.id || '',
        title: `[Recovery] ${rt.title}`,
        status: rt.status === 'completed' ? 'completed' : rt.status === 'pending' ? 'pending' : 'in_progress',
        priority: rt.priority === 'high' ? 'high' : rt.priority === 'medium' ? 'medium' : 'low',
        due_date: rt.due_date || '',
        goal_id: rt.goal_id || '',
        created_at: rt.created_at || new Date().toISOString(),
        updated_at: rt.updated_at || new Date().toISOString(),
        user_id: rt.user_id || '',
        description: rt.description || null,
      };

      const mockScore = {
        id: `mock-${rt.id}`,
        task_id: rt.id || '',
        goal_id: rt.goal_id || null,
        user_id: rt.user_id || '',
        priority_score: 99,
        urgency_score: 99,
        goal_alignment_score: 99,
        impact_score: 99,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { task: mockTask, score: mockScore };
    });

    // 2. Get regular priority tasks
    const pendingTasks = tasks.filter((t) => t.status !== 'completed' && scoreMap[t.id]);
    const sortedPending = pendingTasks
      .map((t) => ({ task: t, score: scoreMap[t.id] }))
      .sort((a, b) => b.score.priority_score - a.score.priority_score);

    // Combine them, placing transformed recovery tasks first
    return [...transformedRecoveryTasks, ...sortedPending].slice(0, 8);
  }, [tasks, scoreMap, pendingRecoveryTasks, criticalGoalIds]);

  // ─── Empty state: no goals ─────────────────────────────────────────────────
  if (!loadingGoals && goals.length === 0) {
    return (
      <main className="w-full px-14 py-6">
        <div className="bg-white border border-slate-200/60 rounded-[12px] p-10 text-center space-y-4">
          <Flag className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-950 uppercase tracking-wider">No Goals Found</h2>
          <p className="text-[10.5px] text-slate-700 font-medium">
            Create your first goal to unlock AI-powered daily mission planning.
          </p>
          <Link href="/lifesaver/goals?action=create" className="inline-flex py-2 px-4 rounded-[6px] bg-slate-950 text-white text-[10px] font-semibold hover:bg-slate-900 transition-colors">
            Create Your First Goal
          </Link>
        </div>
      </main>
    );
  }

  // ─── Empty state: no tasks ─────────────────────────────────────────────────
  if (!loadingTasks && tasks.length === 0) {
    return (
      <main className="w-full px-14 py-6">
        <div className="bg-white border border-slate-200/60 rounded-[12px] p-10 text-center space-y-4">
          <CheckSquare className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-950 uppercase tracking-wider">No Tasks Found</h2>
          <p className="text-[10.5px] text-slate-700 font-medium">
            Create tasks or generate a roadmap to activate Focus AI.
          </p>
          <Link href="/lifesaver/planner" className="inline-flex py-2 px-4 rounded-[6px] bg-slate-950 text-white text-[10px] font-semibold hover:bg-slate-900 transition-colors">
            Generate AI Roadmap
          </Link>
        </div>
      </main>
    );
  }

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || loadingGoals || loadingTasks) {
    return (
      <main className="w-full px-14 py-6">
        <div className="bg-white border border-slate-200/60 rounded-[12px] min-h-[360px] flex flex-col items-center justify-center gap-6 px-8 py-12">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 border-2 border-slate-200 border-t-slate-950 rounded-full animate-spin" />
            <Brain className="w-6 h-6 text-slate-900 absolute" />
          </div>
          <div className="text-center space-y-2 max-w-sm">
            <h3 className="text-xs font-semibold text-slate-950 uppercase tracking-wider">AI Priority Engine Active</h3>
            <p className="text-[10px] text-slate-600 font-semibold animate-pulse">
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

  // ─── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="w-full px-14 py-6">
        <div className="bg-white border border-rose-200 rounded-[12px] p-8 text-center space-y-4">
          <p className="text-[10.5px] text-rose-700 font-medium">{error}</p>
          <button
            onClick={runFocusPipeline}
            className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-[6px] bg-slate-950 text-white text-[10px] font-semibold hover:bg-slate-900 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!focusData) return null;

  return (
    <main className="w-full px-14 py-6 space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-slate-500" />
            <h1 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Focus AI
            </h1>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            What matters most today, {userName}.
          </p>
        </div>
        <button
          onClick={runFocusPipeline}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/60 text-[10px] font-semibold text-slate-950 rounded-[6px] hover:bg-[#fcfbf9] transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Regenerate Mission
        </button>
      </div>

      {/* AI Coach Banner */}
      {latestCoachMessage && (
        <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200 rounded-[12px] p-4 flex items-start gap-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100/20 rounded-full blur-xl -mr-2 -mt-2" />
          <div className="w-8 h-8 rounded-[8px] bg-white border border-amber-250 flex items-center justify-center text-amber-700 shrink-0 shadow-sm mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">AI Daily Coach Advice</span>
            <p className="text-[11px] leading-relaxed text-slate-850 font-medium italic">
              &ldquo;{latestCoachMessage}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Main layout: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Score + Mission + Recommendations */}
        <div className="lg:col-span-1 space-y-4">
          <FocusScoreCard
            score={focusData.focus_score}
            label={focusData.focus_label}
          />
          {calendarEmail && todayEvents.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-[12px] p-4 space-y-3 shadow-xs">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Today's Calendar Commitments
              </h3>
              <div className="space-y-2">
                {todayEvents.map(e => (
                  <div key={e.id} className="text-xs p-2.5 border border-slate-150 bg-slate-50/20 rounded-[6px] flex justify-between items-center gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">{e.title}</span>
                      <span className="text-[9.5px] text-slate-500 font-medium block mt-1">
                        {new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(e.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <RescheduleCard
            suggestions={reschedules}
            onAccept={handleAcceptReschedule}
            onReject={handleRejectReschedule}
          />
        </div>

        {/* Right Column: Mission Card */}
        <div className="lg:col-span-2">
          <MissionCard
            mission={focusData.mission}
            topTasks={todayMissionTopTasks}
            userName={userName}
          />
        </div>
      </div>

      {/* Section 2: Priority Tasks */}
      {priorityTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">
            Priority Tasks — Ranked By AI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {priorityTasks.map(({ task, score }) => (
              <PriorityTaskCard
                key={task.id}
                task={task}
                score={score}
                goal={task.goal_id ? (goalMap[task.goal_id] ?? null) : null}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 3 + 4: Goal Health + Recommendations side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Health */}
        {displayGoalHealth.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">
              Goal Health
            </h2>
            <div className="space-y-2.5">
              {displayGoalHealth.map((h) => (
                <GoalHealthCard key={h.goal_id} health={h} />
              ))}
            </div>
          </section>
        )}

        {/* AI Recommendations */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">
            Daily Recommendations
          </h2>
          <RecommendationFeed recommendations={focusData.mission.recommendations} />
        </section>
      </div>
    </main>
  );
}
