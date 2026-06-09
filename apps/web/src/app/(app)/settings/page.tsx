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

  // Preferences Form states
  const [defaultRole, setDefaultRole] = useState('general');
  const [defaultPersona, setDefaultPersona] = useState('teacher');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [learningStyle, setLearningStyle] = useState('mixed');
  const [careerGoal, setCareerGoal] = useState('fullstack');
  const [preferredLanguage, setPreferredLanguage] = useState('english');

  // Fetch preferences
  const { data: prefData, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'GET',
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const body = await res.json();
      return body.data;
    }
  });

  // Sync preferences with form state when loaded
  useEffect(() => {
    if (prefData) {
      setDefaultRole(prefData.default_role || 'general');
      setDefaultPersona(prefData.default_persona || 'teacher');
      setExperienceLevel(prefData.experience_level || 'beginner');
      setLearningStyle(prefData.learning_style || 'mixed');
      setCareerGoal(prefData.career_goal || 'fullstack');
      setPreferredLanguage(prefData.preferred_language || 'english');
    }
  }, [prefData]);

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      const body = await res.json();
      return body.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      default_role: defaultRole,
      default_persona: defaultPersona,
      experience_level: experienceLevel,
      learning_style: learningStyle,
      career_goal: careerGoal,
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
        <div className="max-w-4xl mx-auto w-full px-8 py-4">
          <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-800" />
            AI Preferences & Settings
          </h1>
          <p className="text-[10px] text-slate-700 mt-0.5 font-medium pl-6">
            Configure default intelligence layers, persona tone, and personalized workspace parameters.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-8 space-y-6">
        
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
          
          {/* Card: Intelligence Layer */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Star className="w-4 h-4 text-slate-800" />
              Default AI Intelligence Layers
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Default Mentor Role</label>
                <select
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="general">General Assistant (Balanced)</option>
                  <option value="learning">Structured Learning Mentor (Detailed Syllabus/Roadmaps)</option>
                  <option value="coding">Coding Assistant (Clean Code / Explanations)</option>
                  <option value="dsa">DSA Coach (Algorithmic Guidance / Big O Analysis)</option>
                  <option value="research">Research Assistant (Academic Synthesis / Comparisons)</option>
                  <option value="career">Career Coach (STAR Method Resume / Interview Prep)</option>
                  <option value="datascience">Data Science Copilot (Pandas / Stats / ML)</option>
                  <option value="document">Document Assistant (Context-anchored RAG)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Default Persona Tone</label>
                <select
                  value={defaultPersona}
                  onChange={(e) => setDefaultPersona(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="teacher">Patient Teacher 👩‍🏫</option>
                  <option value="senior_engineer">Senior Engineer 💻</option>
                  <option value="research_scientist">Research Scientist 🔬</option>
                  <option value="interview_coach">Interview Coach ⏱️</option>
                  <option value="career_mentor">Career Mentor 👔</option>
                  <option value="data_scientist">Data Scientist 📊</option>
                  <option value="startup_founder">Startup Founder 🚀</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Experience & Learning Style */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-slate-800" />
              Personalized Learning Configurations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="beginner">Beginner (Concept explanations first)</option>
                  <option value="intermediate">Intermediate (Balance of concept & implementation)</option>
                  <option value="advanced">Advanced (Deep dive implementation, concise trade-offs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Preferred Learning Style</label>
                <select
                  value={learningStyle}
                  onChange={(e) => setLearningStyle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="mixed">Mixed (General balance)</option>
                  <option value="practical">Practical / Hands-on (Code exercises & dry runs)</option>
                  <option value="theoretical">Theoretical / Conceptual (Deep academic background)</option>
                  <option value="visual">Visual (Analogies & diagrams emphasis)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-850 mb-1">Career Goal / Study Focus</label>
              <textarea
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                placeholder="e.g. Master Full Stack Web Development or prepare for DSA interview..."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Card: Localization */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Palette className="w-4 h-4 text-slate-800" />
              Localization
            </h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-850 mb-1">Default AI Response Language</label>
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

          {/* Save Action */}
          <div className="flex items-center justify-between gap-4">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Preferences saved successfully!
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
