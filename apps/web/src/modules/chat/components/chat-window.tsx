import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, BookOpen, Terminal, Code2, User, Share2, Settings, LogOut, ChevronDown, RotateCcw } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { ChatMessage } from './chat-message';
import { ChatMessage as ChatMessageType } from '../store/chat-store';

interface ChatWindowProps {
  sessionTitle: string;
  modelName: string;
  messages: ChatMessageType[];
  isStreaming: boolean;
  streamingContent: string;
  streamError: string | null;
  loading: boolean;
  onSendMessage: (content: string) => void;
  onRetry?: () => void;
}

const cleanErrorMessage = (err: string): string => {
  if (!err) return '';
  if (err.includes('API_KEY_INVALID') || err.includes('API key not valid')) {
    return 'API key not valid. Please pass a valid API key.';
  }
  const messageMatch = err.match(/'message':\s*'([^']+)'/) || err.match(/"message":\s*"([^"]+)"/);
  if (messageMatch && messageMatch[1]) {
    return messageMatch[1];
  }
  return err
    .replace(/^Streaming generation failed:\s*/i, '')
    .replace(/^Gemini streaming failed:\s*/i, '')
    .replace(/^Gemini API call failed:\s*/i, '')
    .split('\n')[0]
    .trim();
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  sessionTitle,
  modelName,
  messages,
  isStreaming,
  streamingContent,
  streamError,
  loading,
  onSendMessage,
  onRetry,
}) => {
  const { user, signOut } = useAuthStore();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isStreaming]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    router.push('/login');
  };

  // Get initials for avatar
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  const handleSuggestClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  const welcomeSuggestions = [
    {
      title: "Master DSA Algorithms",
      desc: "Explain the visual intuition of Dijkstra's algorithm.",
      icon: <Terminal className="w-4 h-4 text-purple-600" />,
      text: "Can you explain Dijkstra's algorithm step-by-step with complexity details and a Python code implementation?"
    },
    {
      title: "Code Architecture",
      desc: "Implement repository patterns in clean architecture.",
      icon: <Code2 className="w-4 h-4 text-indigo-600" />,
      text: "How do I implement a repository pattern in FastAPI with async SQLAlchemy? Provide a working code sample."
    },
    {
      title: "Skill Roadmap",
      desc: "Build a roadmap to master fullstack web development.",
      icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
      text: "Design a complete roadmap for a junior software developer to become a senior Full Stack Engineer in 12 months."
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">

      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-200/50 bg-[#f9f9f8] px-4 flex items-center justify-between z-10 shrink-0">

        {/* Left: toggle + title */}
        <div className="flex items-center gap-2.5 min-w-0">
          {(!sessionTitle || sessionTitle === 'New Conversation') ? (
            <Image src="/mentorai-horizontal-lockup.svg" alt="MentorAI" width={88} height={44} className="h-11 w-auto object-contain select-none" />
          ) : (
            <span className="text-slate-800 truncate text-[14px] font-semibold">
              {sessionTitle}
            </span>
          )}
        </div>


        {/* Right: profile avatar + dropdown */}
        <div className="flex items-center gap-3 relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-1.5 cursor-pointer group"
            title="Profile"
          >
            {/* Avatar circle */}
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold tracking-wide select-none group-hover:bg-slate-700 transition-colors">
              {initials}
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200/70 rounded-[6px] shadow-sm py-1 z-50">
              {/* User info */}
              {user?.email && (
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
                </div>
              )}

              <button
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                Profile
              </button>

              <button
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                Share
              </button>

              <button
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Settings
              </button>

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Messages Scroll Area ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin bg-transparent">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
              <span className="text-xs font-medium text-slate-500">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          // Welcome Dashboard
          <div className="max-w-3xl mx-auto w-full pt-16 pb-8 flex flex-col justify-center items-center text-center">
            <div className="mb-6 flex justify-center">
              <Image src="/mentorai-symbol-only.svg" alt="MentorAI Symbol" width={44} height={44} />
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
              Welcome to MentorAI OS
            </h1>

            <p className="text-slate-500 max-w-sm mt-2 text-xs leading-relaxed">
              Your production-ready AI tutoring system. Pick a suggestion below or write a custom prompt to start learning.
            </p>

            {/* Suggestion cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-10">
              {welcomeSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSuggestClick(sug.text)}
                  className="group p-4 bg-white hover:bg-[#fcfbf9] border border-slate-200 rounded-[6px] cursor-pointer text-left transition-colors"
                >
                  <div className="w-7 h-7 rounded-[6px] bg-[#f4f3f0] border border-slate-200/60 flex items-center justify-center mb-3">
                    {sug.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-xs group-hover:text-slate-950 flex items-center gap-1">
                    {sug.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-800" />
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    {sug.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Messages Listing
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onEditMessage={message.role === 'user' ? onSendMessage : undefined}
                onClickSuggestion={onSendMessage}
              />
            ))}

            {/* Live Streaming Message */}
            {isStreaming && streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming-assistant',
                  session_id: messages[0]?.session_id || '',
                  role: 'assistant',
                  content: streamingContent,
                  model_name: modelName,
                  input_tokens: 0,
                  output_tokens: 0,
                  latency_ms: 0,
                  created_at: new Date().toISOString(),
                }}
              />
            )}

            {/* Streaming Indicator */}
            {isStreaming && !streamingContent && (
              <div className="w-full flex gap-4 py-4 text-left">
                {/* Avatar Icon */}
                <div className="w-8 h-8 rounded-full bg-transparent border border-slate-200 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-none">
                  <Image src="/mentorai-symbol-only.svg" alt="MentorAI" width={20} height={20} className="w-5 h-5" />
                </div>
                {/* Generating... UI */}
                <div className="flex-1 flex items-center">
                  <div className="flex items-center">
                    <Image
                      src="/mentorai-symbol-only.svg"
                      alt="Generating"
                      width={14}
                      height={14}
                      className="rotate-generating select-none shrink-0"
                    />
                    <span className="generating-text text-xs font-semibold select-none">Generating...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {streamError && (
              <div className="w-full flex gap-4 py-4 text-left">
                {/* Avatar Icon */}
                <div className="w-8 h-8 rounded-full bg-transparent border border-slate-200 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-none">
                  <Image src="/mentorai-symbol-only.svg" alt="Error" width={20} height={20} className="w-5 h-5 opacity-80" />
                </div>
                {/* Error Message Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-red-500 select-none">
                    <span className="text-[12px] font-medium text-red-600">System Error</span>
                  </div>
                  <div className="p-3 py-2 bg-red-50/50 border border-red-100/80 text-red-700 rounded-[8px] text-[13px] leading-relaxed max-w-2xl font-medium">
                    <span className="line-clamp-2" title={cleanErrorMessage(streamError)}>
                      {cleanErrorMessage(streamError)}
                    </span>
                  </div>
                  {onRetry && (
                    <div className="pt-1 select-none">
                      <button
                        onClick={onRetry}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-red-200 bg-white hover:bg-red-50/20 text-red-600 hover:text-red-700 text-[11px] font-semibold transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95 group/retry"
                        title="Retry generation"
                      >
                        <RotateCcw className="w-3.5 h-3.5 group-hover/retry:rotate-45 transition-transform duration-200" />
                        <span>Retry generating</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
