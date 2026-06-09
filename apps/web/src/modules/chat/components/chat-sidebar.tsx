'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, Plus, Trash2, PanelLeftClose, PanelLeft, 
  FolderOpen, Settings, Search, MoreHorizontal, Edit2, Share2, Archive, FolderPlus, Copy, Folder, X, Check,
  ChevronDown, ChevronRight, GraduationCap, Code, GitFork, Briefcase, BarChart3, FileText, LucideIcon,
  BookOpen, HelpCircle, Compass, Users, Target, Terminal, Atom, ClipboardCheck, Rocket, Database, Sparkles
} from 'lucide-react';
import { ChatSession, useChatStore } from '../store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/modules/documents/store/workspace-store';
import { collectionApi, Collection } from '@/modules/documents/services/collection-api';
import { chatApi } from '../services/chat-api';
import Link from 'next/link';
import { ShareModal } from './share-modal';
import { useQueryClient } from '@tanstack/react-query';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: (payload?: { role_type?: string; role?: string; persona_type?: string; title?: string; model_name?: string; system_prompt?: string | null; temperature?: number; workspace_id?: string | null }) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onUpdateSessionTitle?: (id: string, title: string) => void;
  onArchiveSession?: (id: string, archive: boolean) => void;
}

const PERSONA_LABELS: Record<string, { icon: LucideIcon; label: string; colorClass?: string }> = {
  teacher: { icon: GraduationCap, label: 'Teacher', colorClass: 'text-emerald-600' },
  socratic: { icon: HelpCircle, label: 'Socratic', colorClass: 'text-purple-600' },
  guide: { icon: Compass, label: 'Guide', colorClass: 'text-amber-600' },
  peer: { icon: Users, label: 'Peer', colorClass: 'text-blue-600' },
  challenger: { icon: Target, label: 'Challenger', colorClass: 'text-rose-600' },
  senior_engineer: { icon: Terminal, label: 'Senior Engineer', colorClass: 'text-slate-800' },
  research_scientist: { icon: Atom, label: 'Research Scientist', colorClass: 'text-indigo-600' },
  interview_coach: { icon: ClipboardCheck, label: 'Interview Coach', colorClass: 'text-emerald-600' },
  career_mentor: { icon: Briefcase, label: 'Career Mentor', colorClass: 'text-violet-600' },
  data_scientist: { icon: BarChart3, label: 'Data Scientist', colorClass: 'text-cyan-600' },
  startup_founder: { icon: Rocket, label: 'Startup Founder', colorClass: 'text-orange-600' }
};

const colorsPreset = [
  { name: 'Slate',  value: '#64748B' },
  { name: 'Red',    value: '#EF4444' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Green',  value: '#10B981' },
  { name: 'Blue',   value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
];

const ROLE_DETAILS: Record<string, { name: string; icon: LucideIcon; colorClass: string }> = {
  general: { name: 'General Assistant', icon: Sparkles, colorClass: 'text-slate-650' },
  learning: { name: 'Learning Mentor', icon: GraduationCap, colorClass: 'text-emerald-600' },
  coding: { name: 'Coding Assistant', icon: Code, colorClass: 'text-blue-600' },
  dsa: { name: 'DSA Coach', icon: GitFork, colorClass: 'text-indigo-650' },
  research: { name: 'Research Analyst', icon: Search, colorClass: 'text-amber-600' },
  career: { name: 'Career Advisor', icon: Briefcase, colorClass: 'text-violet-600' },
  datascience: { name: 'Data Scientist', icon: BarChart3, colorClass: 'text-cyan-600' },
  document: { name: 'Document Assistant', icon: FileText, colorClass: 'text-rose-600' },
};

/* ─── tiny shared modal backdrop ─── */
const Backdrop = ({ onClose }: { onClose: () => void }) => (
  <div
    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
    onClick={onClose}
  />
);

/* ─── New Workspace Modal ─── */
interface NewWorkspaceModalProps {
  onClose: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
}
const NewWorkspaceModal: React.FC<NewWorkspaceModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(colorsPreset[0].value);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try { await onCreate(name.trim(), color); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto bg-white border border-slate-200 rounded-[10px] shadow-lg w-[300px] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-semibold text-slate-900">New Workspace</span>
            <button onClick={onClose} className="p-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Name</label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Interview Prep"
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors"
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {colorsPreset.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className="w-5 h-5 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center"
                    style={{
                      backgroundColor: c.value,
                      borderColor: color === c.value ? '#0f172a' : 'transparent',
                      outline: color === c.value ? '1px solid #0f172a' : 'none',
                      outlineOffset: '1px',
                    }}
                    title={c.name}
                  >
                    {color === c.value && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-1.5 rounded-[6px] border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="flex-1 py-1.5 rounded-[6px] bg-slate-900 text-white text-[11px] font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating…' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

/* ─── Confirmation Modal ─── */
interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onClose
}) => {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto bg-white border border-slate-200 rounded-[10px] shadow-lg w-[280px] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-[12px] font-semibold text-slate-900">{title}</span>
            <button onClick={onClose} className="p-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-700 mb-4 leading-relaxed">{description}</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-1.5 rounded-[6px] border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handle}
              disabled={loading}
              className={`flex-1 py-1.5 rounded-[6px] text-[11px] font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 ${
                danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-black'
              }`}
            >
              {loading ? 'Please wait…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Rename inline input modal ─── */
interface RenameModalProps {
  currentName: string;
  label: string;
  onRename: (name: string) => Promise<void> | void;
  onClose: () => void;
}
const RenameModal: React.FC<RenameModalProps> = ({ currentName, label, onRename, onClose }) => {
  const [val, setVal] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.select(); }, []);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim() || val.trim() === currentName) { onClose(); return; }
    setLoading(true);
    try { await onRename(val.trim()); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto bg-white border border-slate-200 rounded-[10px] shadow-lg w-[280px] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-semibold text-slate-900">{label}</span>
            <button onClick={onClose} className="p-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <form onSubmit={handle} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[12px] text-slate-900 focus:outline-none focus:border-slate-500 transition-colors"
            />
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-1.5 rounded-[6px] border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={!val.trim() || loading} className="flex-1 py-1.5 rounded-[6px] bg-slate-900 text-white text-[11px] font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50">
                {loading ? 'Saving…' : 'Rename'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

/* ─── Move Workspace Modal ─── */
interface MoveWorkspaceModalProps {
  session: ChatSession;
  collections: Collection[];
  onMove: (sessionId: string, workspaceId: string | null) => Promise<void>;
  onClose: () => void;
}
const MoveWorkspaceModal: React.FC<MoveWorkspaceModalProps> = ({ session, collections, onMove, onClose }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [checkingCurrent, setCheckingCurrent] = useState(true);

  useEffect(() => {
    let active = true;
    const findCurrentWorkspace = async () => {
      try {
        const results = await Promise.all(
          collections.map(c => collectionApi.getCollection(c.id).catch(() => null))
        );
        if (!active) return;
        const found = results.find(
          res => res && res.chats && res.chats.some((ch: any) => ch.id === session.id)
        );
        if (found) {
          setSelectedId(found.id);
          setCurrentWorkspaceId(found.id);
        } else {
          setSelectedId('none');
          setCurrentWorkspaceId('none');
        }
      } catch (err) {
        console.error("Failed to find current workspace of chat:", err);
      } finally {
        if (active) setCheckingCurrent(false);
      }
    };
    findCurrentWorkspace();
    return () => { active = false; };
  }, [session.id, collections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || selectedId === currentWorkspaceId) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      await onMove(session.id, selectedId === 'none' ? null : selectedId);
      onClose();
    } catch (err) {
      alert('Failed to move workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto bg-white border border-slate-200 rounded-[12px] shadow-xl w-[320px] p-5 flex flex-col max-h-[420px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-[13px] font-semibold text-slate-900 tracking-tight">Move to Workspace</span>
            <button onClick={onClose} className="p-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 mb-4 shrink-0 leading-relaxed">
            Choose a workspace to organize <span className="font-bold text-slate-800">"{session.title || 'this conversation'}"</span>.
          </p>

          {checkingCurrent ? (
            <div className="flex-grow flex items-center justify-center py-8">
              <span className="w-4 h-4 rounded-full border-2 border-slate-250 border-t-slate-800 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0 space-y-4">
              <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 py-0.5 scrollbar-thin max-h-[200px]">
                {/* Global Context Option */}
                <div
                  onClick={() => setSelectedId('none')}
                  className={`flex items-center justify-between px-3 py-2 rounded-[6px] border cursor-pointer transition-colors ${
                    selectedId === 'none'
                      ? 'border-slate-850 bg-slate-50'
                      : 'border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-semibold text-slate-800">Global Context</span>
                  </div>
                  {selectedId === 'none' && <Check className="w-3 h-3 text-slate-900" />}
                </div>

                {/* Collections Options */}
                {collections.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-[6px] border cursor-pointer transition-colors ${
                      selectedId === w.id
                        ? 'border-slate-850 bg-slate-50'
                        : 'border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: w.color || '#64748B' }} />
                      <span className="text-[11px] font-semibold text-slate-800 truncate">{w.name}</span>
                    </div>
                    {selectedId === w.id && <Check className="w-3 h-3 text-slate-900" />}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-1.5 rounded-[6px] border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedId === currentWorkspaceId}
                  className="flex-1 py-1.5 rounded-[6px] bg-slate-900 text-white text-[11px] font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Moving…' : 'Move Workspace'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

/* ─── New Chat Modal ─── */
interface NewChatModalProps {
  onClose: () => void;
  onCreate: (options: { role_type: string; persona_type: string; workspace_id: string | null }) => void;
  collections: Collection[];
}
const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onCreate, collections }) => {
  const [roleType, setRoleType] = useState('general');
  const [personaType, setPersonaType] = useState('teacher');
  const [workspaceId, setWorkspaceId] = useState<string>('none');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onCreate({
      role_type: roleType,
      persona_type: personaType,
      workspace_id: workspaceId === 'none' ? null : workspaceId
    });
    onClose();
  };

  const roles = [
    { id: 'general', name: 'General Assistant', desc: 'Standard multi-purpose assistant' },
    { id: 'learning', name: 'Learning Mentor', desc: 'Syllabus, explanations & practice' },
    { id: 'coding', name: 'Coding Assistant', desc: 'Write, refactor & review code' },
    { id: 'dsa', name: 'DSA Coach', desc: 'Algorithm analysis & dry runs' },
    { id: 'research', name: 'Research Analyst', desc: 'Literature review & comparisons' },
    { id: 'career', name: 'Career Advisor', desc: 'Resume & roadmap reviews' },
    { id: 'datascience', name: 'Data Scientist', desc: 'EDA & model selection guidelines' },
    { id: 'document', name: 'Document Assistant', desc: 'Strict RAG context responses' },
  ];

  const personas = [
    { id: 'teacher', name: 'Patient Teacher', desc: 'Supportive tone, gradual pacing' },
    { id: 'senior_engineer', name: 'Senior Engineer', desc: 'Pragmatic, direct & code-focused' },
    { id: 'research_scientist', name: 'Research Scientist', desc: 'Precise, objective & theoretical' },
    { id: 'interview_coach', name: 'Interview Coach', desc: 'Strategy, presentation & feedback' },
    { id: 'career_mentor', name: 'Career Mentor', desc: 'Growth, skills & career planning' },
    { id: 'data_scientist', name: 'Data Scientist', desc: 'Analytical, statistical & metrics' },
    { id: 'startup_founder', name: 'Startup Founder', desc: 'Pragmatic MVP focus, high velocity' },
  ];

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto bg-white border border-slate-200 rounded-[12px] shadow-xl w-[350px] p-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold text-slate-900 tracking-tight">Configure New Mentor Chat</span>
            <button onClick={onClose} className="p-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Role Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-800 mb-1">AI Mentor Role</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} — {r.desc}</option>
                ))}
              </select>
            </div>

            {/* Persona Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-800 mb-1">Personality Tone</label>
              <select
                value={personaType}
                onChange={(e) => setPersonaType(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
              >
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Workspace focus dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-800 mb-1">Workspace Focus (RAG)</label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="none">Global Context (No Workspace RAG)</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-1.5 rounded-[6px] bg-slate-900 text-white text-[11.5px] font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Launching...' : 'Launch Mentor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

/* ──────────────────────────── Main sidebar ──────────────────────────────── */

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  loading,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onUpdateSessionTitle,
  onArchiveSession,
}) => {
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useChatStore();
  const { user } = useAuthStore();
  const { activeWorkspaceId, setActiveWorkspaceId, collections, setCollections } = useWorkspaceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const filteredSessions = sessions.filter((session) =>
    (session.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeWorkspaceMenuId, setActiveWorkspaceMenuId] = useState<string | null>(null);
  const [shareSession, setShareSession] = useState<{ id: string; title: string } | null>(null);

  /* ── collapsed groups state ── */
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mentorai_collapsed_roles');
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const toggleGroup = (role: string) => {
    setCollapsedGroups(prev => {
      const next = { ...prev, [role]: !prev[role] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mentorai_collapsed_roles', JSON.stringify(next));
      }
      return next;
    });
  };

  const sessionsByRole = React.useMemo(() => {
    const groups: Record<string, ChatSession[]> = {};
    filteredSessions.forEach((session) => {
      const r = session.role_type || 'general';
      if (!groups[r]) {
        groups[r] = [];
      }
      groups[r].push(session);
    });
    return groups;
  }, [filteredSessions]);

  /* ── modal states ── */
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'workspace' | 'chat'; id: string; name: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string; description: string; confirmLabel: string; danger: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const queryClient = useQueryClient();
  const [moveSessionTarget, setMoveSessionTarget] = useState<ChatSession | null>(null);

  const handleMoveChatSession = async (sessionId: string, workspaceId: string | null) => {
    try {
      await chatApi.moveSession(sessionId, workspaceId);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspace-details', workspaceId] });
      }
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: ['workspace-details', activeWorkspaceId] });
      }
    } catch (err) {
      console.error('Failed to move chat session:', err);
      alert('Failed to move chat conversation to workspace.');
    }
  };

  const fetchWorkspaces = React.useCallback(async () => {
    try {
      const data = await collectionApi.listCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, [setCollections]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);



  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

  // menus are closed via click-away overlay rendered inside each open dropdown

  /* ── workspace actions ── */
  const handleCreateWorkspace = async (name: string, color: string) => {
    const newCol = await collectionApi.createCollection({
      name, description: 'Personal knowledge workspace', color, icon: 'Folder'
    });
    setCollections([newCol, ...collections]);
    setActiveWorkspaceId(newCol.id);
    router.push(`/workspaces/${newCol.id}`);
  };

  const handleRenameWorkspace = async (id: string, newName: string) => {
    const updated = await collectionApi.updateCollection(id, { name: newName });
    setCollections(collections.map(c => c.id === id ? updated : c));
  };

  const handleDeleteWorkspace = async (id: string) => {
    await collectionApi.deleteCollection(id);
    setCollections(collections.filter(c => c.id !== id));
    if (activeWorkspaceId === id) { setActiveWorkspaceId(null); router.push('/chat'); }
  };

  const handleDuplicateWorkspace = async (workspace: Collection) => {
    const newCol = await collectionApi.createCollection({
      name: `${workspace.name} Copy`,
      description: workspace.description || '',
      color: workspace.color || '#64748B',
      icon: workspace.icon || 'Folder'
    });
    const details = await collectionApi.getCollection(workspace.id);
    if (details.documents?.length) {
      await collectionApi.attachDocument(newCol.id, details.documents.map(d => d.id));
    }
    setCollections([newCol, ...collections]);
    setActiveWorkspaceId(newCol.id);
    router.push(`/workspaces/${newCol.id}`);
  };

  /* ── collapsed sidebar ── */
  if (!sidebarOpen) {
    return (
      <aside className="w-14 bg-[#f9f9f8] border-r border-slate-200 flex flex-col items-center py-3.5 gap-3.5 h-full shrink-0">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-[6px] text-slate-850 hover:text-slate-955 hover:bg-[#ecebea] transition-colors cursor-pointer" title="Open Sidebar">
          <PanelLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setActiveWorkspaceId(null);
            onCreateSession({
              role_type: 'general',
              role: 'general',
              persona_type: 'teacher',
              title: 'New Conversation',
              workspace_id: null
            });
          }}
          className="p-2 rounded-[6px] text-slate-850 hover:text-slate-955 hover:bg-[#ecebea] transition-colors cursor-pointer"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
        <Link href="/documents" className="p-2 rounded-[6px] text-slate-850 hover:text-slate-955 hover:bg-[#ecebea] transition-colors" title="Document Explorer">
          <FolderOpen className="w-4 h-4" />
        </Link>
        <Link href="/analytics" className="p-2 rounded-[6px] text-slate-850 hover:text-slate-955 hover:bg-[#ecebea] transition-colors" title="Workspace Analytics">
          <BarChart3 className="w-4 h-4" />
        </Link>
        <div className="flex flex-col gap-1.5 mt-1.5 items-center overflow-hidden flex-1 w-full px-1.5">
          <span className="text-[7.5px] font-semibold text-slate-700 select-none">Wps</span>
          {collections.slice(0, 5).map((w) => (
            <button
              key={w.id}
              onClick={() => { setActiveWorkspaceId(w.id); router.push(`/workspaces/${w.id}`); }}
              title={w.name}
              className={`w-7 h-7 rounded-[6px] flex items-center justify-center border transition-all ${
                w.id === activeWorkspaceId ? 'border-slate-800 bg-[#ecebea]' : 'border-slate-200 bg-white hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color || '#64748B' }} />
            </button>
          ))}
        </div>
        <Link href="/settings" className="p-2 rounded-[6px] text-slate-850 hover:text-slate-955 hover:bg-[#ecebea] transition-colors" title="Settings">
          <Settings className="w-4 h-4" />
        </Link>
        <Link href="/profile" className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-semibold transition-colors hover:bg-slate-755 mt-auto mb-1 overflow-hidden border border-slate-300" title="Profile">
          {user?.user_metadata?.avatar_url
            ? <Image src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" width={28} height={28} unoptimized />
            : initials}
        </Link>
      </aside>
    );
  }

  /* ── expanded sidebar ── */
  return (
    <>
      <aside className="w-64 bg-[#f9f9f8] border-r border-slate-200 flex flex-col h-full shrink-0 select-none">

        {/* Header */}
        <div className="px-3.5 pt-3.5 pb-3 flex items-center justify-between shrink-0">
          <Link href="/chat" onClick={() => setActiveWorkspaceId(null)} className="flex items-center gap-2">
            <Image src="/mentorai-symbol-only.svg" alt="MentorAI" width={28} height={28} className="h-7 w-auto object-contain shrink-0 select-none" />
            <span className="text-xs font-semibold text-slate-900 tracking-tight">MentorAI OS</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-[6px] text-slate-800 hover:text-slate-955 hover:bg-[#ecebea] transition-colors cursor-pointer" title="Collapse Sidebar">
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3.5 pb-2 shrink-0">
          <button
            onClick={() => {
              setActiveWorkspaceId(null);
              onCreateSession({
                role_type: 'general',
                role: 'general',
                persona_type: 'teacher',
                title: 'New Conversation',
                workspace_id: null
              });
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-[11px] transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            New Chat
          </button>
        </div>

        <div className="mx-3.5 my-0.5 border-t border-slate-200" />

        {/* WORKSPACES Section */}
        <div className="flex-[0.5] flex flex-col min-h-0">
          <div className="px-3.5 py-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">Workspaces</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowNewWorkspaceModal(true); }}
              className="p-1 text-slate-800 hover:text-slate-955 rounded-[4px] hover:bg-slate-200 cursor-pointer"
              title="New Workspace"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-0.5 space-y-0.5 scrollbar-thin">
            {collections.length === 0 ? (
              <div className="text-center text-[9px] text-slate-500 py-3">No workspaces yet. Click + to add one.</div>
            ) : (
              collections.map((w) => {
                const isActive = w.id === activeWorkspaceId;
                return (
                  <div
                    key={w.id}
                    onClick={() => { setActiveWorkspaceId(w.id); router.push(`/workspaces/${w.id}`); }}
                    className={`group relative flex items-center justify-between px-2.5 rounded-[6px] cursor-pointer transition-colors border ${
                      isActive
                        ? 'border-slate-300 bg-[#ecebea]/40 text-slate-955 font-semibold'
                        : 'border-transparent text-slate-850 hover:text-slate-955 hover:bg-[#ecebea]/45'
                    }`}
                    style={{ height: '28px' }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Folder className="w-3 h-3 shrink-0" style={{ color: w.color || '#64748B' }} />
                      <span className="text-[11px] truncate pr-1">{w.name}</span>
                    </div>

                    {/* Workspace 3-dot menu */}
                    <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveWorkspaceMenuId(prev => prev === w.id ? null : w.id); }}
                        className="p-0.5 text-slate-600 hover:text-black hover:bg-slate-200 rounded-[4px] cursor-pointer"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </button>

                      {activeWorkspaceMenuId === w.id && (
                        <>
                          {/* Click-away overlay — closes menu when clicking outside */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setActiveWorkspaceMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-0.5 w-36 bg-white border border-slate-200 rounded-[6px] shadow-lg py-1 z-50">
                            <button
                              onClick={() => { setActiveWorkspaceMenuId(null); setRenameTarget({ type: 'workspace', id: w.id, name: w.name }); }}
                              className="w-full text-left px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-[#f4f3f0] transition-colors flex items-center gap-1.5"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" /> Rename
                            </button>
                            <button
                              onClick={async () => { setActiveWorkspaceMenuId(null); await handleDuplicateWorkspace(w); }}
                              className="w-full text-left px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-[#f4f3f0] transition-colors flex items-center gap-1.5"
                            >
                              <Copy className="w-3 h-3 text-slate-500" /> Duplicate
                            </button>
                            <div className="border-t border-slate-100 my-0.5" />
                            <button
                              onClick={() => {
                                setActiveWorkspaceMenuId(null);
                                setConfirmModal({
                                  title: 'Delete Workspace',
                                  description: `Delete "${w.name}"? Documents inside will be detached but not deleted.`,
                                  confirmLabel: 'Delete',
                                  danger: true,
                                  onConfirm: () => handleDeleteWorkspace(w.id),
                                });
                              }}
                              className="w-full text-left px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mx-3.5 my-0.5 border-t border-slate-200" />

        {/* CHATS Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3.5 py-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">Chats</span>
          </div>

          <div className="px-3.5 pb-1.5 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-[6px] text-[11px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-slate-400 transition-all"
              />
            </div>
          </div>

            {loading && sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-6 text-slate-800">
                <span className="text-[9px] animate-pulse">Loading sessions...</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center text-[9px] text-slate-500 pt-6 px-4">
                {searchQuery ? 'No matching conversations.' : 'No active conversations.'}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-3 py-0.5 space-y-0.5 scrollbar-thin">
                {Object.keys(sessionsByRole).map((role) => {
                const groupSessions = sessionsByRole[role] || [];
                if (groupSessions.length === 0) return null;
                const isCollapsed = !!collapsedGroups[role];
                const roleMeta = ROLE_DETAILS[role] || { name: role, icon: MessageSquare, colorClass: 'text-slate-650' };
                const IconComponent = roleMeta.icon;
                
                return (
                  <div key={role} className="mb-1.5">
                    {/* Collapsible Role Group Header */}
                    <div 
                      onClick={() => toggleGroup(role)}
                      className="flex items-center justify-between px-2.5 py-1 hover:bg-[#ecebea]/45 rounded-[6px] cursor-pointer transition-colors text-slate-800 select-none mb-1 group/hdr"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <IconComponent className={`w-3.5 h-3.5 shrink-0 ${roleMeta.colorClass}`} />
                        <span className="text-[11.5px] font-semibold text-slate-900 tracking-tight capitalize">
                          {roleMeta.name}
                        </span>
                        <span className="text-[9px] font-medium text-slate-600 bg-slate-200/60 px-1.5 py-0.2 rounded-full">
                          {groupSessions.length}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                      )}
                    </div>

                    {/* Grouped list of chats */}
                    {!isCollapsed && (
                      <div className="space-y-0.5 pl-2 border-l border-slate-200 ml-3.5">
                        {groupSessions.map((session) => {
                          const isActive = session.id === activeSessionId;
                          return (
                            <div
                              key={session.id}
                              onClick={() => onSelectSession(session.id)}
                              className={`group relative flex items-center justify-between px-2 rounded-[6px] cursor-pointer transition-colors border ${
                                isActive
                                  ? 'border-slate-300 bg-[#ecebea]/40 text-slate-955 font-semibold'
                                  : 'border-transparent text-slate-850 hover:text-slate-955 hover:bg-[#ecebea]/45'
                              }`}
                              style={{ height: '40px' }}
                            >
                              <div className="flex flex-col justify-center min-w-0 flex-1 py-1">
                                <span className="text-[11px] font-medium truncate pr-1 leading-tight">{session.title || 'New Conversation'}</span>
                                {session.persona_type && (() => {
                                  const config = PERSONA_LABELS[session.persona_type];
                                  const IconComponent = config?.icon || MessageSquare;
                                  return (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[9px] text-slate-500 bg-slate-200/50 px-1 py-0.5 rounded font-medium flex items-center gap-1">
                                        <IconComponent className={`w-2.5 h-2.5 ${config?.colorClass || 'text-slate-500'}`} />
                                        <span>{config?.label || session.persona_type}</span>
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Chat 3-dot menu */}
                              <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActiveMenuId(prev => prev === session.id ? null : session.id); }}
                                  className="p-0.5 text-slate-600 hover:text-black hover:bg-slate-200 rounded-[4px] cursor-pointer"
                                >
                                  <MoreHorizontal className="w-3 h-3" />
                                </button>

                                {activeMenuId === session.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setActiveMenuId(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-0.5 w-36 bg-white border border-slate-200 rounded-[6px] shadow-lg py-1 z-50">
                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setRenameTarget({ type: 'chat', id: session.id, name: session.title || 'New Conversation' });
                                        }}
                                        className="w-full text-left px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-[#f4f3f0] transition-colors flex items-center gap-1.5"
                                      >
                                        <Edit2 className="w-3 h-3 text-slate-500" /> Rename
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setShareSession({ id: session.id, title: session.title || 'New Conversation' });
                                        }}
                                        className="w-full text-left px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-[#f4f3f0] transition-colors flex items-center gap-1.5"
                                      >
                                        <Share2 className="w-3 h-3 text-slate-500" /> Share
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setMoveSessionTarget(session);
                                        }}
                                        className="w-full text-left px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-[#f4f3f0] transition-colors flex items-center gap-1.5"
                                      >
                                        <FolderOpen className="w-3 h-3 text-slate-500" /> Move to Workspace
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setConfirmModal({
                                            title: session.is_archived ? 'Unarchive Chat' : 'Archive Chat',
                                            description: session.is_archived
                                              ? `Restore "${session.title || 'this conversation'}" from archive?`
                                              : `Archive "${session.title || 'this conversation'}"? You can restore it later.`,
                                            confirmLabel: session.is_archived ? 'Unarchive' : 'Archive',
                                            danger: false,
                                            onConfirm: () => onArchiveSession?.(session.id, !session.is_archived),
                                          });
                                        }}
                                        className="w-full text-left px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-[#f4f3f0] transition-colors flex items-center gap-1.5"
                                      >
                                        <Archive className="w-3 h-3 text-slate-500" />
                                        {session.is_archived ? 'Unarchive' : 'Archive'}
                                      </button>
                                      <div className="border-t border-slate-100 my-0.5" />
                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setConfirmModal({
                                            title: 'Delete Conversation',
                                            description: `Delete "${session.title || 'this conversation'}"? This action cannot be undone.`,
                                            confirmLabel: 'Delete',
                                            danger: true,
                                            onConfirm: () =>
                                              onDeleteSession(session.id, { stopPropagation: () => {} } as React.MouseEvent),
                                          });
                                        }}
                                        className="w-full text-left px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                                      >
                                        <Trash2 className="w-3 h-3" /> Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            )}
          </div>

        {/* System links */}
        <div className="shrink-0 px-2 py-1.5 space-y-0.5 border-t border-slate-200 bg-[#f4f3f0]/30">
          <Link href="/documents" className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-slate-800 hover:text-slate-955 hover:bg-[#ecebea]/55 text-[11px] font-medium transition-colors">
            <FolderOpen className="w-3.5 h-3.5 text-slate-700" /> Global Documents
          </Link>
          <Link href="/analytics" className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-slate-800 hover:text-slate-955 hover:bg-[#ecebea]/55 text-[11px] font-medium transition-colors">
            <BarChart3 className="w-3.5 h-3.5 text-slate-700" /> Workspace Analytics
          </Link>
          <Link href="/settings" className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-slate-800 hover:text-slate-955 hover:bg-[#ecebea]/55 text-[11px] font-medium transition-colors">
            <Settings className="w-3.5 h-3.5 text-slate-700" /> Settings
          </Link>
        </div>

        {/* Profile */}
        <div className="px-2 py-1.5 border-t border-slate-200 shrink-0 bg-[#f4f3f0]">
          <Link href="/profile" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] hover:bg-[#ecebea]/55 text-slate-900 hover:text-slate-955 transition-colors">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-semibold shrink-0 select-none overflow-hidden border border-slate-300">
              {user?.user_metadata?.avatar_url
                ? <Image src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" width={28} height={28} unoptimized />
                : initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium truncate text-slate-900">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[9px] text-slate-600 truncate font-mono">{user?.email || 'user@mentorai.os'}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Modals ── */}

      {showNewWorkspaceModal && (
        <NewWorkspaceModal
          onClose={() => setShowNewWorkspaceModal(false)}
          onCreate={handleCreateWorkspace}
        />
      )}

      {renameTarget && (
        <RenameModal
          currentName={renameTarget.name}
          label={renameTarget.type === 'workspace' ? 'Rename Workspace' : 'Rename Conversation'}
          onRename={async (name) => {
            if (renameTarget.type === 'workspace') {
              await handleRenameWorkspace(renameTarget.id, name);
            } else if (onUpdateSessionTitle) {
              onUpdateSessionTitle(renameTarget.id, name);
            }
          }}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {shareSession && (
        <ShareModal
          isOpen={!!shareSession}
          onClose={() => setShareSession(null)}
          sessionId={shareSession.id}
          sessionTitle={shareSession.title}
        />
      )}

      {moveSessionTarget && (
        <MoveWorkspaceModal
          session={moveSessionTarget}
          collections={collections}
          onMove={handleMoveChatSession}
          onClose={() => setMoveSessionTarget(null)}
        />
      )}

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          collections={collections}
          onCreate={(options) => {
            if (options.workspace_id) {
              setActiveWorkspaceId(options.workspace_id);
            } else {
              setActiveWorkspaceId(null);
            }
            const roleName = ROLE_DETAILS[options.role_type]?.name || options.role_type;
            onCreateSession({
              role_type: options.role_type,
              role: options.role_type,
              persona_type: options.persona_type,
              title: `New ${roleName}`,
              workspace_id: options.workspace_id
            });
          }}
        />
      )}
    </>
  );
};
