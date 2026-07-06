'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import {
  User, Save, Check, Shield, Palette, Star, ArrowLeft,
  Zap, Flag, CheckSquare, AlertTriangle, Cpu, Edit2, X, Sliders, LayoutDashboard, Sparkles
} from 'lucide-react';
import { goalService } from '@/features/lifesaver/services/GoalService';
import { taskService } from '@/features/lifesaver/services/TaskService';
import { riskPredictionService } from '@/features/lifesaver/services/RiskPredictionService';
import { getApiBaseUrl } from '@/lib/api-config';

const API_BASE_URL = getApiBaseUrl();

async function getHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

interface ProfileData {
  bio?: string;
  preferences?: {
    occupation?: string;
    interests?: string[];
    phone?: string;
    phone_verified?: boolean;
  };
  learning_goals?: {
    focus?: string;
  };
}

interface DBUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  profile?: ProfileData;
}

interface UpdateProfilePayload {
  full_name?: string;
  email?: string;
  avatar_url?: string;
  preferences?: {
    phone?: string;
    phone_verified?: boolean;
  };
}

interface EditModalProps {
  dbUser: DBUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: UpdateProfilePayload) => void;
  isPending: boolean;
}

function EditInfoModal({ dbUser, onClose, onSave, isPending }: EditModalProps) {
  const [editFullName, setEditFullName] = useState(dbUser.full_name || '');
  const [editEmail, setEditEmail] = useState(dbUser.email || '');
  const [editPhone, setEditPhone] = useState(dbUser.profile?.preferences?.phone || '');
  const [editPhoneVerified, setEditPhoneVerified] = useState(!!dbUser.profile?.preferences?.phone_verified);
  const [editAvatarUrl, setEditAvatarUrl] = useState(dbUser.avatar_url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      full_name: editFullName,
      email: editEmail,
      avatar_url: editAvatarUrl,
      preferences: {
        phone: editPhone,
        phone_verified: editPhoneVerified
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in mx-4">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-[12px] p-6 shadow-xl relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-500" />
            Edit Profile Info
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border-none bg-transparent"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="w-full bg-white border border-slate-250 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full bg-white border border-slate-250 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-1">Mobile Number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. +1 555-0100"
                className="flex-1 bg-white border border-slate-250 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
              />
              <button
                type="button"
                onClick={() => setEditPhoneVerified(prev => !prev)}
                className={`px-3 py-1.5 rounded-[6px] border text-[10px] font-semibold transition-all select-none cursor-pointer ${
                  editPhoneVerified
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-50 border-slate-250 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {editPhoneVerified ? 'Verified' : 'Verify'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-1">Profile Picture URL</label>
            <input
              type="url"
              value={editAvatarUrl}
              onChange={(e) => setEditAvatarUrl(e.target.value)}
              placeholder="e.g. https://avatar.vercel.sh/alex"
              className="w-full bg-white border border-slate-250 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[6px] border border-slate-250 bg-white hover:bg-slate-50 text-xs text-slate-800 font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-[6px] bg-slate-900 hover:bg-black text-xs text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MomentumAIProfilePage() {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Local storage persisted states for Momentum AI preferences
  const [focusTarget, setFocusTarget] = useState(80);
  const [riskSensitivity, setRiskSensitivity] = useState('Medium');
  const [coachTone, setCoachTone] = useState('Empathetic Mentor');
  const [autoReschedule, setAutoReschedule] = useState('Ask every time');

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedFocus = localStorage.getItem('momentum_focus_target');
    const savedRisk = localStorage.getItem('momentum_risk_sensitivity');
    const savedTone = localStorage.getItem('momentum_coach_tone');
    const savedReschedule = localStorage.getItem('momentum_auto_reschedule');

    if (savedFocus) setFocusTarget(Number(savedFocus));
    if (savedRisk) setRiskSensitivity(savedRisk);
    if (savedTone) setCoachTone(savedTone);
    if (savedReschedule) setAutoReschedule(savedReschedule);
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

  // Fetch Goals
  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['lifesaver-goals'],
    queryFn: () => goalService.getGoals(),
  });

  // Fetch Tasks
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['lifesaver-tasks'],
    queryFn: () => taskService.getTasks(),
  });

  // Fetch Risks
  const { data: risks = {} } = useQuery({
    queryKey: ['lifesaver-risks'],
    queryFn: () => riskPredictionService.loadGoalRisks(),
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active');
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

    // Calculate Focus Score: (completed high-priority tasks / total high-priority tasks) * 100
    const highTasks = tasks.filter(t => t.priority === 'high');
    const completedHigh = highTasks.filter(t => t.status === 'completed');
    const focusScore = highTasks.length > 0 
      ? Math.round((completedHigh.length / highTasks.length) * 100)
      : 50;

    // High risk goals count
    const activeGoalIds = activeGoals.map(g => g.id);
    const highRiskGoals = Object.values(risks).filter(
      r => activeGoalIds.includes(r.goal_id) && r.risk_score >= 70
    ).length;

    return {
      totalGoals,
      completedGoals,
      activeGoals: activeGoals.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      focusScore,
      highRiskGoals,
    };
  }, [goals, tasks, risks]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const body = await res.json();
      return body.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          user_metadata: {
            ...currentUser.user_metadata,
            full_name: data.full_name,
            avatar_url: data.avatar_url
          }
        });
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });

  const handleEditSave = (payload: UpdateProfilePayload) => {
    updateMutation.mutate(payload);
    setEditModalOpen(false);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('momentum_focus_target', String(focusTarget));
    localStorage.setItem('momentum_risk_sensitivity', riskSensitivity);
    localStorage.setItem('momentum_coach_tone', coachTone);
    localStorage.setItem('momentum_auto_reschedule', autoReschedule);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (isLoadingUser || loadingGoals || loadingTasks) {
    return (
      <div className="flex h-[350px] w-full justify-center items-center text-slate-800 bg-[#fcfbf9]">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs font-medium">Loading profile preferences...</p>
        </div>
      </div>
    );
  }

  if (!dbUser) return null;

  const initials = dbUser.full_name
    ? dbUser.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : dbUser.email?.slice(0, 2).toUpperCase() ?? 'U';

  const dateJoined = dbUser.created_at 
    ? new Date(dbUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <main className="w-full px-14 py-6 space-y-6 animate-fade-in">
      {/* Title & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950 tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-900" />
            Momentum AI Profile & Preferences
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium pl-6">
            Configure default intelligence layers, focus score thresholds, and dashboard metrics.
          </p>
        </div>
        <Link
          href="/mentors/momentum"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors self-start sm:self-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </Link>
      </div>

      {/* User Information Card */}
      <div className="bg-white border border-slate-200 rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-950 text-white flex items-center justify-center text-xl font-bold border border-slate-350 select-none overflow-hidden shrink-0">
            {dbUser.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dbUser.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950 leading-none">
              {dbUser.full_name || dbUser.email.split('@')[0] || 'Momentum Member'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">{dbUser.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center text-[10px] font-semibold text-slate-700 px-2 py-0.5 rounded-[4px] bg-slate-50 border border-slate-200 capitalize">
                Role: {dbUser.profile?.preferences?.occupation?.replace('_', ' ') || 'User'}
              </span>
              <span className="text-[10px] text-slate-400">Joined {dateJoined}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors cursor-pointer select-none self-start sm:self-center shrink-0"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
          Edit Details
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Focus Score */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-4 flex items-center gap-4">
          <span className={`p-2.5 rounded-[8px] flex items-center justify-center shrink-0 ${
            stats.focusScore >= 80 ? 'bg-emerald-55 text-emerald-700' :
            stats.focusScore >= 60 ? 'bg-amber-55 text-amber-700' : 'bg-rose-50 text-rose-700'
          }`}>
            <Sliders className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Focus Score</p>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">{stats.focusScore}%</h4>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-4 flex items-center gap-4">
          <span className="p-2.5 rounded-[8px] bg-slate-50 border border-slate-200/60 text-slate-600 flex items-center justify-center shrink-0">
            <Flag className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Goals</p>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              {stats.activeGoals} <span className="text-slate-400 text-xs font-normal">/ {stats.totalGoals} total</span>
            </h4>
          </div>
        </div>

        {/* Tasks Checklist */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-4 flex items-center gap-4">
          <span className="p-2.5 rounded-[8px] bg-slate-50 border border-slate-200/60 text-slate-600 flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</p>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">
              {stats.completedTasks} <span className="text-slate-400 text-xs font-normal">/ {stats.totalTasks} total</span>
            </h4>
          </div>
        </div>

        {/* Active Risk Alerts */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-4 flex items-center gap-4">
          <span className={`p-2.5 rounded-[8px] flex items-center justify-center shrink-0 ${
            stats.highRiskGoals > 0 ? 'bg-red-50 text-red-700 animate-pulse' : 'bg-slate-50 text-slate-600 border border-slate-200/60'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">High Risk Goals</p>
            <h4 className="text-base font-bold text-slate-900 mt-0.5">{stats.highRiskGoals} Alert{stats.highRiskGoals !== 1 ? 's' : ''}</h4>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSavePreferences} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: AI Agent Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Cpu className="w-4 h-4 text-slate-500" />
              Intelligence Layer Configs
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
              <p className="text-[10px] text-slate-500">Target compliance rate for high priority tasks. Keeps Focus AI assessments calibrated.</p>
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
                          ? 'bg-slate-950 border-slate-950 text-white'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">Adjusts the margin of safety when computing forecast delays and risk metrics.</p>
            </div>

            {/* Coach Tone */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-800">AI Coach Personality Tone</label>
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
              <p className="text-[10px] text-slate-500">Calibrates the voice of daily briefing summaries and Execution Agent alerts.</p>
            </div>

            {/* Auto-Reschedule suggestions policy */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-800">Execution Rescheduling Approvals</label>
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

            {/* Save Buttons & Confirmation Status */}
            <div className="flex items-center justify-between gap-4 pt-3.5 border-t border-slate-100">
              {saveSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Preferences updated successfully!
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium">Click save to apply preferences.</span>
              )}
              
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-[8px] bg-slate-950 hover:bg-black text-xs text-white font-semibold transition-all shadow-sm hover:shadow"
              >
                <Save className="w-3.5 h-3.5" />
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Environment Status / Help info */}
        <div className="space-y-6">
          {/* Environment Info */}
          <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-slate-500" />
              Connected Environment
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-[10.5px] font-semibold text-slate-650">Host Environment</span>
                <span className="text-[10.5px] font-bold text-slate-800">Localhost</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-[10.5px] font-semibold text-slate-650">Supabase Connection</span>
                <span className="text-[10.5px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
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
                <span className="text-[10.5px] font-semibold text-slate-650">AI Copilot Core</span>
                <span className="text-[10.5px] font-bold text-indigo-650 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Active (Gemini)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-slate-50/50 border border-slate-200/80 rounded-[12px] p-6 space-y-3.5">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-slate-700" />
              Environment Profiles
            </h4>
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              Momentum AI relies on strict calibration between your deadlines, focus target, and risk scores. Adjusting sensitivity directly scales prediction safety nets.
            </p>
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              Changes to Name, Email, and Avatar sync globally and immediately update your workspace header.
            </p>
          </div>
        </div>
      </form>

      {/* Edit modal */}
      {editModalOpen && (
        <EditInfoModal
          dbUser={dbUser}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleEditSave}
          isPending={updateMutation.isPending}
        />
      )}
    </main>
  );
}
