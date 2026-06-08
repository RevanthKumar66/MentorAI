'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Settings, Save, Check, Shield, Palette, Star, ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [preferredRole, setPreferredRole] = useState('general');
  const [theme, setTheme] = useState('light');
  const [responseLength, setResponseLength] = useState('medium');
  const [learningGoal, setLearningGoal] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('english');

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const body = await res.json();
      return body.data;
    }
  });

  // Sync with form state when loaded
  useEffect(() => {
    if (settingsData) {
      setPreferredRole(settingsData.preferred_role || 'general');
      setTheme(settingsData.theme || 'light');
      setResponseLength(settingsData.response_length || 'medium');
      setLearningGoal(settingsData.learning_goal || '');
      setPreferredLanguage(settingsData.preferred_language || 'english');
    }
  }, [settingsData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      const body = await res.json();
      return body.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      preferred_role: preferredRole,
      theme,
      response_length: responseLength,
      learning_goal: learningGoal,
      preferred_language: preferredLanguage
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full justify-center items-center bg-[#fcfbf9] text-slate-800">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs mt-2 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f8] overflow-y-auto">
      <header className="border-b border-[#e5e5e5] bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto w-full px-8 py-4">
          <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-800" />
            Workspace Settings
          </h1>
          <p className="text-[10px] text-slate-700 mt-0.5 font-medium pl-6">
            Customize AI preferences, visual theme, responses, and learning goals.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-8 space-y-6">
        
        {/* Back navigation */}
        <div className="flex justify-start">
          <Link
            href="/chat"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Chat
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card: AI Preferences */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Star className="w-4 h-4 text-slate-800" />
              AI Assistant Preferences
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Preferred System Role</label>
                <select
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="general">General Assistant (Balanced)</option>
                  <option value="learning">Structured Learning Mentor (Detailed Syllabus/Roadmaps)</option>
                  <option value="coding">Coding Assistant (Clean Code / Explanations)</option>
                  <option value="dsa">DSA Coach (Algorithmic Guidance / Big O Analysis)</option>
                  <option value="research">Research Assistant (Academic Synthesis / Comparisons)</option>
                  <option value="career">Career Coach (STAR Method Resume / Interview Prep)</option>
                  <option value="data_science">Data Science Copilot (Pandas / Stats / ML)</option>
                </select>
                <p className="text-[9px] text-slate-700 mt-1 font-medium">This role sets the default tutoring template when creating new chats.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Response Length</label>
                <div className="grid grid-cols-3 gap-3">
                  {['short', 'medium', 'long'].map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setResponseLength(len)}
                      className={`py-2 px-3 border rounded-[6px] text-xs font-bold capitalize transition-colors cursor-pointer ${
                        responseLength === len
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-[#ecebea]/55'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Learning Goal */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-slate-800" />
              Focus & Custom Instruction
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-850 mb-1">Primary Learning Goal</label>
              <textarea
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder="e.g. Master Full Stack Web Development or prepare for DSA interview at Google..."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors resize-none leading-relaxed"
              />
              <p className="text-[9px] text-slate-700 mt-1 font-medium font-sans">This helps MentorAI tailor analogies and roadmaps to your specific learning path.</p>
            </div>
          </div>

          {/* Card: Appearance & Interface */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Palette className="w-4 h-4 text-slate-800" />
              Visual & Localization
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Color Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="light">Retro Paper (Light Mode)</option>
                  <option value="dark">Sleek Obsidian (Dark Mode - Coming Soon)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Interface Language</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="english">English (US)</option>
                  <option value="spanish">Español</option>
                  <option value="french">Français</option>
                  <option value="german">Deutsch</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between gap-4">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Settings saved successfully!
              </span>
            ) : (
              <span className="text-[10px] text-slate-700 font-medium">Click Save Changes to commit configurations.</span>
            )}
            
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-6 py-2 rounded-[6px] bg-slate-900 hover:bg-black text-xs text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
