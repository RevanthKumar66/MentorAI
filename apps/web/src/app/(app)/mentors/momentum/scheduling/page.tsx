'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { goalService } from '@/features/lifesaver/services/GoalService';
import { taskService } from '@/features/lifesaver/services/TaskService';
import { calendarIntegrationService } from '@/features/lifesaver/services/CalendarIntegrationService';
import { availabilityEngineService } from '@/features/lifesaver/services/AvailabilityEngineService';
import { CalendarConnectionCard } from '@/features/lifesaver/components/CalendarConnectionCard';
import { UpcomingEventsCard } from '@/features/lifesaver/components/UpcomingEventsCard';
import { FocusWindowCard } from '@/features/lifesaver/components/FocusWindowCard';
import { ConflictCard } from '@/features/lifesaver/components/ConflictCard';
import { ScheduleSuggestionCard } from '@/features/lifesaver/components/ScheduleSuggestionCard';
import { RecoveryScheduleCard } from '@/features/lifesaver/components/RecoveryScheduleCard';
import { AvailabilityTimeline } from '@/features/lifesaver/components/AvailabilityTimeline';
import { CalendarConnection, CalendarEvent, SchedulingAnalysisResponse } from '@/features/lifesaver/types/scheduling';
import { 
  Zap, Calendar, Cpu, Mic, Send, RefreshCw, AlertCircle, 
  HelpCircle, CheckCircle2, ChevronRight, AlertTriangle 
} from 'lucide-react';

export default function SmartSchedulingPage() {
  const [connection, setConnection] = useState<CalendarConnection | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [analysisData, setAnalysisData] = useState<SchedulingAnalysisResponse | null>(null);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Voice Assistant state
  const [voicePrompt, setVoicePrompt] = useState('');
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState<any>(null);

  // React Query for goals and tasks to keep timeline updated
  const { data: goals = [], refetch: refetchGoals } = useQuery({
    queryKey: ['lifesaver-goals'],
    queryFn: () => goalService.getGoals(),
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['lifesaver-tasks'],
    queryFn: () => taskService.getTasks(),
  });

  // Fetch connection and events
  const loadConnectionAndEvents = async () => {
    setLoadingConnection(true);
    try {
      // Check if we just returned from a Google OAuth flow with new provider tokens
      const { data: { session } } = await supabase.auth.getSession();
      const providerToken = session?.provider_token;
      const providerRefreshToken = session?.provider_refresh_token;
      const pendingEmail = sessionStorage.getItem('pending_calendar_email');

      if (providerToken && pendingEmail) {
        sessionStorage.removeItem('pending_calendar_email');
        try {
          await calendarIntegrationService.connect(
            pendingEmail,
            providerToken,
            providerRefreshToken || undefined
          );
        } catch (connErr) {
          console.error('Failed to auto-save calendar connection on OAuth redirect:', connErr);
        }
      }

      const conn = await calendarIntegrationService.fetchConnection();
      setConnection(conn && conn.id ? conn : null);
      if (conn && conn.id) {
        const evs = await calendarIntegrationService.getEvents();
        setEvents(evs);
      } else {
        setEvents([]);
        setAnalysisData(null);
      }
    } catch (err) {
      console.error('Error loading connection details:', err);
    } finally {
      setLoadingConnection(false);
    }
  };

  // Run AI schedule analysis
  const handleRunAnalysis = async () => {
    if (!connection) return;
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const result = await availabilityEngineService.runScheduleAnalysis();
      setAnalysisData(result);
      refetchTasks();
      refetchGoals();
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to compute schedule analysis');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Trigger voice assistant command
  const handleVoiceCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voicePrompt.trim()) return;
    setIsVoiceLoading(true);
    setVoiceResult(null);
    try {
      const res = await availabilityEngineService.triggerVoiceCommand(voicePrompt);
      setVoiceResult(res);
      setVoicePrompt('');
      
      // Reload everything
      await loadConnectionAndEvents();
      if (connection) {
        await handleRunAnalysis();
      }
    } catch (err) {
      console.error('Voice Assistant error:', err);
    } finally {
      setIsVoiceLoading(false);
    }
  };

  // Load connection on mount
  useEffect(() => {
    loadConnectionAndEvents();
  }, []);

  // Run analysis automatically when calendar is connected
  useEffect(() => {
    if (connection) {
      handleRunAnalysis();
    }
  }, [connection]);

  const handleUpdate = () => {
    loadConnectionAndEvents();
  };

  const handleResolveConflict = () => {
    handleRunAnalysis();
  };

  const handleUpdateSuggestions = () => {
    handleRunAnalysis();
  };

  if (loadingConnection) {
    return (
      <div className="flex h-[350px] w-full justify-center items-center text-slate-800 bg-[#fcfbf9]">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs font-medium">Checking calendar connection status...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full px-14 py-6 space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-slate-900 border border-slate-900 flex items-center justify-center text-white shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950 tracking-tight">Smart Scheduling</h2>
            <p className="text-[10.5px] text-slate-500 font-medium">
              Leverage calendar availability intelligence to align, prioritize, and optimize your preparation timeline.
            </p>
          </div>
        </div>
        
        {connection && (
          <button
            onClick={handleRunAnalysis}
            disabled={loadingAnalysis}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-750 font-bold text-xs transition-all cursor-pointer disabled:opacity-55 self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalysis ? 'animate-spin' : ''}`} />
            {loadingAnalysis ? 'Analyzing...' : 'Re-Run Analysis'}
          </button>
        )}
      </div>

      {/* Voice Assistant / Command bar */}
      <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Cpu className="w-4 h-4 text-slate-500" />
          Voice & Scheduling Assistant
        </h3>
        
        <form onSubmit={handleVoiceCommand} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={voicePrompt}
              onChange={(e) => setVoicePrompt(e.target.value)}
              placeholder='e.g., "Prepare me for Amazon Interview next week" or "Schedule 2 hours of SQL practice tomorrow"'
              disabled={isVoiceLoading}
              className="w-full bg-slate-50/50 border border-slate-250 rounded-[8px] py-2 px-3 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-slate-450 hover:text-slate-900 transition-colors"
              title="Voice Input (Simulated)"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={isVoiceLoading || !voicePrompt.trim()}
            className="px-4 py-2 bg-slate-950 text-white rounded-[8px] text-xs font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isVoiceLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Send
          </button>
        </form>

        {voiceResult && (
          <div className="bg-indigo-50/15 border border-indigo-200 rounded-[8px] p-4 space-y-3.5 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              AI Assistant Action Completed!
            </div>
            
            <p className="text-[10.5px] text-slate-700 leading-relaxed font-medium">
              {voiceResult.coachingMessage}
            </p>

            <div className="flex flex-wrap gap-2 text-[9.5px]">
              {voiceResult.goal && (
                <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded font-semibold">
                  New Goal: {voiceResult.goal.title}
                </span>
              )}
              {voiceResult.tasks && voiceResult.tasks.length > 0 && (
                <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded font-semibold">
                  Created {voiceResult.tasks.length} Tasks
                </span>
              )}
              {voiceResult.events && voiceResult.events.length > 0 && (
                <span className="px-2 py-0.5 bg-white border border-slate-200 text-indigo-700 border-indigo-200 rounded font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Scheduled {voiceResult.events.length} Calendar Slots
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {!connection ? (
        /* Empty Calendar State */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-50/40 border border-dashed border-slate-350 rounded-[12px] p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Calendar className="w-12 h-12 text-slate-300" />
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-xs font-bold text-slate-900">Connect Google Calendar to Unlock Timeline Intelligence</h3>
              <p className="text-[10.5px] text-slate-650 leading-relaxed">
                Connect your account to view your availability, detect task deadline conflicts, schedule preparation focus slots, and receive context-aware reminders.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Full availability scanning</span>
              <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Conflict resolutions</span>
            </div>
          </div>
          <div>
            <CalendarConnectionCard connection={connection} onUpdate={handleUpdate} />
          </div>
        </div>
      ) : (
        /* Syncing & Loading analysis state */
        <div className="space-y-6">
          {/* Analysis Error */}
          {analysisError && (
            <div className="bg-rose-50 border border-rose-250 text-rose-800 text-xs px-4 py-2.5 rounded-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          {loadingAnalysis ? (
            <div className="bg-white border border-slate-200 rounded-[12px] p-10 flex flex-col items-center justify-center text-center gap-3">
              <RefreshCw className="w-6 h-6 text-slate-800 animate-spin" />
              <div className="space-y-1 mt-2">
                <h4 className="text-xs font-bold text-slate-900">Analyzing...</h4>
                <p className="text-[10.5px] text-slate-500">Scanning calendar and tasks...</p>
              </div>
            </div>
          ) : (
            analysisData && (
              <div className="space-y-6">
                
                {/* Personalised Context Reminders */}
                {analysisData.reminders && analysisData.reminders.length > 0 && (
                  <div className="bg-indigo-50/20 border border-indigo-150 rounded-[12px] p-5 space-y-3 shadow-xs">
                    <h4 className="text-[10.5px] font-bold text-indigo-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <Zap className="w-4 h-4 text-indigo-600 animate-pulse" />
                      Context-Aware Reminders
                    </h4>
                    <ul className="space-y-2 text-[11px] text-slate-700 font-medium">
                      {analysisData.reminders.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-[6px] border border-indigo-100/50 shadow-xs">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Main Dashboard Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Connections, Suggestions, Timeline, Conflicts */}
                  <div className="md:col-span-2 space-y-6">
                    <CalendarConnectionCard connection={connection} onUpdate={handleUpdate} />
                    <ScheduleSuggestionCard suggestions={analysisData.suggestions} onUpdate={handleUpdateSuggestions} />
                    <AvailabilityTimeline 
                      events={events} 
                      tasks={tasks} 
                      availability={analysisData.availability} 
                    />
                    <ConflictCard conflicts={analysisData.conflicts} onResolve={handleResolveConflict} />
                  </div>

                  {/* Right Column: Focus Blocks, Recovery, & Upcoming events */}
                  <div className="space-y-6">
                    <FocusWindowCard blocks={analysisData.availability} />
                    <RecoveryScheduleCard plan={analysisData.recoveryPlan} />
                    <UpcomingEventsCard events={events} />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}
export const dynamic = 'force-dynamic';
