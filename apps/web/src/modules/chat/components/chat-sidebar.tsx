'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, Plus, Trash2, PanelLeftClose, PanelLeft, FolderOpen, Settings, Search } from 'lucide-react';
import { ChatSession, useChatStore } from '../store/chat-store';
import Link from 'next/link';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  loading,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
}) => {
  const { sidebarOpen, setSidebarOpen } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((session) =>
    (session.title || 'New Conversation')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // ── Collapsed sidebar: show icon rail only ──────────────────────────
  if (!sidebarOpen) {
    return (
      <aside className="w-16 bg-[#f9f9f8] border-r border-slate-200/50 flex flex-col items-center py-4 gap-4 h-full shrink-0">
        {/* Toggle open */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-3 rounded-[8px] text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors cursor-pointer"
          title="Open Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* New chat */}
        <button
          onClick={onCreateSession}
          className="p-3 rounded-[8px] text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors cursor-pointer"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Documents */}
        <Link
          href="/documents"
          className="p-3 rounded-[8px] text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          title="Document Explorer"
        >
          <FolderOpen className="w-5 h-5" />
        </Link>

        {/* Session dots */}
        <div className="flex flex-col gap-2.5 mt-2 items-center overflow-hidden flex-1">
          {sessions.slice(0, 8).map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              title={s.title || 'Conversation'}
              className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                s.id === activeSessionId ? 'bg-slate-700' : 'bg-slate-300 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        {/* Settings button */}
        <button
          onClick={() => alert('Settings option coming soon!')}
          className="p-3 rounded-[8px] text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors cursor-pointer mt-auto"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  // ── Expanded sidebar ────────────────────────────────────────────────
  return (
    <aside className="w-72 bg-[#f9f9f8] border-r border-slate-200/50 flex flex-col h-full shrink-0">


      {/* Header — no bottom border, increased padding bottom to increase gap */}
      <div className="px-4 pt-4 pb-6 flex items-center justify-between shrink-0">
        <Image src="/mentorai-symbol-only.svg" alt="MentorAI" width={24} height={24} className="shrink-0" />

        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-2 space-y-2">
        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-[6px] border border-slate-200/70 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>
        <Link
          href="/documents"
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-[6px] border border-slate-200/70 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          Document Explorer
        </Link>
        
        {/* Search Bar */}
        <div className="relative pt-1">
          <Search className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200/70 rounded-[6px] text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300/20 transition-all"
          />
        </div>
      </div>


      {/* Thin divider */}
      <div className="mx-3 border-t border-slate-200/40" />

      {/* Chat Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-8 text-slate-400">
            <span className="text-[10px] animate-pulse">Loading sessions...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center text-[10px] text-slate-400 pt-8 px-4">
            {searchQuery ? 'No matching conversations.' : 'No active conversations.'}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-[6px] cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#ecebea] text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-[#ecebea]/55'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-700' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium truncate pr-1">
                    {session.title || 'New Conversation'}
                  </span>
                </div>

                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-300/60 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Delete Chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Settings option */}
      <div className="px-2 py-1.5 border-t border-slate-200/40">
        <button
          onClick={() => alert('Settings option coming soon!')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-slate-500 hover:text-slate-900 hover:bg-[#ecebea]/55 text-xs font-medium transition-colors cursor-pointer text-left"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Settings
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-200/40 text-[9px] text-slate-400 flex justify-between items-center">
        <span>Sprint 3 Active</span>
        <span className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200/60 text-[8px] text-slate-500 font-mono">
          V0.3.0
        </span>
      </div>
    </aside>
  );
};
