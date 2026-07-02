'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useChat } from '@/modules/chat/hooks/use-chat';
import { ChatSidebar } from '@/modules/chat/components/chat-sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen justify-center items-center bg-[#fcfbf9] text-slate-800">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs mt-2 font-medium">Launching Momentum AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <AppLayoutContent>{children}</AppLayoutContent>;
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    loadingSessions,
    createSession,
    deleteSession,
    updateSessionMeta,
  } = useChat();

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    if (pathname !== '/chat') {
      router.push('/chat');
    }
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteSession(id);
    }
  };

  const handleCreateSession = async (options?: {
    model_name?: string;
    title?: string;
    system_prompt?: string | null;
    temperature?: number;
    role?: string;
    role_type?: string;
    persona_type?: string;
    workspace_id?: string | null;
  }) => {
    createSession(options);
    if (pathname !== '/chat') {
      router.push('/chat');
    }
  };

  const isMentorWorkspace = pathname?.startsWith('/mentors') || pathname?.startsWith('/lifesaver');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800">
      {!isMentorWorkspace && (
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={loadingSessions}
          onSelectSession={handleSelectSession}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onUpdateSessionTitle={(id, title) => updateSessionMeta(id, { title })}
          onArchiveSession={(id, archive) => updateSessionMeta(id, { is_archived: archive })}
        />
      )}
      <div className="flex-1 min-w-0 h-full relative">
        {children}
      </div>
    </div>
  );
}
