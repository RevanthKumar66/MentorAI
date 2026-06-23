'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { goalService } from '@/features/lifesaver/services/GoalService';
import { taskService } from '@/features/lifesaver/services/TaskService';
import { priorityEngineService } from '@/features/lifesaver/services/PriorityEngineService';
import { goalHealthService } from '@/features/lifesaver/services/GoalHealthService';
import { riskPredictionService } from '@/features/lifesaver/services/RiskPredictionService';
import { StatsCard } from '@/features/lifesaver/components/StatsCard';
import { GoalCard } from '@/features/lifesaver/components/GoalCard';
import { TaskCard } from '@/features/lifesaver/components/TaskCard';
import { EmptyState } from '@/features/lifesaver/components/EmptyState';
import { FocusScoreCard } from '@/features/lifesaver/components/FocusScoreCard';
import { GoalHealthCard } from '@/features/lifesaver/components/GoalHealthCard';
import { GoalHealth, TaskScoreMap } from '@/features/lifesaver/types/focus';
import { Milestone } from '@/features/lifesaver/types/planner';
import { GoalRisk, getRiskLevelStyles } from '@/features/lifesaver/types/risk';
import { resolveUserName } from '@/features/lifesaver/services/MissionGenerationService';
import { executionAgentService } from '@/features/lifesaver/services/ExecutionAgentService';
import { calendarIntegrationService } from '@/features/lifesaver/services/CalendarIntegrationService';
import { schedulingRepository } from '@/features/lifesaver/repositories/SchedulingRepository';
import { supabase } from '@/lib/supabase';
import {
  Flag, CheckSquare, Target, ChevronRight, Loader2, Crosshair,
  AlertTriangle, ShieldAlert, Sparkles, PlusCircle, Cpu, Zap, Calendar, Clock, ShieldCheck
} from 'lucide-react';

export default function MomentumAIDashboard() {
  const [userName, setUserName] = useState('there');
  const [scoreMap, setScoreMap] = useState<TaskScoreMap>({});
  const [goalHealthList, setGoalHealthList] = useState<GoalHealth[]>([]);
  const [focusScore, setFocusScore] = useState<number | null>(null);
  const [focusLabel, setFocusLabel] = useState('');
  const [risks, setRisks] = useState<Record<string, GoalRisk>>({});
  const [latestCoachMessage, setLatestCoachMessage] = useState<string | null>(null);

  // Calendar Dashboard States
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [todayEventsCount, setTodayEventsCount] = useState(0);
  const [nextFocusTime, setNextFocusTime] = useState<string | null>(null);
  const [criticalDeadline, setCriticalDeadline] = useState<string | null>(null);
  const [calendarHealth, setCalendarHealth] = useState<'Excellent' | 'Conflict' | 'No Calendar'>('No Calendar');

  // Query Goals
  const { data: goals = [], isLoading: loadingGoals, refetch: refetchGoals } = useQuery({
    queryKey: ['lifesaver-goals'],
    queryFn: () => goalService.getGoals(),
  });

  // Query Tasks
  const { data: tasks = [], isLoading: loadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['lifesaver-tasks'],
    queryFn: () => taskService.getTasks(),
  });

  // Resolve user name, load coaching message, and load calendar connection details
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserName(resolveUserName(user));
    });
    executionAgentService.loadCoachingLogs().then((logs) => {
      if (logs && logs.length > 0) {
        setLatestCoachMessage(logs[0].coach_message);
      }
    }).catch((err) => console.error('Failed to load coach message:', err));

    calendarIntegrationService.fetchConnection().then((conn) => {
      if (conn && conn.id) {
        setCalendarEmail(conn.email);
        calendarIntegrationService.getEvents().then((evs) => {
          const todayStr = new Date().toDateString();
          const todayEvs = evs.filter(e => new Date(e.start_time).toDateString() === todayStr);
          setTodayEventsCount(todayEvs.length);

          const futureFocus = evs.find(e => {
            const start = new Date(e.start_time);
            return start > new Date() && (e.title.toLowerCase().includes('focus') || e.title.toLowerCase().includes('study') || e.title.toLowerCase().includes('deep'));
          });
          if (futureFocus) {
            setNextFocusTime(new Date(futureFocus.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
          setCalendarHealth('Excellent');
        }).catch((e) => console.error(e));
      } else {
        setCalendarEmail(null);
        setCalendarHealth('No Calendar');
      }
    }).catch((err) => console.error('Failed to load connection settings on dashboard:', err));
  }, []);

  // Load persisted scores + compute goal health locally + load risks
  useEffect(() => {
    if (loadingGoals || loadingTasks || goals.length === 0) return;
    const run = async () => {
      try {
        const scores = await priorityEngineService.loadPersistedScores();
        setScoreMap(scores);
        const loadedRisks = await riskPredictionService.loadGoalRisks();
        setRisks(loadedRisks);
        const { data: msData } = await supabase
          .from('lifesaver_milestones')
          .select('*')
          .in('goal_id', goals.filter(g => g.status === 'active').map(g => g.id));
        const milestones: Milestone[] = msData || [];
        const health = goalHealthService.computeHealthList(goals, tasks, milestones);
        setGoalHealthList(health);
        const totalHigh = tasks.filter(t => t.priority === 'high').length;
        const completedHigh = tasks.filter(t => t.priority === 'high' && t.status === 'completed').length;
        const fs = totalHigh > 0 ? Math.round((completedHigh / totalHigh) * 100) : 50;
        setFocusScore(fs);
        setFocusLabel(fs >= 80 ? 'Excellent Focus' : fs >= 60 ? 'Good Progress' : fs >= 40 ? 'Needs Attention' : 'Critical');

        const highPending = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
        if (highPending.length > 0) {
          const sorted = highPending.sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          });
          if (sorted[0]?.due_date) {
            setCriticalDeadline(new Date(sorted[0].due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }));
          }
        }
      } catch (err) {
        console.error('Dashboard analysis error:', err);
      }
    };
    run();
  }, [goals, tasks, loadingGoals, loadingTasks]);

  // Toggle task status
  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await taskService.updateTask(id, { status: nextStatus });
      refetchTasks();
      refetchGoals();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await goalService.deleteGoal(id);
      refetchGoals();
      refetchTasks();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      refetchTasks();
      refetchGoals();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Calculations
  const activeGoals = goals.filter((g) => g.status === 'active');
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  
  const totalGoals = goals.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Goal task counts mapping
  const goalTaskStats = React.useMemo(() => {
    const stats: Record<string, { completed: number; total: number }> = {};
    goals.forEach((g) => {
      stats[g.id] = { completed: 0, total: 0 };
    });
    tasks.forEach((t) => {
      if (t.goal_id && stats[t.goal_id]) {
        stats[t.goal_id].total += 1;
        if (t.status === 'completed') {
          stats[t.goal_id].completed += 1;
        }
      }
    });
    return stats;
  }, [goals, tasks]);

  // Top task by score
  const topScoredTask = React.useMemo(() => {
    const scored = tasks
      .filter((t) => t.status !== 'completed' && scoreMap[t.id])
      .sort((a, b) => (scoreMap[b.id]?.priority_score ?? 0) - (scoreMap[a.id]?.priority_score ?? 0));
    return scored[0] ?? null;
  }, [tasks, scoreMap]);

  // Find most at risk goal
  const mostAtRiskGoal = React.useMemo(() => {
    const activeGoalIds = activeGoals.map((g) => g.id);
    const scoredRisks = Object.values(risks)
      .filter((r) => activeGoalIds.includes(r.goal_id) && r.risk_score > 30)
      .sort((a, b) => b.risk_score - a.risk_score);
    if (scoredRisks.length === 0) return null;
    const risk = scoredRisks[0];
    const goal = activeGoals.find((g) => g.id === risk.goal_id);
    return goal ? { goal, risk } : null;
  }, [activeGoals, risks]);

  // Risk summary counts
  const atRiskCount = React.useMemo(() => {
    const activeGoalIds = activeGoals.map((g) => g.id);
    return Object.values(risks).filter((r) => activeGoalIds.includes(r.goal_id) && (r.risk_level === 'Moderate Risk' || r.risk_level === 'High Risk' || r.risk_level === 'Critical')).length;
  }, [activeGoals, risks]);

  const hourOfDay = new Date().getHours();
  const greeting =
    hourOfDay < 12 ? 'Good Morning' : hourOfDay < 17 ? 'Good Afternoon' : 'Good Evening';

  if (loadingGoals || loadingTasks) {
    return (
      <div className="flex h-[350px] w-full justify-center items-center text-slate-800 bg-[#fcfbf9]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
          <p className="text-slate-500 text-xs font-medium">Syncing Momentum AI...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full px-14 py-6 space-y-6 animate-fade-in">

      {/* Greeting Banner */}
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 tracking-tight mb-1">
            {greeting}, {userName}.
          </h2>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            You have <span className="font-semibold text-slate-800">{pendingTasks.length} pending tasks</span> across <span className="font-semibold text-slate-800">{activeGoals.length} active goals</span>.
          </p>
        </div>
        <Link
          href="/lifesaver/focus"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-[10px] rounded-[6px] transition-colors shrink-0 cursor-pointer self-start sm:self-auto uppercase tracking-wider"
        >
          <Crosshair className="w-3.5 h-3.5" />
          Open Focus AI
        </Link>
      </div>

      {/* AI Coach Banner */}
      {latestCoachMessage && (
        <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200 rounded-[12px] p-4 flex items-start gap-3 hover:border-amber-300 transition-colors shadow-sm relative overflow-hidden group">
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
          <Link
            href="/lifesaver/execution"
            className="flex items-center gap-1 text-[9.5px] font-bold text-amber-900 hover:text-amber-950 shrink-0 self-center border border-amber-250 bg-white/80 hover:bg-white px-2.5 py-1 rounded-[6px] transition-colors shadow-sm cursor-pointer"
          >
            <span>Open Console</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* AI Focus Score + Goal Health + Top Task */}
      {(focusScore !== null || goalHealthList.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {focusScore !== null && (
            <Link href="/lifesaver/focus" className="block">
              <FocusScoreCard score={focusScore} label={focusLabel} compact />
            </Link>
          )}
          {topScoredTask && (
            <div className="md:col-span-2 flex items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-[8px] h-14">
              <Crosshair className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[9.5px] font-semibold text-slate-650 uppercase tracking-wider mb-0.5">Today&apos;s Top Task</p>
                <p className="text-[11px] font-semibold text-slate-950 truncate">{topScoredTask.title}</p>
              </div>
              <span className="px-2 py-0.5 rounded-[4px] bg-slate-100 border border-slate-200 text-[9px] font-semibold text-slate-700 shrink-0">
                Score {scoreMap[topScoredTask.id]?.priority_score?.toFixed(0)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Risk Center Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Summary Widget */}
        <Link href="/lifesaver/risk" className="flex items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-[8px] h-14 hover:border-slate-350 transition-colors">
          <div className="w-8 h-8 rounded-[6px] bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-semibold text-slate-655 uppercase tracking-wider mb-0.5">Risk Summary</p>
            <p className="text-[11px] font-semibold text-slate-950 truncate">
              {atRiskCount > 0 ? `${atRiskCount} Goals require attention` : 'All goals stable and on track'}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </Link>

        {/* Most At Risk Goal */}
        {mostAtRiskGoal ? (
          <Link href="/lifesaver/risk" className="flex items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-[8px] h-14 hover:border-slate-350 transition-colors min-w-0">
            <div className="w-8 h-8 rounded-[6px] bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-semibold text-slate-655 uppercase tracking-wider mb-0.5">Most At Risk Goal</p>
              <p className="text-[11px] font-semibold text-slate-950 truncate">
                {mostAtRiskGoal.goal.title} ({mostAtRiskGoal.risk.risk_score}/100)
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-bold border uppercase tracking-wider shrink-0 ${getRiskLevelStyles(mostAtRiskGoal.risk.risk_level).badge}`}>
              {mostAtRiskGoal.risk.risk_level}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-[8px] h-14 min-w-0">
            <div className="w-8 h-8 rounded-[6px] bg-emerald-50 border border-emerald-250 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-semibold text-slate-655 uppercase tracking-wider mb-0.5">Most At Risk Goal</p>
              <p className="text-[11px] font-semibold text-slate-950 truncate">No high risk goals detected</p>
            </div>
          </div>
        )}
      </div>

      {/* Calendar & Smart Scheduling Health Panel */}
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-650" />
            Calendar & Scheduling Status
          </h3>
          <Link
            href="/lifesaver/scheduling"
            className="text-[10px] font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-0.5"
          >
            Open Scheduling Hub <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Connection Status */}
          <div className="p-3 border border-slate-150 rounded-[8px] bg-slate-50/20 flex flex-col justify-between h-20">
            <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Calendar</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-slate-900 truncate pr-1">
                {calendarEmail ? calendarEmail.split('@')[0] : 'Disconnected'}
              </span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${calendarEmail ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`} />
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="p-3 border border-slate-150 rounded-[8px] bg-slate-50/20 flex flex-col justify-between h-20">
            <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Today's Schedule</span>
            <span className="text-xs font-bold text-slate-900 mt-1">
              {calendarEmail ? `${todayEventsCount} Sync Event${todayEventsCount !== 1 ? 's' : ''}` : 'No calendar connected'}
            </span>
          </div>

          {/* Next Focus Session */}
          <div className="p-3 border border-slate-150 rounded-[8px] bg-slate-50/20 flex flex-col justify-between h-20">
            <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Next Focus Session</span>
            <span className="text-xs font-bold text-indigo-700 truncate mt-1">
              {nextFocusTime ? `Today at ${nextFocusTime}` : 'None scheduled'}
            </span>
          </div>

          {/* Critical Deadline */}
          <div className="p-3 border border-slate-150 rounded-[8px] bg-slate-50/20 flex flex-col justify-between h-20">
            <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Critical Deadline</span>
            <span className="text-xs font-bold text-rose-700 truncate mt-1">
              {criticalDeadline ? criticalDeadline : 'No critical tasks'}
            </span>
          </div>

          {/* Calendar Health */}
          <div className="p-3 border border-slate-150 rounded-[8px] bg-slate-50/20 flex flex-col justify-between h-20">
            <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider">Calendar Health</span>
            <span className={`text-xs font-bold mt-1 ${
              calendarHealth === 'Excellent' ? 'text-emerald-700' :
              calendarHealth === 'Conflict' ? 'text-amber-700 animate-pulse' : 'text-slate-500'
            }`}>
              {calendarHealth}
            </span>
          </div>
        </div>
      </div>

      {/* Goal Health Summary */}
      {goalHealthList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">Goal Health</h3>
            <Link href="/lifesaver/focus" className="text-[9.5px] font-semibold text-slate-700 hover:text-slate-955">Full Analysis →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {goalHealthList.slice(0, 4).map((h) => (
              <GoalHealthCard key={h.goal_id} health={h} compact />
            ))}
          </div>
        </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Goals Count"
          value={totalGoals}
          icon={Flag}
          description={`${activeGoals.length} Active, ${goals.filter(g => g.status === 'paused').length} Paused`}
          gradientFrom="from-blue-50/50"
          gradientTo="to-indigo-50/30"
          iconColorClass="text-blue-600"
        />
        <StatsCard
          label="Tasks Count"
          value={totalTasks}
          icon={CheckSquare}
          description={`${pendingTasks.length} Pending, ${completedTasks} Completed`}
          gradientFrom="from-amber-50/50"
          gradientTo="to-orange-50/30"
          iconColorClass="text-amber-600"
        />
        <StatsCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={Target}
          description="Total percentage of tasks finished"
          gradientFrom="from-emerald-50/50"
          gradientTo="to-teal-50/30"
          iconColorClass="text-emerald-600"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Goals List & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-slate-900 uppercase tracking-wider">Recent Active Goals</h3>
              <Link
                href="/lifesaver/goals"
                className="text-[10px] font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-0.5 group"
              >
                Manage Goals <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {activeGoals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeGoals.slice(0, 4).map((goal) => (
                  <GoalCard
                              key={goal.id}
                    goal={goal}
                    taskStats={goalTaskStats[goal.id]}
                    onEdit={() => { window.location.href = '/lifesaver/goals'; }}
                    onDelete={handleDeleteGoal}
                    onStatusChange={async (id, status) => {
                      await goalService.updateGoal(id, { status });
                      refetchGoals();
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Flag}
                title="No Active Goals"
                description="Create a goal to start mapping your milestones and subtasks."
                actionLabel="Add Goal"
                onAction={() => { window.location.href = '/lifesaver/goals?action=create'; }}
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
            <h4 className="text-[11.5px] font-semibold text-slate-900 uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { href: '/lifesaver/planner', label: 'Generate AI Roadmap', sub: 'AI week-by-week plan', icon: Sparkles },
                { href: '/lifesaver/goals?action=create', label: 'Create New Goal', sub: 'Establish a milestone', icon: PlusCircle },
                { href: '/lifesaver/tasks?action=create', label: 'Create New Task', sub: 'Add a subtask list', icon: PlusCircle },
                { href: '/lifesaver/ai-center', label: 'AI Center', sub: 'Planner, Focus, Risk & Execution', icon: Zap },
                { href: '/lifesaver/risk', label: 'Risk Center', sub: 'Predict & prevent goal failure', icon: AlertTriangle },
                { href: '/lifesaver/execution', label: 'Execution Agent', sub: 'AI Chief of Staff console', icon: Cpu },
              ].map(({ href, label, sub, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col justify-between p-3.5 rounded-[8px] bg-[#fcfbf9]/60 hover:bg-slate-50 border border-slate-200/60 transition-all group cursor-pointer h-24"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-950 group-hover:text-black">{label}</span>
                    <Icon className="w-4 h-4 text-slate-600 shrink-0 group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[9.5px] text-slate-650 font-medium leading-tight">{sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Pending Tasks List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-slate-900 uppercase tracking-wider">Recent Tasks</h3>
            <Link
              href="/lifesaver/tasks"
              className="text-[10px] font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-0.5 group"
            >
              Manage Tasks <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {pendingTasks.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pendingTasks.slice(0, 5).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  goals={goals}
                  onToggleStatus={handleToggleTaskStatus}
                  onEdit={() => { window.location.href = `/lifesaver/tasks?edit=${task.id}`; }}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="All Caught Up!"
              description="No pending tasks found. Set up some checkpoint subtasks."
              actionLabel="Add Task"
              onAction={() => { window.location.href = '/lifesaver/tasks?action=create'; }}
            />
          )}
        </div>
      </div>
    </main>
  );
}
