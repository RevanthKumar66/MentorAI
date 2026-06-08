'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, Plus, Trash2, PanelLeftClose, PanelLeft, 
  FolderOpen, Settings, Search, MoreHorizontal, Edit2, Share2, Archive, FolderPlus, Copy, Folder, X, Check
} from 'lucide-react';
import { ChatSession, useChatStore } from '../store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/modules/documents/store/workspace-store';
import { collectionApi, Collection } from '@/modules/documents/services/collection-api';
import Link from 'next/link';
import { ShareModal } from './share-modal';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onUpdateSessionTitle?: (id: string, title: string) => void;
  onArchiveSession?: (id: string, archive: boolean) => void;
}

const colorsPreset = [
  { name: 'Slate',  value: '#64748B' },
  { name: 'Red',    value: '#EF4444' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Green',  value: '#10B981' },
  { name: 'Blue',   value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
];

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
              <label className="block text-[9.5px] font-semibold text-slate-700 mb-1 uppercase tracking-wide">Name</label>
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
              <label className="block text-[9.5px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Color</label>
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeWorkspaceMenuId, setActiveWorkspaceMenuId] = useState<string | null>(null);
  const [shareSession, setShareSession] = useState<{ id: string; title: string } | null>(null);

  /* ── modal states ── */
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'workspace' | 'chat'; id: string; name: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string; description: string; confirmLabel: string; danger: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const fetchWorkspaces = React.useCallback(async () => {
    try {
      const data = await collectionApi.listCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, [setCollections]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  const filteredSessions = sessions.filter((session) =>
    (session.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <button onClick={onCreateSession} className="p-2 rounded-[6px] text-slate-850 hover:text-slate-955 hover:bg-[#ecebea] transition-colors cursor-pointer" title="New Chat">
          <Plus className="w-4 h-4" />
        </button>
        <Link href="/documents" className="p-2 rounded-[6px] text-slate-850 hover:text-slate-955 hover:bg-[#ecebea] transition-colors" title="Document Explorer">
          <FolderOpen className="w-4 h-4" />
        </Link>
        <div className="flex flex-col gap-1.5 mt-1.5 items-center overflow-hidden flex-1 w-full px-1.5">
          <span className="text-[7px] font-semibold text-slate-500 uppercase select-none">WPs</span>
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
            onClick={onCreateSession}
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
            <span className="text-[9px] font-semibold text-slate-850 uppercase tracking-wider">Workspaces</span>
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
            <span className="text-[9px] font-semibold text-slate-850 uppercase tracking-wider">Chats</span>
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

          <div className="flex-1 overflow-y-auto px-3 py-0.5 space-y-0.5 scrollbar-thin">
            {loading && sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-6 text-slate-800">
                <span className="text-[9px] animate-pulse">Loading sessions...</span>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center text-[9px] text-slate-500 pt-6 px-4">
                {searchQuery ? 'No matching conversations.' : 'No active conversations.'}
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group relative flex items-center justify-between px-2.5 rounded-[6px] cursor-pointer transition-colors border ${
                      isActive
                        ? 'border-slate-300 bg-[#ecebea]/40 text-slate-955 font-semibold'
                        : 'border-transparent text-slate-850 hover:text-slate-955 hover:bg-[#ecebea]/45'
                    }`}
                    style={{ height: '28px' }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className={`w-3 h-3 shrink-0 ${isActive ? 'text-slate-955' : 'text-slate-600'}`} />
                      <span className="text-[11px] truncate pr-1">{session.title || 'New Conversation'}</span>
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
                          {/* Click-away overlay — closes menu when clicking outside */}
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
              })
            )}
          </div>
        </div>

        {/* System links */}
        <div className="shrink-0 px-2 py-1.5 space-y-0.5 border-t border-slate-200 bg-[#f4f3f0]/30">
          <Link href="/documents" className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-slate-800 hover:text-slate-955 hover:bg-[#ecebea]/55 text-[11px] font-medium transition-colors">
            <FolderOpen className="w-3.5 h-3.5 text-slate-700" /> Global Documents
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
    </>
  );
};
