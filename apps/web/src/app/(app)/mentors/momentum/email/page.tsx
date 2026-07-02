'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert,
  Zap, Settings, Star, Trash2, Archive, Check, Edit, FileText,
  Send, Inbox, ArrowRight, Sparkles, Activity, ToggleLeft, ToggleRight,
  Loader2, Plus, Calendar, AlertTriangle, X, Info
} from 'lucide-react';
import { emailIntelligenceService, EmailThread, ActionQueueItem, EmailDraft, TriageRule, EmailOverview } from '@/features/lifesaver/services/EmailIntelligenceService';
import { calendarIntegrationService } from '@/features/lifesaver/services/CalendarIntegrationService';
import { CalendarConnection } from '@/features/lifesaver/types/scheduling';
import { supabase } from '@/lib/supabase';

export default function EmailIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'threads' | 'rules' | 'activity'>('queue');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connection state
  const [connection, setConnection] = useState<CalendarConnection | null>(null);

  // Data states
  const [overview, setOverview] = useState<EmailOverview | null>(null);
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [actionQueue, setActionQueue] = useState<ActionQueueItem[]>([]);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [rules, setRules] = useState<TriageRule[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Real-time AI Agent sync summary actions
  const [newActions, setNewActions] = useState<any[]>([]);

  // Interactive states
  const [selectedThread, setSelectedThread] = useState<ActionQueueItem | EmailThread | null>(null);
  const [activeDraft, setActiveDraft] = useState<EmailDraft | null>(null);
  const [editedDraftBody, setEditedDraftBody] = useState<string>('');
  const [draftSubmitting, setDraftSubmitting] = useState<string | null>(null); // 'approve_send' | 'save' | 'reject'

  // New Rule inputs
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('Spam');
  const [newRuleAction, setNewRuleAction] = useState('auto_delete');
  const [ruleSubmitting, setRuleSubmitting] = useState(false);

  const loadData = useCallback(async (skipSync = false) => {
    try {
      setLoading(true);
      setError(null);

      const connectionData = await calendarIntegrationService.fetchConnection().catch(() => null);
      setConnection(connectionData);

      if (!skipSync) {
        // Trigger background sync on page load (runs real Google sync or mock sync fallback)
        const syncRes = await emailIntelligenceService.syncEmails().catch(() => null);
        if (syncRes && syncRes.actions && syncRes.actions.length > 0) {
          setNewActions(syncRes.actions);
        }
      }

      const [overviewData, threadsData, queueData, draftsData, rulesData] = await Promise.all([
        emailIntelligenceService.fetchOverview().catch(() => null),
        emailIntelligenceService.fetchThreads().catch(() => []),
        emailIntelligenceService.fetchActionQueue().catch(() => []),
        emailIntelligenceService.fetchDrafts().catch(() => []),
        emailIntelligenceService.fetchTriageRules().catch(() => [])
      ]);

      setOverview(overviewData);
      setThreads(threadsData);
      setActionQueue(queueData);
      setDrafts(draftsData);
      setRules(rulesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load email intelligence data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setNewActions([]);
    try {
      const syncRes = await emailIntelligenceService.syncEmails();
      if (syncRes && syncRes.actions && syncRes.actions.length > 0) {
        setNewActions(syncRes.actions);
      }
      await loadData(true);
    } catch (err: any) {
      setError(err.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    setRuleSubmitting(true);
    try {
      await emailIntelligenceService.createTriageRule(
        newRuleName,
        newRuleCategory,
        newRuleAction
      );
      setNewRuleName('');
      // Reload rules
      const rulesData = await emailIntelligenceService.fetchTriageRules();
      setRules(rulesData);
    } catch (err: any) {
      setError(err.message || 'Failed to create rule.');
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await emailIntelligenceService.toggleTriageRule(ruleId);
      const rulesData = await emailIntelligenceService.fetchTriageRules();
      setRules(rulesData);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle rule.');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await emailIntelligenceService.deleteTriageRule(ruleId);
      const rulesData = await emailIntelligenceService.fetchTriageRules();
      setRules(rulesData);
    } catch (err: any) {
      setError(err.message || 'Failed to delete rule.');
    }
  };

  const handleOpenDraftDrawer = (thread: ActionQueueItem | EmailThread) => {
    setSelectedThread(thread);
    // Find draft for this thread
    const foundDraft = drafts.find(d => d.email_thread_id === thread.id);
    if (foundDraft) {
      setActiveDraft(foundDraft);
      setEditedDraftBody(foundDraft.draft_body);
    } else {
      setActiveDraft(null);
      setEditedDraftBody('');
    }
  };

  const handleGenerateDraft = async (threadId: string) => {
    setDraftSubmitting('generate');
    try {
      const generated = await emailIntelligenceService.manualCreateDraft(threadId);
      const draftsData = await emailIntelligenceService.fetchDrafts();
      setDrafts(draftsData);
      setActiveDraft(generated);
      setEditedDraftBody(generated.draft_body || generated.body);
    } catch (err: any) {
      setError(err.message || 'Failed to generate draft.');
    } finally {
      setDraftSubmitting(null);
    }
  };

  const handleDraftAction = async (action: 'approve_send' | 'save' | 'reject') => {
    if (!activeDraft) return;
    setDraftSubmitting(action);
    try {
      await emailIntelligenceService.executeDraftAction(
        activeDraft.id,
        action,
        action !== 'reject' ? editedDraftBody : undefined
      );
      // Refresh drafts and overview
      const draftsData = await emailIntelligenceService.fetchDrafts();
      setDrafts(draftsData);
      
      // Close drawer
      setSelectedThread(null);
      setActiveDraft(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || `Failed to ${action} draft.`);
    } finally {
      setDraftSubmitting(null);
    }
  };

  const getPriorityBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-rose-50 border-rose-250 text-rose-700';
    if (score >= 50) return 'bg-amber-50 border-amber-250 text-amber-700';
    return 'bg-slate-50 border-slate-200 text-slate-650';
  };

  const getInboxHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const filteredThreads = filterCategory === 'all' 
    ? threads 
    : threads.filter(t => t.category === filterCategory);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-500" />
            Email Intelligence Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            Autonomous opportunity parsing, deadline extraction, and reply assists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-950 text-white hover:bg-black rounded-[8px] text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors"
          >
            {syncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Syncing Inbox...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Sync Workspace Emails
              </>
            )}
          </button>
        </div>
      </div>

      {/* Google Workspace Connection Banner (Real-time secure check) */}
      {!connection && (
        <div className="bg-[#f9f9f8] border border-slate-200 rounded-[12px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in shadow-2xs">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              Workspace connection required
            </h3>
            <p className="text-[10.5px] text-slate-500 leading-normal">
              Connect your Google account to securely sync emails, extract deadlines, auto-create roadmaps, and generate drafts.
            </p>
          </div>
          <a
            href="/mentors/momentum/scheduling"
            className="shrink-0 px-3.5 py-1.5 bg-slate-950 text-white hover:bg-black rounded-[6px] text-xs font-medium transition-colors"
          >
            Connect Workspace
          </a>
        </div>
      )}

      {/* AI Agent Sync Real-Time Actions Summary Banner */}
      {newActions.length > 0 && (
        <div className="bg-slate-50/50 border border-slate-200 rounded-[12px] p-5 space-y-4 animate-fade-in shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-800 animate-pulse" />
              AI Agent Execution: Real-Time Sync Summary
            </h3>
            <button
              onClick={() => setNewActions([])}
              className="text-slate-500 hover:text-slate-800 text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              Dismiss
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
            Momentum AI triaged your inbox in real time and executed the following autonomous actions to protect your calendar and prepare your roadmaps:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-80 overflow-y-auto pr-1">
            {newActions.map((action, idx) => (
              <div key={idx} className="bg-white border border-slate-200 hover:border-slate-300 rounded-[10px] p-4 flex flex-col justify-between gap-3 shadow-3xs transition-all hover:shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9.5px] font-mono text-slate-400 truncate max-w-[140px]">{action.sender}</span>
                    <span className="text-[9px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/50">{action.category}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 leading-tight">{action.subject}</h4>
                  {action.urgency_reason && (
                    <p className="text-[10px] text-slate-550 font-medium leading-relaxed border-t border-slate-100 pt-1.5">
                      <span className="font-semibold text-slate-700">AI Triage:</span> {action.urgency_reason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-50">
                  {action.opportunity_detected && (
                    <span className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-[9.5px] font-semibold px-2 py-0.5 rounded-[5px] flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-500" />
                      Goal Created
                    </span>
                  )}
                  {action.deadline_extracted && (
                    <span className="bg-rose-50 border border-rose-250 text-rose-800 text-[9.5px] font-semibold px-2 py-0.5 rounded-[5px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-500" />
                      Task Scheduled
                    </span>
                  )}
                  {action.draft_created && (
                    <span className="bg-amber-50 border border-amber-250 text-amber-800 text-[9.5px] font-semibold px-2 py-0.5 rounded-[5px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Reply Drafted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-250 text-rose-800 text-xs p-3.5 rounded-[8px] flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Stats Overview Grid */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Inbox Health Score Card */}
          <div className="bg-white border border-slate-200 rounded-[12px] p-5 flex items-center gap-4 shadow-2xs">
            <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                <circle
                  cx="32" cy="32" r="26"
                  stroke={overview.health_score >= 80 ? "#10b981" : overview.health_score >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="6" fill="transparent"
                  strokeDasharray={163.3}
                  strokeDashoffset={163.3 - (163.3 * overview.health_score) / 100}
                />
              </svg>
              <span className={`absolute text-base font-semibold ${getInboxHealthColor(overview.health_score)}`}>
                {overview.health_score}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Inbox Health</span>
              <span className="text-xs font-semibold text-slate-800 leading-tight block mt-0.5">
                {overview.health_score >= 80 ? 'Excellent' : overview.health_score >= 50 ? 'Needs Triage' : 'Critical Action Needed'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Based on unread urgency & drafts.</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-2xs">
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Urgent Action Queue</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-semibold text-slate-850 leading-none">{overview.action_queue_count}</span>
              <span className="text-[10px] text-slate-550 font-medium">items</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-2">Requires replies or prep goals.</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-2xs">
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Pending Opportunities</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-semibold text-emerald-650 leading-none">{overview.pending_opportunities}</span>
              <span className="text-[10px] text-slate-550 font-medium">detected</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-2">Interviews or coding tests.</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-2xs">
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Cleaned via Triage</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-semibold text-slate-850 leading-none">{overview.cleansed_count}</span>
              <span className="text-[10px] text-slate-550 font-medium">archived/deleted</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-2">Auto rules saved click time.</span>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 text-xs font-semibold transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === 'queue' ? 'border-slate-900 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Action Queue ({actionQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('threads')}
            className={`pb-3 text-xs font-semibold transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === 'threads' ? 'border-slate-900 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            All Threads ({threads.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 text-xs font-semibold transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === 'rules' ? 'border-slate-900 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Triage Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 text-xs font-semibold transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === 'activity' ? 'border-slate-900 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Agent Log
          </button>
        </div>

        {activeTab === 'threads' && (
          <div className="pb-2 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Filter:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-slate-200 text-[11px] rounded-[6px] py-1 px-2 text-slate-700 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Job Opportunity">Job Opportunities</option>
              <option value="Interview">Interviews</option>
              <option value="Assessment">Assessments</option>
              <option value="Newsletter">Newsletters</option>
              <option value="Promotion">Promotions</option>
              <option value="Spam">Spam</option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}
      </div>

      {/* Main content body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Loader2 className="w-7 h-7 text-slate-500 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Triage analyzing emails...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Middle: Lists depending on tabs */}
          <div className="lg:col-span-2 space-y-4">
            
            {activeTab === 'queue' && (
              <div className="space-y-3">
                {actionQueue.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-[12px] p-10 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h3 className="text-xs font-semibold text-slate-800">Clear Action Queue</h3>
                    <p className="text-[10.5px] text-slate-500">No urgent deadlines or pending replies in your inbox.</p>
                  </div>
                ) : (
                  actionQueue.map((item) => {
                    const hasDraft = drafts.some(d => d.email_thread_id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-[12px] p-5 space-y-3.5 transition-all shadow-2xs group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 font-mono">{item.sender}</span>
                            <h4 className="text-xs font-semibold text-slate-900 group-hover:text-black transition-colors">{item.subject}</h4>
                            <p className="text-[10.5px] text-slate-500 line-clamp-1">{item.snippet}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`text-[10px] font-medium px-2 py-0.5 border rounded-[6px] ${getPriorityBadgeColor(item.priority_score)}`}>
                              Priority {item.priority_score}
                            </span>
                            <span className="text-[9.5px] font-medium text-slate-400">{item.category}</span>
                          </div>
                        </div>

                        {/* Urgency Explanation */}
                        {item.urgency_reason && (
                          <div className="bg-[#f9f9f8] border border-slate-200 rounded-[8px] p-2.5 text-[10.5px] text-slate-500 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-450 shrink-0 mt-0.5" />
                            <span><span className="font-semibold text-slate-700">AI Logic:</span> {item.urgency_reason}</span>
                          </div>
                        )}

                        {/* Opportunity / Deadline indicators */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.opportunity && (
                            <span className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-[10px] font-medium px-2.5 py-1 rounded-[6px] flex items-center gap-1">
                              <Zap className="w-3 h-3 text-emerald-500" />
                              Goal Roadmapped
                            </span>
                          )}
                          {item.deadline && (
                            <span className="bg-rose-50 border border-rose-250 text-rose-800 text-[10px] font-medium px-2.5 py-1 rounded-[6px] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-rose-500" />
                              Task Created: Due {new Date(item.deadline.deadline_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                          <button
                            onClick={() => handleOpenDraftDrawer(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-medium rounded-[6px] transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            {hasDraft ? 'Review Draft Response' : 'Draft AI Reply'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'threads' && (
              <div className="bg-white border border-slate-200 rounded-[12px] overflow-hidden shadow-2xs">
                <div className="divide-y divide-slate-150">
                  {filteredThreads.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-xs">No threads found in this category.</div>
                  ) : (
                    filteredThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => handleOpenDraftDrawer(thread)}
                        className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-slate-400 truncate max-w-xs">{thread.sender}</span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {new Date(thread.last_message_date).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-[11.5px] font-semibold text-slate-800 truncate">{thread.subject}</h4>
                          <p className="text-[10.5px] text-slate-500 truncate">{thread.snippet}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[9.5px] font-medium px-1.5 py-0.5 border rounded-[5px] ${getPriorityBadgeColor(thread.priority_score)}`}>
                            {thread.priority_score}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 w-24 text-right truncate">
                            {thread.category}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-4 animate-fade-in">
                {/* Rules Creator Card */}
                <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-slate-500" />
                    Configure Triage Rules
                  </h3>
                  <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Rule Name (e.g. Auto-delete Promotions)"
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <select
                        value={newRuleCategory}
                        onChange={(e) => setNewRuleCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-[6px] py-1.5 px-2 text-xs text-slate-900 focus:outline-none"
                      >
                        <option value="Spam">Spam</option>
                        <option value="Promotion">Promotions</option>
                        <option value="Newsletter">Newsletters</option>
                        <option value="Job Opportunity">Job Opportunities</option>
                        <option value="Interview">Interviews</option>
                        <option value="Assessment">Assessments</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={newRuleAction}
                        onChange={(e) => setNewRuleAction(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-[6px] py-1.5 px-2 text-xs text-slate-900 focus:outline-none"
                      >
                        <option value="auto_delete">Auto Delete</option>
                        <option value="auto_archive">Auto Archive</option>
                        <option value="auto_star">Auto Star</option>
                        <option value="mark_read">Mark Read</option>
                      </select>
                    </div>
                    <div className="md:col-span-4 flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={ruleSubmitting}
                        className="px-4 py-1.5 bg-slate-950 text-white rounded-[6px] text-xs font-medium hover:bg-black transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Triage Rule
                      </button>
                    </div>
                  </form>
                </div>

                {/* Rules List */}
                <div className="bg-white border border-slate-200 rounded-[12px] overflow-hidden shadow-2xs divide-y divide-slate-150">
                  {rules.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-xs">No triage rules configured. Create one above to automate your inbox.</div>
                  ) : (
                    rules.map((rule) => (
                      <div key={rule.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-[11.5px] font-semibold text-slate-900">{rule.rule_name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Filter: {rule.category_filter}
                            </span>
                            <span className="text-[9.5px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Action: {rule.action.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleRule(rule.id)}
                            className="text-slate-500 hover:text-slate-900 transition-colors p-1"
                            title="Toggle Rule"
                          >
                            {rule.is_active ? (
                              <ToggleRight className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-350" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-slate-500" />
                  Email Agent Activity Timeline
                </h3>

                <div className="space-y-4 border-l border-slate-200 pl-4 py-1.5 ml-2">
                  {overview?.activities.length === 0 ? (
                    <div className="text-xs text-slate-500 py-6">No recent actions logged. Click Sync to fetch emails.</div>
                  ) : (
                    overview?.activities.map((act) => (
                      <div key={act.id} className="relative space-y-1">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-950" />
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-400 font-mono">{act.action_type}</span>
                          <span className="text-[9px] text-slate-400">
                            {act.created_at ? new Date(act.created_at).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-650 leading-normal">{act.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: AI Assistant Insights / Action details */}
          <div className="space-y-4">
            
            <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-slate-500" />
                Co-Pilot AI Analytics
              </h3>
              
              <div className="space-y-3 text-[11px] text-slate-600 leading-relaxed">
                <p>
                  Momentum AI triages incoming mail to discover deadlines and opportunities automatically, avoiding manual task tracking overhead.
                </p>
                <div className="bg-[#f9f9f8] border border-slate-200 rounded-[8px] p-3 space-y-2">
                  <span className="font-semibold text-slate-800 block text-[10.5px]">Active Pipeline</span>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-500">
                    <li>Assessment Preps: auto-goals created.</li>
                    <li>Interviews: roadmap steps & slots logged.</li>
                    <li>Star rules: high importance marked.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* List of drafts needing approval */}
            <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-slate-500" />
                AI Reply Assists Needed ({drafts.length})
              </h3>
              
              <div className="space-y-2">
                {drafts.length === 0 ? (
                  <p className="text-[10.5px] text-slate-505">All drafted replies cleared or sent.</p>
                ) : (
                  drafts.map((draft) => {
                    const matchedThread = threads.find(t => t.id === draft.email_thread_id) || 
                                         actionQueue.find(q => q.id === draft.email_thread_id);
                    return (
                      <div
                        key={draft.id}
                        onClick={() => {
                          if (matchedThread) handleOpenDraftDrawer(matchedThread);
                        }}
                        className="border border-slate-200 hover:border-slate-300 p-3 rounded-[8px] bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-slate-700 truncate max-w-[120px]">{draft.recipient}</span>
                          <span className="font-semibold text-slate-400">Pending</span>
                        </div>
                        <h4 className="text-[11px] font-semibold text-slate-800 truncate">{draft.subject}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{draft.draft_body}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Slide-over Drawer for Thread Detail and AI Draft reply */}
      {selectedThread && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => {
              setSelectedThread(null);
              setActiveDraft(null);
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Panel */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-xl flex flex-col z-50 animate-slide-in-right border-l border-slate-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[9.5px] font-medium text-slate-400 tracking-wider font-mono">{selectedThread.sender}</span>
                <h3 className="text-xs font-semibold text-slate-900 mt-0.5 truncate max-w-md">{selectedThread.subject}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedThread(null);
                  setActiveDraft(null);
                }}
                className="text-slate-400 hover:text-slate-750 p-1.5 rounded-full hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Original Email Body */}
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-slate-400 tracking-wider block">Original Email Body</span>
                <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {selectedThread.body}
                </div>
              </div>

              {/* Action queue signals linked */}
              {(selectedThread as ActionQueueItem).opportunity && (
                <div className="bg-emerald-50/70 border border-emerald-250 p-4 rounded-[10px] space-y-2">
                  <h4 className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Autonomous Goal Connected
                  </h4>
                  <p className="text-[10.5px] text-emerald-800 leading-normal">
                    Momentum AI detected a <span className="font-semibold">{(selectedThread as ActionQueueItem).opportunity?.opportunity_type}</span> from this email and created a structured career preparation goal. Let the Execution Agent know if you need to generate daily study missions.
                  </p>
                </div>
              )}

              {/* AI Reply drafting interface */}
              <div className="space-y-3.5 border-t border-slate-150 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    AI Reply Assistant
                  </span>
                  
                  {!activeDraft && (
                    <button
                      onClick={() => handleGenerateDraft(selectedThread.id)}
                      disabled={draftSubmitting === 'generate'}
                      className="px-3 py-1 bg-slate-900 hover:bg-black text-white text-[10px] font-medium rounded-[5px] disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      {draftSubmitting === 'generate' ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Drafting...
                        </>
                      ) : (
                        'Generate Draft Reply'
                      )}
                    </button>
                  )}
                </div>

                {activeDraft ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-semibold text-slate-500">Recipient:</span>
                        <span className="font-mono text-slate-800 font-semibold">{activeDraft.recipient}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-semibold text-slate-500">Subject:</span>
                        <span className="text-slate-800 font-semibold">{activeDraft.subject}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-medium text-slate-400 tracking-wide">Reply Draft</label>
                      <textarea
                        rows={8}
                        value={editedDraftBody}
                        onChange={(e) => setEditedDraftBody(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-[8px] p-3 text-[11px] text-slate-800 focus:outline-none focus:border-slate-900 leading-relaxed font-sans"
                        placeholder="AI response text..."
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleDraftAction('approve_send')}
                        disabled={!!draftSubmitting}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-black text-white text-xs font-medium rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {draftSubmitting === 'approve_send' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Approve & Send
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDraftAction('save')}
                        disabled={!!draftSubmitting}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-[8px] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {draftSubmitting === 'save' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Save Draft'
                        )}
                      </button>

                      <button
                        onClick={() => handleDraftAction('reject')}
                        disabled={!!draftSubmitting}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-[8px] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {draftSubmitting === 'reject' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Reject Suggestion'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  draftSubmitting !== 'generate' && (
                    <div className="border border-dashed border-slate-200 rounded-[8px] p-8 text-center text-[10.5px] text-slate-500">
                      No draft generated yet. Click "Generate Draft Reply" to compose a smart response using Gemini.
                    </div>
                  )
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
