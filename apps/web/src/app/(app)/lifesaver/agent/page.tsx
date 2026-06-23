'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, Activity, Brain, ShieldAlert, Bell, Upload, Search, Calendar,
  CheckCircle2, AlertTriangle, FileText, RefreshCw, Send,
  Loader2, Sparkles, TrendingUp, Clock, CheckSquare, Sparkle, AlertCircle,
  Mail, Zap, BarChart2
} from 'lucide-react';
import { agentHubService } from '@/features/lifesaver/services/AgentHubService';
import { supabase } from '@/lib/supabase';
import {
  AgentOverview,
  AgentSignal,
  AgentNotification,
  MentorMessage,
  DailyBriefing,
  WeeklyReview,
  AgentActivityLog,
  KnowledgeSource
} from '@/features/lifesaver/types/agent';

export default function AgentHubPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'mentor' | 'reviews' | 'vault'>('overview');

  // Auth
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Loading & state
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AgentOverview | null>(null);
  const [signals, setSignals] = useState<AgentSignal[]>([]);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [mentorMessages, setMentorMessages] = useState<MentorMessage[]>([]);
  const [morningBriefing, setMorningBriefing] = useState<DailyBriefing | null>(null);
  const [eveningBriefing, setEveningBriefing] = useState<DailyBriefing | null>(null);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [activityFeed, setActivityFeed] = useState<AgentActivityLog[]>([]);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);

  // RAG & Knowledge Vault
  const [ragQuery, setRagQuery] = useState('');
  const [ragAnswer, setRagAnswer] = useState<string | null>(null);
  const [ragChunks, setRagChunks] = useState<Array<{ file_name: string; content: string; score: number }>>([]);
  const [queryingRag, setQueryingRag] = useState(false);

  // File Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState('study_material');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Briefing regeneration
  const [regenType, setRegenType] = useState<'morning' | 'evening' | 'weekly' | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load user email from session
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email ?? null);

      const [
        overviewData,
        signalsData,
        notificationsData,
        messagesData,
        morningData,
        eveningData,
        reviewsData,
        activityData,
        sourcesData
      ] = await Promise.all([
        agentHubService.getOverview().catch(() => null),
        agentHubService.getSignals().catch(() => []),
        agentHubService.getNotifications().catch(() => []),
        agentHubService.getMentorMessages().catch(() => []),
        agentHubService.getDailyBriefing('morning').catch(() => null),
        agentHubService.getDailyBriefing('evening').catch(() => null),
        agentHubService.getWeeklyReviews().catch(() => []),
        agentHubService.getActivityFeed().catch(() => []),
        agentHubService.getKnowledgeSources().catch(() => [])
      ]);

      setOverview(overviewData);
      setSignals(signalsData);
      setNotifications(notificationsData);
      setMentorMessages(messagesData);
      setMorningBriefing(morningData);
      setEveningBriefing(eveningData);
      setWeeklyReviews(reviewsData);
      setActivityFeed(activityData);
      setKnowledgeSources(sourcesData);
    } catch (err) {
      console.error('Error fetching Agent Hub data', err);
    } finally {
      setLoading(false);
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

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      await agentHubService.triggerEvaluation();
      await loadData();
    } catch (err) {
      console.error('Evaluation failed', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSendDeadlineReminders = async () => {
    try {
      setSendingReminders(true);
      setReminderSuccess(null);
      setReminderError(null);
      const result = await agentHubService.sendDeadlineReminders();
      setReminderSuccess(result.message || `Sent ${result.reminders_sent ?? 0} Reminder(s) Successfully.`);
      setTimeout(() => setReminderSuccess(null), 6000);
      await loadData();
    } catch (err) {
      console.error('Deadline reminder failed', err);
      const msg = err instanceof Error ? err.message : 'Failed To Send Reminders. Please Try Again.';
      setReminderError(msg.charAt(0).toUpperCase() + msg.slice(1));
      setTimeout(() => setReminderError(null), 5000);
    } finally {
      setSendingReminders(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await agentHubService.markNotificationsRead();
      const notificationsData = await agentHubService.getNotifications();
      setNotifications(notificationsData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenBriefing = async (type: 'morning' | 'evening') => {
    try {
      setRegenType(type);
      const data = await agentHubService.regenerateDailyBriefing(type);
      if (type === 'morning') setMorningBriefing(data);
      else setEveningBriefing(data);
      await loadData();
    } catch (err) {
      console.error('Regen briefing failed', err);
    } finally {
      setRegenType(null);
    }
  };

  const handleRegenWeekly = async () => {
    try {
      setRegenType('weekly');
      await agentHubService.regenerateWeeklyReview();
      const reviewsData = await agentHubService.getWeeklyReviews();
      setWeeklyReviews(reviewsData);
    } catch (err) {
      console.error('Regen weekly failed', err);
    } finally {
      setRegenType(null);
    }
  };

  const handleQueryRag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    try {
      setQueryingRag(true);
      const res = await agentHubService.queryKnowledge(ragQuery);
      setRagAnswer(res.answer);
      setRagChunks(res.chunks || []);
    } catch (err) {
      console.error('RAG query failed', err);
      setRagAnswer('Failed to retrieve answer. Please try again.');
    } finally {
      setQueryingRag(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      setUploading(true);
      await agentHubService.uploadKnowledge(uploadFile, sourceType);
      setUploadSuccess(true);
      setUploadFile(null);
      setTimeout(() => setUploadSuccess(false), 3000);
      const sourcesData = await agentHubService.getKnowledgeSources();
      setKnowledgeSources(sourcesData);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <RefreshCw className="w-6 h-6 text-slate-500 animate-spin" />
        <span className="text-[11px] font-semibold text-slate-600">Initializing Agent Hub...</span>
      </div>
    );
  }

  return (
    <div className="w-full px-14 py-6 space-y-6">

      {/* Page Header – matches execution page style */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-slate-900 border border-slate-900 flex items-center justify-center text-white shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-950 tracking-tight">Agent Hub</h2>
          <p className="text-[10.5px] text-slate-500 font-medium">
            Autonomous AI Chief of Staff — monitors goals, sends reminders, and delivers personalized coaching.
          </p>
        </div>
      </div>

      {/* User Email + Status Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-[8px] p-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-800">Agent Active</span>
          </div>
          {userEmail && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Notifications → <span className="font-semibold text-slate-700 font-mono">{userEmail}</span></span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Quick stat pills */}
          <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            {overview?.confidence_score ?? 85}% Confidence
          </span>
          <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            {overview?.focus_score ?? 75}/100 Focus
          </span>
          <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            {overview?.active_signals_count ?? 0} Active Signals
          </span>
        </div>
      </div>

      {/* Reminder Success Toast */}
      {reminderSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[8px] flex items-center gap-2.5 text-[10.5px] text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{reminderSuccess}</span>
        </div>
      )}

      {/* Reminder Error Toast */}
      {reminderError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] flex items-center gap-2.5 text-[10.5px] text-red-800 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{reminderError}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-0">
        <div className="flex items-center gap-0">
          {(['overview', 'mentor', 'reviews', 'vault'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[11.5px] font-bold tracking-tight transition-all relative border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-slate-900 text-slate-950'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'overview' && 'Diagnostics & Signals'}
              {tab === 'mentor' && 'Daily Coaching'}
              {tab === 'reviews' && 'Weekly Reviews'}
              {tab === 'vault' && 'Knowledge Vault'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Deadline Reminder Button */}
          <button
            onClick={handleSendDeadlineReminders}
            disabled={sendingReminders}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-[8px] text-[11px] font-bold transition-all disabled:opacity-50"
          >
            {sendingReminders ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending...</>
            ) : (
              <><Mail className="w-3.5 h-3.5" />Send Deadline Reminders</>
            )}
          </button>

          {activeTab === 'overview' && (
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[8px] text-[11px] font-bold transition-all disabled:opacity-50"
            >
              {evaluating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Evaluating...</>
              ) : (
                <><RefreshCw className="w-3.5 h-3.5" />Run Diagnostic</>
              )}
            </button>
          )}

          {activeTab === 'reviews' && (
            <button
              onClick={handleRegenWeekly}
              disabled={regenType === 'weekly'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[8px] text-[11px] font-bold transition-all disabled:opacity-50"
            >
              {regenType === 'weekly' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</>
              ) : (
                <><RefreshCw className="w-3.5 h-3.5" />Regenerate Review</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENTS */}
      <div>

        {/* ── Tab 1: Overview & Signals ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Signals */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  Live Agent Signals
                </h3>
                {notifications.some(n => n.status === 'unread') && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Mark all read →
                  </button>
                )}
              </div>

              {signals.length === 0 ? (
                <div className="bg-white border border-slate-200/60 rounded-[12px] p-8 text-center space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                  <p className="text-[12px] font-semibold text-slate-800">No Risk Signals Active</p>
                  <p className="text-[10.5px] text-slate-500">Agent is monitoring your goals, tasks, and calendar for anomalies.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {signals.map((sig) => (
                    <div
                      key={sig.id}
                      className={`p-4 rounded-[10px] border bg-white shadow-xs flex items-start gap-3 ${
                        sig.severity === 'critical'
                          ? 'border-l-4 border-l-rose-400 border-slate-200'
                          : sig.severity === 'high'
                          ? 'border-l-4 border-l-amber-400 border-slate-200'
                          : 'border-l-4 border-l-slate-400 border-slate-200'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {sig.severity === 'critical' ? (
                          <ShieldAlert className="w-4 h-4 text-rose-500" />
                        ) : sig.severity === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Activity className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="text-[12px] font-semibold text-slate-900">{sig.title}</h4>
                          <span className="text-[9.5px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
                            {new Date(sig.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">{sig.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notifications Feed */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                  Recent Alerts
                </h3>

                <div className="bg-white border border-slate-200/60 rounded-[10px] overflow-hidden divide-y divide-slate-100 shadow-xs">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-slate-400">No alerts yet. Run a diagnostic to generate signals.</div>
                  ) : (
                    notifications.slice(0, 6).map((notif) => (
                      <div key={notif.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-900">{notif.title}</span>
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${
                              notif.category === 'critical_deadline' ? 'bg-rose-100 text-rose-700'
                                : notif.category === 'missed_task' ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {notif.category.replace(/_/g, ' ')}
                            </span>
                            {notif.status === 'unread' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">{notif.body}</p>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-medium shrink-0 mt-0.5">
                          {new Date(notif.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Activity Timeline */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Activity Timeline
              </h3>

              {activityFeed.length === 0 ? (
                <div className="bg-white border border-slate-200/60 rounded-[12px] p-6 text-center space-y-2">
                  <Zap className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-[11px] text-slate-400">No activity recorded yet. Run a diagnostic check to populate.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 pl-5 ml-2 flex flex-col gap-5 py-2">
                  {activityFeed.slice(0, 10).map((act) => (
                    <div key={act.id} className="relative group">
                      <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-700 shadow-sm group-hover:scale-125 transition-transform" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[11.5px] font-semibold text-slate-800">{act.description}</span>
                        <span className="text-[9.5px] text-slate-500 uppercase tracking-wide">
                          {act.activity_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab 2: Daily Coaching & Briefings ── */}
        {activeTab === 'mentor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Latest Mentor Coaching */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-slate-500" />
                Mentor Coaching Log
              </h3>

              <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-xs space-y-4">
                {mentorMessages.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Brain className="w-4 h-4 text-slate-600" />
                      <span className="text-[11px] font-bold text-slate-700">Latest Reflection</span>
                    </div>
                    <p className="text-[12.5px] text-slate-700 leading-relaxed font-medium">
                      &ldquo;{mentorMessages[0].message}&rdquo;
                    </p>
                    <div className="text-[9.5px] text-slate-400 uppercase tracking-wider">
                      {new Date(mentorMessages[0].created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <Brain className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-[11px] text-slate-500 font-medium">No coaching logs yet.</p>
                    <p className="text-[10px] text-slate-400">Generate your first coaching session below.</p>
                  </div>
                )}

                <button
                  onClick={async () => {
                    setRegenType('morning');
                    await agentHubService.triggerMentorCoaching();
                    await loadData();
                    setRegenType(null);
                  }}
                  disabled={regenType === 'morning'}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-[8px] text-[11px] font-bold transition-all disabled:opacity-50"
                >
                  {regenType === 'morning' ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" />New Coaching Session</>
                  )}
                </button>
              </div>

              {/* All coaching history */}
              {mentorMessages.length > 1 && (
                <div className="bg-white border border-slate-200/60 rounded-[12px] overflow-hidden shadow-xs">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Previous Sessions</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {mentorMessages.slice(1, 4).map((msg) => (
                      <div key={msg.id} className="px-4 py-3">
                        <p className="text-[11px] text-slate-600 leading-relaxed truncate-2-lines">{msg.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Morning & Evening Briefings */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Morning Briefing */}
              <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-xs">
                <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div>
                      <h4 className="text-[13px] font-semibold text-slate-900">Morning Briefing</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Daily Mission & Focus Check</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRegenBriefing('morning')}
                    disabled={regenType === 'morning'}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regenType === 'morning' ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-[9.5px] text-amber-600 font-bold uppercase tracking-wider">Today&apos;s Focus Mission</span>
                    <p className="text-[12.5px] font-semibold text-slate-800 mt-1">
                      {morningBriefing?.briefing_data?.mission ?? "Run your morning briefing to get today's focus mission."}
                    </p>
                  </div>

                  {morningBriefing?.briefing_data?.priority_tasks && morningBriefing.briefing_data.priority_tasks.length > 0 && (
                    <div>
                      <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Priority Checklist</span>
                      <div className="flex flex-col gap-2">
                        {morningBriefing.briefing_data.priority_tasks.map((task, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 font-medium">
                            <CheckSquare className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {morningBriefing?.briefing_data?.warnings && morningBriefing.briefing_data.warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-3 flex items-start gap-2 text-[10.5px] text-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Pacing Warning: </span>
                        {morningBriefing.briefing_data.warnings[0]}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Evening Briefing */}
              <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-xs">
                <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-600" />
                    <div>
                      <h4 className="text-[13px] font-semibold text-slate-900">Evening Briefing</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Daily Reflection & Recommendations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRegenBriefing('evening')}
                    disabled={regenType === 'evening'}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regenType === 'evening' ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">AI Daily Reflection</span>
                    <p className="text-[12px] text-slate-700 mt-1 leading-relaxed">
                      {eveningBriefing?.briefing_data?.reflection ?? "Your evening review will appear after you regenerate or the agent runs its nightly evaluation."}
                    </p>
                  </div>

                  {eveningBriefing?.briefing_data?.tomorrow_recommendations && eveningBriefing.briefing_data.tomorrow_recommendations.length > 0 && (
                    <div>
                      <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Tomorrow&apos;s Recommendations</span>
                      <div className="flex flex-col gap-2">
                        {eveningBriefing.briefing_data.tomorrow_recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 font-medium">
                            <Sparkle className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Weekly Reviews ── */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6">
            {weeklyReviews.length === 0 ? (
              <div className="bg-white border border-slate-200/60 rounded-[12px] p-10 text-center space-y-3 shadow-xs">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-[12.5px] font-semibold text-slate-800">No Weekly Reports Yet</p>
                <p className="text-[10.5px] text-slate-500">Reports compile automatically on Sundays. Click &ldquo;Regenerate Review&rdquo; above to compile one now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Metrics */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Deep Work Hours', value: weeklyReviews[0].deep_work_hours, suffix: 'hrs', trend: '+15%' },
                      { label: 'Calendar Utilization', value: `${weeklyReviews[0].calendar_utilization}%`, suffix: '', trend: null },
                      { label: 'Recovery Success', value: `${weeklyReviews[0].recovery_success_rate}%`, suffix: '', trend: null },
                      { label: 'Focus Score', value: `${weeklyReviews[0].focus_score}/100`, suffix: '', trend: null },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white border border-slate-200/60 rounded-[10px] p-4 shadow-xs">
                        <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">{stat.label}</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-[24px] font-bold text-slate-900 tracking-tight">{stat.value}</span>
                          {stat.trend && (
                            <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" />{stat.trend}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Review Text */}
                  <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-xs">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                      <BarChart2 className="w-4 h-4 text-slate-600" />
                      <h4 className="text-[12.5px] font-semibold text-slate-900">AI Chief of Staff Review</h4>
                    </div>
                    <p className="text-[12px] text-slate-700 leading-relaxed font-medium">
                      {weeklyReviews[0].report_text}
                    </p>
                  </div>
                </div>

                {/* Goal Progress */}
                <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-xs">
                  <h4 className="text-[12.5px] font-semibold text-slate-900 mb-4">Goal Progress</h4>
                  <div className="flex flex-col gap-4">
                    {weeklyReviews[0].goal_progress && weeklyReviews[0].goal_progress.length > 0 ? (
                      weeklyReviews[0].goal_progress.map((gp, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700">
                            <span className="truncate max-w-[160px]">{gp.goal}</span>
                            <span>{gp.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-800 rounded-full transition-all"
                              style={{ width: `${gp.progress}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400">No goals tracked this week.</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: Knowledge Vault (RAG) ── */}
        {activeTab === 'vault' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Upload + Sources */}
            <div className="flex flex-col gap-5">

              {/* Upload */}
              <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-xs">
                <h4 className="text-[12.5px] font-semibold text-slate-900 mb-4">Upload Document</h4>
                <form onSubmit={handleFileUpload} className="flex flex-col gap-3">
                  <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-[10px] p-5 text-center cursor-pointer relative group transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx,.doc"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                    {uploadFile ? (
                      <span className="text-[11px] font-bold text-slate-800 block truncate">{uploadFile.name}</span>
                    ) : (
                      <>
                        <span className="text-[11px] font-semibold text-slate-600 block">Drop file or click to select</span>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5">PDF, TXT, DOCX — up to 10MB</span>
                      </>
                    )}
                  </label>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Source Category</label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                      className="border border-slate-200 rounded-[8px] px-3 py-1.5 text-[11px] font-medium bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    >
                      <option value="resume">Resume & Cover Letter</option>
                      <option value="job_description">Job Description</option>
                      <option value="study_material">Study Guides & Materials</option>
                      <option value="roadmap">Roadmaps & Curriculum</option>
                      <option value="other">Other Document</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={!uploadFile || uploading}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-[8px] text-[11px] font-bold transition-all disabled:opacity-50"
                  >
                    {uploading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading & Indexing...</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" />Index Into Vault</>
                    )}
                  </button>

                  {uploadSuccess && (
                    <span className="text-[10.5px] text-emerald-600 font-bold text-center block">
                      ✓ Uploaded and indexed successfully.
                    </span>
                  )}
                </form>
              </div>

              {/* Indexed Sources */}
              <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-xs">
                <h4 className="text-[12.5px] font-semibold text-slate-900 mb-3">Indexed Documents</h4>
                <div className="flex flex-col gap-2">
                  {knowledgeSources.length === 0 ? (
                    <p className="text-[10.5px] text-slate-400 text-center py-4">No vault documents indexed yet.</p>
                  ) : (
                    knowledgeSources.map((ks) => (
                      <div key={ks.id} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50/60 border border-slate-100 rounded-[8px]">
                        <div className="flex items-start gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[10.5px] font-semibold text-slate-800 block truncate">{ks.title}</span>
                            <span className="text-[8.5px] text-slate-400 font-semibold uppercase tracking-wider block">{ks.source_type}</span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 uppercase ${
                          ks.processing_status === 'completed' || ks.is_processed
                            ? 'bg-emerald-100 text-emerald-700'
                            : ks.processing_status === 'failed'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600 animate-pulse'
                        }`}>
                          {ks.processing_status === 'completed' || ks.is_processed ? 'Ready' : ks.processing_status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: RAG Search */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 shadow-xs flex flex-col gap-5 min-h-[450px]">
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-900">Semantic AI Search</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Query your vault using Retrieval-Augmented Generation.</p>
                </div>

                <form onSubmit={handleQueryRag} className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={ragQuery}
                      onChange={(e) => setRagQuery(e.target.value)}
                      placeholder="Ask a question (e.g. 'Key points from my interview PDF?')..."
                      className="w-full border border-slate-200 rounded-[8px] pl-9 pr-3 py-2 text-[11.5px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 bg-slate-50/50"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <button
                    type="submit"
                    disabled={queryingRag || !ragQuery.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-[8px] text-[11px] font-bold disabled:opacity-50 transition-all shrink-0"
                  >
                    {queryingRag ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><Send className="w-3.5 h-3.5" />Search</>
                    )}
                  </button>
                </form>

                {ragAnswer && (
                  <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 flex flex-col gap-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block">Mentor AI Response</span>
                        <p className="text-[12px] text-slate-800 leading-relaxed font-medium mt-1">{ragAnswer}</p>
                      </div>
                    </div>

                    {ragChunks.length > 0 && (
                      <div className="pt-3 border-t border-slate-200">
                        <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Sources Referenced</span>
                        <div className="flex flex-col gap-2">
                          {ragChunks.map((c, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 p-3 rounded-[8px] text-[10.5px] text-slate-600 leading-relaxed">
                              <span className="font-semibold text-slate-700 block mb-1">
                                <FileText className="w-3 h-3 inline mr-1" />{c.file_name} — {Math.round(c.score * 100)}% match
                              </span>
                              &ldquo;{c.content}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!ragAnswer && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Search className="w-8 h-8 text-slate-200 mx-auto" />
                      <p className="text-[11px] text-slate-400">Upload documents and ask questions to get AI-powered answers from your personal vault.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
