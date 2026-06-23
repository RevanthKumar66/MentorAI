'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { User, Save, Check, UserCheck, Briefcase, GraduationCap, Code2, LineChart, Search, Edit2, X, ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
  settings?: Record<string, unknown>;
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
  bio?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
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

interface EditModalProps {
  dbUser: DBUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: UpdateProfilePayload) => void;
  isPending: boolean;
}

function EditProfileModal({ dbUser, onClose, onSave, isPending }: EditModalProps) {
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
      <div 
        className="w-full max-w-md bg-white border border-slate-350 rounded-[12px] p-6 shadow-xl relative animate-scale-in mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Edit Profile Info</h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-850 transition-colors cursor-pointer border-none bg-transparent"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-850 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-850 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-850 mb-1">Mobile Number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. +1 555-0100"
                className="flex-1 bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors"
              />
              <button
                type="button"
                onClick={() => setEditPhoneVerified(prev => !prev)}
                className={`px-3 py-1.5 rounded-[6px] border text-[10.5px] font-bold transition-all select-none cursor-pointer ${
                  editPhoneVerified
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-[#f4f3f0] border-slate-300 text-slate-800 hover:bg-[#ecebea]'
                }`}
              >
                {editPhoneVerified ? 'Verified' : 'Verify'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-850 mb-1">Profile Picture URL</label>
            <input
              type="url"
              value={editAvatarUrl}
              onChange={(e) => setEditAvatarUrl(e.target.value)}
              placeholder="e.g. https://avatar.vercel.sh/john"
              className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[6px] border border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-900 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-[6px] bg-slate-900 hover:bg-black text-xs text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileForm({ dbUser }: { dbUser: DBUser }) {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Form states initialized directly from dbUser without useEffect syncs
  const [bio, setBio] = useState(dbUser.profile?.bio || '');
  const [occupation, setOccupation] = useState(dbUser.profile?.preferences?.occupation || 'student');
  const [focusArea, setFocusArea] = useState(dbUser.profile?.learning_goals?.focus || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(dbUser.profile?.preferences?.interests || []);

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
      
      // Sync global auth store so other header/sidebar components reflect updates immediately
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

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      bio,
      preferences: {
        occupation,
        interests: selectedInterests
      },
      learning_goals: {
        focus: focusArea
      }
    });
  };

  const occupations = [
    { value: 'student', label: 'Student / Learner', icon: GraduationCap },
    { value: 'developer', label: 'Software Developer', icon: Code2 },
    { value: 'engineer', label: 'AI/ML Engineer', icon: Briefcase },
    { value: 'data_scientist', label: 'Data Scientist', icon: LineChart },
    { value: 'job_seeker', label: 'Job Seeker', icon: Search }
  ];

  const interestOptions = [
    'Algorithms & DSA',
    'Machine Learning',
    'Frontend Development',
    'Backend Development',
    'System Design',
    'Data Science & Analytics',
    'DevOps & Cloud',
    'Mobile Development'
  ];

  const initials = dbUser.email
    ? dbUser.email.slice(0, 2).toUpperCase()
    : 'U';

  const handleEditModalSave = (payload: UpdateProfilePayload) => {
    updateMutation.mutate(payload);
    setEditModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f8] overflow-y-auto">
      <header className="border-b border-[#e5e5e5] bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto w-full px-8 py-4">
          <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-800" />
            Profile Preferences
          </h1>
          <p className="text-[10px] text-slate-700 mt-0.5 font-medium pl-6">
            Customize your profile preferences and learning goals.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-8 space-y-6">
        
        <div className="flex justify-start">
          <Link
            href="/chat"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Chat
          </Link>
        </div>

        {/* User Badge Top Card */}
        <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-950 text-white flex items-center justify-center text-lg font-extrabold select-none overflow-hidden shrink-0 border border-slate-300">
              {dbUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dbUser.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{dbUser.full_name || dbUser.email.split('@')[0] || 'User'}</h2>
              <p className="text-xs text-slate-700 font-mono mt-0.5">{dbUser.email}</p>
              {dbUser.profile?.preferences?.phone && (
                <p className="text-[11px] text-slate-700 font-medium mt-1 flex items-center gap-1.5">
                  <span className="font-mono">{dbUser.profile.preferences.phone}</span>
                  {dbUser.profile.preferences.phone_verified ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-[4px]">Verified</span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 border border-amber-300 text-amber-600 rounded-[4px]">Unverified</span>
                  )}
                </p>
              )}
              <span className="inline-block px-2 py-0.5 rounded-[4px] bg-[#f4f3f0] border border-slate-300 text-[9px] font-bold text-slate-850 mt-2 capitalize">
                Role: {occupation.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs transition-colors cursor-pointer select-none"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-700" />
            Edit
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card: Occupation Selection */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-4 h-4 text-slate-800" />
              Primary Occupation & Perspective
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {occupations.map((occ) => {
                const OccIcon = occ.icon;
                const isSelected = occupation === occ.value;
                return (
                  <button
                    key={occ.value}
                    type="button"
                    onClick={() => setOccupation(occ.value)}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-[6px] text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white font-bold'
                        : 'bg-white border-slate-250 text-slate-850 hover:bg-[#ecebea]/55'
                    }`}
                  >
                    <OccIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-700'}`} />
                    <span className="text-xs">{occ.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Bio and Technical Focus */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-4 h-4 text-slate-800" />
              About Me & Goals
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Short Biography</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Introduce yourself, your coding background, or academic interests..."
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-850 mb-1">Active Technical Focus</label>
                <input
                  type="text"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  placeholder="e.g. PyTorch and ML pipelines, React with Next.js..."
                  className="w-full bg-white border border-slate-300 rounded-[6px] py-1.5 px-3 text-xs text-slate-900 placeholder-slate-600 focus:outline-none focus:border-slate-800 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card: Topics of Interest Checkboxes */}
          <div className="bg-white border border-slate-250 rounded-[8px] p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Code2 className="w-4 h-4 text-slate-800" />
              Technical Interests
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {interestOptions.map((interest) => {
                const isChecked = selectedInterests.includes(interest);
                return (
                  <label
                    key={interest}
                    className="flex items-center gap-2.5 p-2 rounded-[6px] border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleInterestToggle(interest)}
                      className="w-3.5 h-3.5 text-slate-900 border-slate-300 focus:ring-slate-900 rounded"
                    />
                    <span className="text-xs text-slate-850 font-medium">{interest}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between gap-4">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Profile preferences updated!
              </span>
            ) : (
              <span className="text-[10px] text-slate-700 font-medium font-sans">Provide your preferences to tailor system responses.</span>
            )}
            
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-6 py-2 rounded-[6px] bg-slate-900 hover:bg-black text-xs text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </form>
      </main>

      {/* Edit Profile Modal popup card */}
      {editModalOpen && (
        <EditProfileModal 
          dbUser={dbUser}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleEditModalSave}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  // Fetch full DB User details including profile
  const { data: dbUser, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-full justify-center items-center bg-[#fcfbf9] text-slate-800">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs mt-2 font-medium">Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (!dbUser) return null;

  // Use updated_at timestamp as React key to reset component states dynamically on DB updates
  return <ProfileForm key={dbUser.updated_at || 'profile-form'} dbUser={dbUser} />;
}
