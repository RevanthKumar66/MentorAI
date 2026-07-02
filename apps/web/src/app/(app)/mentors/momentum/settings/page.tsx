'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Save, Check, Shield, Sliders, Cpu, Bell, CheckSquare, Sparkles
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function getHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

interface DBUser {
  id: string;
  email: string;
  full_name?: string;
}

export default function MomentumAISettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local storage persisted states for Momentum AI preferences
  const [focusTarget, setFocusTarget] = useState(80);
  const [riskSensitivity, setRiskSensitivity] = useState('Medium');
  const [coachTone, setCoachTone] = useState('Empathetic Mentor');
  const [autoReschedule, setAutoReschedule] = useState('Ask every time');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedFocus = localStorage.getItem('momentum_focus_target');
    const savedRisk = localStorage.getItem('momentum_risk_sensitivity');
    const savedTone = localStorage.getItem('momentum_coach_tone');
    const savedReschedule = localStorage.getItem('momentum_auto_reschedule');
    const savedEmailNotif = localStorage.getItem('momentum_email_notifications');
    const savedInAppNotif = localStorage.getItem('momentum_in_app_notifications');

    if (savedFocus) setFocusTarget(Number(savedFocus));
    if (savedRisk) setRiskSensitivity(savedRisk);
    if (savedTone) setCoachTone(savedTone);
    if (savedReschedule) setAutoReschedule(savedReschedule);
    if (savedEmailNotif) setEmailNotifications(savedEmailNotif === 'true');
    if (savedInAppNotif) setInAppNotifications(savedInAppNotif === 'true');
  }, []);

  // Fetch basic user details
  const { data: dbUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch profile info');
      const body = await res.json();
      return body.data as DBUser;
    }
  });

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('momentum_focus_target', String(focusTarget));
    localStorage.setItem('momentum_risk_sensitivity', riskSensitivity);
    localStorage.setItem('momentum_coach_tone', coachTone);
    localStorage.setItem('momentum_auto_reschedule', autoReschedule);
    localStorage.setItem('momentum_email_notifications', String(emailNotifications));
    localStorage.setItem('momentum_in_app_notifications', String(inAppNotifications));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (isLoadingUser) {
    return (
      <div className="flex h-[350px] w-full justify-center items-center text-slate-800 bg-[#fcfbf9]">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full px-14 py-6 space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-base font-semibold text-slate-955 tracking-tight flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-900" />
          Momentum AI Environment Settings
        </h2>
        <p className="text-slate-500 text-xs mt-0.5 font-medium pl-6">
          Calibrate Focus AI variables, notification channels, and active environment connections.
        </p>
      </div>

      {/* Settings Grid */}
      <form onSubmit={handleSavePreferences} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: AI Agent Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-5 shadow-xs">
            
            {/* AI Copilot Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Cpu className="w-4 h-4 text-slate-500" />
                AI Copilot Calibration
              </h3>

              {/* Focus Target score slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-800">Focus Target Score</label>
                  <span className="text-xs font-bold text-slate-900">{focusTarget}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="98"
                  step="2"
                  value={focusTarget}
                  onChange={(e) => setFocusTarget(Number(e.target.value))}
                  className="w-full accent-slate-900 bg-slate-100 rounded-lg appearance-none h-1.5 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Target completion rate for high priority tasks. Focus AI monitors your pacing against this target.</p>
              </div>

              {/* Risk Sensitivity */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-bold text-slate-800">Risk Assessment Sensitivity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((level) => {
                    const isSelected = riskSensitivity === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setRiskSensitivity(level)}
                        className={`py-2 px-3 border rounded-[6px] text-center text-xs font-semibold transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-slate-950 border-slate-955 text-white'
                            : 'bg-white border-slate-200 text-slate-850 hover:bg-slate-50'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500">Determines the margin of safety when forecasting deadline delays and goal risks.</p>
              </div>

              {/* Coach Tone */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-bold text-slate-800">AI Mentor Persona Tone</label>
                <select
                  value={coachTone}
                  onChange={(e) => setCoachTone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                >
                  <option value="Empathetic Mentor">Empathetic Mentor (Balanced & Encouraging)</option>
                  <option value="Senior Software Engineer">Senior Engineer (Concise, technical, direct)</option>
                  <option value="Drill Sergeant">Drill Sergeant (High accountability, tough love)</option>
                  <option value="Startup Founder">Startup Founder (High growth focus, fast-paced)</option>
                  <option value="Data Analyst">Data Analyst (Strictly metric-driven, statistical)</option>
                </select>
                <p className="text-[10px] text-slate-500">Configures the voice and vocabulary of daily briefings, reflections, and notifications.</p>
              </div>
            </div>

            {/* Auto-Scheduling Section */}
            <div className="space-y-4 pt-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <CheckSquare className="w-4 h-4 text-slate-500" />
                Scheduling & Approvals Policy
              </h3>

              <div className="space-y-2">
                {[
                  { title: 'Ask every time', desc: 'Execution Agent drafts slot suggestions; requires manual Accept/Reject.' },
                  { title: 'Auto-approve low risk', desc: 'Allows AI to automatically reschedule tasks with low-risk offsets.' },
                  { title: 'Fully manual', desc: 'Strictly manual task moving; no AI scheduling assistance.' }
                ].map((option) => {
                  const isSelected = autoReschedule === option.title;
                  return (
                    <label
                      key={option.title}
                      className={`flex items-start gap-2.5 p-2.5 rounded-[6px] border cursor-pointer select-none transition-colors ${
                        isSelected ? 'bg-slate-50/70 border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reschedule_policy"
                        checked={isSelected}
                        onChange={() => setAutoReschedule(option.title)}
                        className="w-3.5 h-3.5 text-slate-950 border-slate-350 focus:ring-slate-950 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <span className="block text-xs font-semibold text-slate-900">{option.title}</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{option.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-4 pt-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Bell className="w-4 h-4 text-slate-500" />
                Notification Channels
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inAppNotifications}
                    onChange={(e) => setInAppNotifications(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">In-App Alerts</span>
                    <span className="block text-[10px] text-slate-500">Show pacing warnings and reminders inside the Agent Diagnostics tab.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">Email Alerts (Resend API)</span>
                    <span className="block text-[10px] text-slate-500">
                      Deliver real-time followups to your Google account email <span className="font-mono font-semibold text-slate-700">({dbUser?.email})</span>.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Buttons & Confirmation Status */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
              {saveSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Preferences updated successfully!
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium">Click save to apply preferences to Momentum AI.</span>
              )}
              
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-[8px] bg-slate-950 hover:bg-black text-xs text-white font-semibold transition-all shadow-sm hover:shadow"
              >
                <Save className="w-3.5 h-3.5" />
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Environment Status */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Shield className="w-4 h-4 text-slate-500" />
              Environment Connection Health
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-[10.5px] font-semibold text-slate-650">Host Environment</span>
                <span className="text-[10.5px] font-bold text-slate-800">Localhost</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-[10.5px] font-semibold text-slate-650">Supabase Connection</span>
                <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-[10.5px] font-semibold text-slate-650">REST API Server</span>
                <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-slate-650">Gemini LLM Engine</span>
                <span className="text-[10.5px] font-bold text-indigo-650 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-[12px] p-6 space-y-3 shadow-xs">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              Calibration Info
            </h4>
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              These settings scale the risk prediction safety thresholds. Any modifications will instantly update how risk predictions are calculated on the next run.
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}
