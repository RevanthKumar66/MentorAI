'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ArrowLeft, MessageSquare, Cpu, FileText, BarChart3, 
  Calendar, Sparkles, Brain, Code, GitFork, 
  Search, Briefcase, GraduationCap, LucideIcon
} from 'lucide-react';
import { chatApi, UserAnalytics } from '@/modules/chat/services/chat-api';

const ROLE_DETAILS: Record<string, { name: string; icon: LucideIcon; colorClass: string; bgClass: string }> = {
  general: { name: 'General Assistant', icon: Sparkles, colorClass: 'text-slate-700', bgClass: 'bg-slate-50 border-slate-200' },
  learning: { name: 'Learning Mentor', icon: GraduationCap, colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50 border-emerald-100' },
  coding: { name: 'Coding Assistant', icon: Code, colorClass: 'text-blue-700', bgClass: 'bg-blue-50 border-blue-100' },
  dsa: { name: 'DSA Coach', icon: GitFork, colorClass: 'text-indigo-700', bgClass: 'bg-indigo-50 border-indigo-100' },
  research: { name: 'Research Analyst', icon: Search, colorClass: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-100' },
  career: { name: 'Career Advisor', icon: Briefcase, colorClass: 'text-violet-700', bgClass: 'bg-violet-50 border-violet-100' },
  datascience: { name: 'Data Scientist', icon: BarChart3, colorClass: 'text-cyan-700', bgClass: 'bg-cyan-50 border-cyan-100' },
  document: { name: 'Document Assistant', icon: FileText, colorClass: 'text-rose-700', bgClass: 'bg-rose-50 border-rose-100' },
};

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useQuery<UserAnalytics>({
    queryKey: ['user-analytics'],
    queryFn: () => chatApi.getAnalytics(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full justify-center items-center bg-[#fcfbf9] text-slate-800">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-650 text-xs mt-2 font-medium">Compiling Workspace Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f9f9f8] p-8">
        <div className="max-w-4xl mx-auto w-full text-center space-y-4 py-20">
          <p className="text-red-650 text-xs font-semibold">Failed to Load Analytics</p>
          <p className="text-slate-650 text-[11px]">There was an error communicating with the intelligence service.</p>
          <Link href="/chat" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 border border-slate-300 rounded-[6px] px-3.5 py-1.5 bg-white hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Chat
          </Link>
        </div>
      </div>
    );
  }

  const maxMessages = Math.max(...analytics.roles_breakdown.map(r => r.messages_count), 1);
  const maxWeeklyMessages = Math.max(...analytics.weekly_activity.map(w => w.count), 1);

  const formatDateLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f8] overflow-y-auto">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] bg-white sticky top-0 z-10 shrink-0">
        <div className="max-w-4xl mx-auto w-full px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-900" />
              Workspace Intelligence & Analytics
            </h1>
            <p className="text-[10px] text-slate-800 mt-0.5 font-medium pl-6">
              Real-time usage metrics and cognitive engagement analysis.
            </p>
          </div>
          <Link
            href="/chat"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-955 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] px-3 py-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Chat
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-8 space-y-6">
        {/* Metric Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-[8px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-slate-800">Total Interactions</span>
                <MessageSquare className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-semibold text-slate-950 mt-2">{analytics.total_messages}</p>
            </div>
            <p className="text-[9px] text-slate-700 font-medium mt-1">Across all workspaces & session groups</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[8px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-slate-800">Estimated Tokens</span>
                <Cpu className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-semibold text-slate-950 mt-2">{analytics.total_tokens.toLocaleString()}</p>
            </div>
            <p className="text-[9px] text-slate-700 font-medium mt-1">Total model tokens processed</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[8px] p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-slate-800">Knowledge Base</span>
                <FileText className="w-4 h-4 text-slate-700" />
              </div>
              <p className="text-2xl font-semibold text-slate-950 mt-2">{analytics.total_documents}</p>
            </div>
            <p className="text-[9px] text-slate-700 font-medium mt-1">Files attached to RAG contexts</p>
          </div>
        </div>

        {/* Intelligence Summary Dotted Border Card */}
        <div className="bg-white border border-dashed border-slate-400 rounded-[8px] p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-800" />
            Intelligence Summary & Recommendations
          </h2>
          <div className="text-[11px] text-slate-800 leading-relaxed space-y-3 font-medium">
            <p>
              Your most frequent interactions utilize the <strong className="text-slate-950">
                {analytics.roles_breakdown[0]?.role ? (ROLE_DETAILS[analytics.roles_breakdown[0].role]?.name || analytics.roles_breakdown[0].role) : 'General Assistant'}
              </strong> role. To optimize results, ensure relevant documents are attached to a specific workspace to enrich the RAG knowledge layer context.
            </p>
            <p>
              By structuring your prompts using dedicated roles (e.g. DSA Coach or Coding Assistant), the system configures targeted context rules that lead to higher-quality responses while conserving token usage.
            </p>
          </div>
        </div>

        {/* Weekly Engagement Chart */}
        <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-6">
          <h2 className="text-xs font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-slate-850" />
            Weekly Engagement Timeline
          </h2>
          
          {analytics.weekly_activity.length === 0 ? (
            <p className="text-center text-[10px] text-slate-700 py-6 font-medium">No activity registered this week.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end justify-between h-36 pt-4 px-2 select-none">
                {analytics.weekly_activity.map((day, idx) => {
                  const percent = (day.count / maxWeeklyMessages) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group relative">
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-semibold rounded px-2 py-1 shadow pointer-events-none whitespace-nowrap z-20">
                        {day.count} {day.count === 1 ? 'Message' : 'Messages'}
                      </div>
                      
                      <div className="w-8 sm:w-10 bg-slate-100 rounded-t-sm relative h-full flex items-end">
                        <div 
                          className="w-full bg-slate-900 rounded-t-sm hover:bg-slate-950 transition-all cursor-pointer"
                          style={{ height: `${Math.max(percent, 5)}%` }}
                        />
                      </div>
                      
                      <span className="text-[9px] text-slate-800 font-semibold mt-2 text-center w-full truncate">
                        {formatDateLabel(day.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cognitive Role Breakdown */}
        <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-6">
          <h2 className="text-xs font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Brain className="w-4 h-4 text-slate-850" />
            Cognitive Role Breakdown
          </h2>

          {analytics.roles_breakdown.length === 0 ? (
            <p className="text-center text-[10px] text-slate-700 py-6 font-medium">No role activity data compiled yet.</p>
          ) : (
            <div className="space-y-5">
              {analytics.roles_breakdown.map((roleUsage) => {
                const roleKey = roleUsage.role || 'general';
                const meta = ROLE_DETAILS[roleKey] || {
                  name: roleKey.charAt(0).toUpperCase() + roleKey.slice(1),
                  icon: MessageSquare,
                  colorClass: 'text-slate-800',
                  bgClass: 'bg-slate-50 border-slate-200'
                };
                const Icon = meta.icon;
                const progressPercent = (roleUsage.messages_count / maxMessages) * 100;
                
                return (
                  <div key={roleUsage.role} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border border-slate-150 rounded-[6px] hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 w-48 shrink-0">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${meta.bgClass}`}>
                        <Icon className={`w-4 h-4 ${meta.colorClass}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-semibold text-slate-900 truncate capitalize">{meta.name}</p>
                        <p className="text-[9px] text-slate-700 font-medium truncate font-mono">
                          {roleUsage.sessions_count} {roleUsage.sessions_count === 1 ? 'session' : 'sessions'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-800">
                        <span>Messages: {roleUsage.messages_count}</span>
                        <span>{roleUsage.tokens_used.toLocaleString()} tokens</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                          className="bg-slate-900 h-full rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-32 text-right shrink-0">
                      <p className="text-[9px] font-semibold text-slate-850">Last Active</p>
                      <p className="text-[9px] text-slate-700 font-medium mt-0.5">
                        {roleUsage.last_used_at 
                          ? new Date(roleUsage.last_used_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
