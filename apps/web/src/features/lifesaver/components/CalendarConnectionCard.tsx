import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarConnection } from '../types/scheduling';
import { calendarIntegrationService } from '../services/CalendarIntegrationService';
import { Zap, Calendar, Key, AlertCircle, RefreshCw, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  connection: CalendarConnection | null;
  onUpdate: () => void;
}

export function CalendarConnectionCard({ connection, onUpdate }: Props) {
  const [emailInput, setEmailInput] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid Google email address');
      return;
    }
    setError(null);
    setShowConsent(true);
  };

  const handleAuthorize = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Store targeted connection email in session storage to associate it after OAuth redirect
      sessionStorage.setItem('pending_calendar_email', emailInput);
      
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          redirectTo: window.location.origin + '/lifesaver/scheduling'
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Failed to connect calendar');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await calendarIntegrationService.disconnect();
      setEmailInput('');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect calendar');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await calendarIntegrationService.sync();
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to sync calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          Google Calendar Integration
        </h3>
        {connection && connection.id ? (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-[6px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Connected
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 border border-slate-250 text-slate-600 rounded-[6px]">
            Disconnected
          </span>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-250 text-rose-800 text-[11px] px-3.5 py-2 rounded-[8px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!connection ? (
        !showConsent ? (
          <form onSubmit={handleStartConnect} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-800">Sign in with Google</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="flex-1 bg-white border border-slate-250 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-950 text-white rounded-[6px] text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                >
                  Connect
                </button>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-normal">
              Syncs deadlines, retrieves meetings, detects availability windows, and manages task slots.
            </p>
          </form>
        ) : (
          <div className="bg-slate-55/40 border border-slate-200 rounded-[8px] p-4 space-y-4 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Google OAuth Permissions Consent</h4>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                  Momentum AI requires access to your Google account with the following scopes:
                </p>
              </div>
            </div>

            <div className="pl-6 space-y-1.5 border-l-2 border-slate-300">
              <div className="text-[10.5px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>calendar.readonly <span className="font-normal text-slate-500">(View calendar metadata)</span></span>
              </div>
              <div className="text-[10.5px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>calendar.events <span className="font-normal text-slate-500">(Modify events & appointments)</span></span>
              </div>
              <div className="text-[10.5px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>calendar.events.readonly <span className="font-normal text-slate-500">(Read agenda meetings)</span></span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConsent(false)}
                className="px-3.5 py-1.5 border border-slate-250 bg-white hover:bg-slate-55 rounded-[6px] text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorize}
                disabled={isConnecting}
                className="px-3.5 py-1.5 bg-slate-950 text-white hover:bg-black rounded-[6px] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Grant & Authorize
                  </>
                )}
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50/50 border border-slate-200 rounded-[8px] p-3.5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Connected Account</span>
              <span className="font-semibold text-slate-900 font-mono">{connection.email}</span>
            </div>
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-500">Last Sync Time</span>
              <span className="text-slate-700 font-medium">
                {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-850 rounded-[8px] text-xs font-semibold transition-all cursor-pointer disabled:opacity-55"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-650 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Calendar'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-700 rounded-[8px] text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
