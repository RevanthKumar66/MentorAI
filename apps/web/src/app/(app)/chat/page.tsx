'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { ChatLayout } from '@/modules/chat/components/chat-layout';

export default function ChatPage() {
  const { user, loading, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] w-screen justify-center items-center bg-[#fcfbf9] text-slate-800">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs mt-2 font-medium">Loading MentorAI OS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ChatLayout />;
}
