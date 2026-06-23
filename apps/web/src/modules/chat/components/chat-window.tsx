import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, Terminal, Code2, Code, User, Share2, Settings, LogOut, ChevronDown, 
  RotateCcw, Database, Search, Star, GraduationCap, Briefcase, BarChart3, FileText, Plus,
  GitFork, MessageSquare, HelpCircle, Compass, Users, Target, Atom, ClipboardCheck, Rocket, LucideIcon, Sparkles, Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/modules/documents/store/workspace-store';
import { collectionApi } from '@/modules/documents/services/collection-api';
import { ChatMessage } from './chat-message';
import { ChatMessage as ChatMessageType, useChatStore } from '../store/chat-store';
import { ShareModal } from './share-modal';
import { WorkspaceSelector } from './workspace-selector';



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
  onPrefillInput?: (content: string) => void;
  activeSessionId?: string;
  onCreateSession?: (payload?: { role_type?: string; role?: string; persona_type?: string; title?: string; model_name?: string; system_prompt?: string | null; temperature?: number; workspace_id?: string | null }) => void;
}

const cleanErrorMessage = (err: string): string => {
  if (!err) return '';
  if (err.includes('API_KEY_INVALID') || err.includes('API key not valid')) {
    return 'API key not valid. Please pass a valid API key.';
  }

  let cleaned = err;
  const messageMatch = err.match(/'message':\s*'([^']+)'/) || err.match(/"message":\s*"([^"]+)"/);
  if (messageMatch && messageMatch[1]) {
    cleaned = messageMatch[1];
  } else {
    cleaned = err
      .replace(/^Streaming generation failed:\s*/i, '')
      .replace(/^Gemini streaming failed:\s*/i, '')
      .replace(/^Gemini API call failed:\s*/i, '')
      .split('\n')[0]
      .trim();
  }

  const lower = cleaned.toLowerCase();
  if (
    lower.includes('experiencing high demand') ||
    lower.includes('resource has been exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('429') ||
    lower.includes('quota')
  ) {
    return 'Requests rate limit was exceeded. Please try again shortly or upgrade your plan.';
  }

  if (lower.includes('network error') || lower.includes('failed to fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  return cleaned;
};

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

export const ChatWindow: React.FC<ChatWindowProps> = ({
  modelName,
  messages,
  isStreaming,
  streamingContent,
  streamError,
  loading,
  onSendMessage,
  onRetry,
  onPrefillInput,
  activeSessionId,
  sessionTitle,
  onCreateSession,
}) => {
  const { user, signOut } = useAuthStore();
  const router = useRouter();
  const { sessions } = useChatStore();
  const currentSession = sessions.find(s => s.id === activeSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const { activeWorkspaceId, collections, setActiveWorkspaceId } = useWorkspaceStore();
  
  const { data: workspaceDetails } = useQuery({
    queryKey: ['workspace-details', activeWorkspaceId],
    queryFn: () => collectionApi.getCollection(activeWorkspaceId!),
    enabled: !!activeWorkspaceId,
  });

  const { data: workspaceNotes } = useQuery({
    queryKey: ['workspace-notes', activeWorkspaceId],
    queryFn: () => collectionApi.listNotes(activeWorkspaceId!),
    enabled: !!activeWorkspaceId,
  });

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
    if (onPrefillInput) {
      onPrefillInput(suggestion);
    } else {
      onSendMessage(suggestion);
    }
  };



  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">

      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-200 bg-[#f9f9f8] px-4 flex items-center justify-between z-10 shrink-0">

        {/* Left: toggle + title + context pills */}
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/mentorai-symbol-only.svg" alt="MentorAI" width={28} height={28} className="h-7 w-auto object-contain select-none shrink-0" />
          <WorkspaceSelector />
          
          {currentSession && (
            <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-3">
              {/* Role pill */}
              <span className="text-[10px] bg-slate-200/50 hover:bg-slate-200/70 border border-slate-300 text-slate-800 px-2 py-0.5 rounded-[4px] font-semibold flex items-center gap-1">
                {React.createElement(ROLE_DETAILS[currentSession.role_type || 'general']?.icon || MessageSquare, { className: "w-3 h-3 text-slate-650" })}
                <span>{ROLE_DETAILS[currentSession.role_type || 'general']?.name || 'Assistant'}</span>
              </span>
              
              {/* Persona pill */}
              {currentSession.persona_type && (() => {
                const config = PERSONA_LABELS[currentSession.persona_type];
                const IconComponent = config?.icon || MessageSquare;
                return (
                  <span className="text-[10px] bg-slate-200/50 hover:bg-slate-200/70 border border-slate-300 text-slate-800 px-2 py-0.5 rounded-[4px] font-semibold flex items-center gap-1">
                    <IconComponent className={`w-3 h-3 ${config?.colorClass || 'text-slate-650'}`} />
                    <span>{config?.label || currentSession.persona_type}</span>
                  </span>
                );
              })()}

              {/* Connected Workspace pill */}
              {workspaceDetails && (
                <span className="text-[10px] bg-slate-200/50 hover:bg-slate-200/70 border border-slate-300 text-slate-800 px-2 py-0.5 rounded-[4px] font-semibold flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-600" />
                  <span>Workspace: {workspaceDetails.name}</span>
                </span>
              )}
            </div>
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
            <div className="w-[34px] h-[34px] rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold tracking-wide select-none group-hover:bg-slate-700 transition-colors overflow-hidden border border-slate-350 shrink-0">
              {user?.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-700 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-350 rounded-[6px] shadow-sm py-1 z-50">
              {/* User info */}
              {user?.email && (
                <div className="px-3 py-2 border-b border-slate-200">
                  <p className="text-[10px] text-slate-700 truncate font-mono">{user.email}</p>
                </div>
              )}

              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push('/profile');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 hover:text-slate-955 transition-colors cursor-pointer text-left"
              >
                <User className="w-3.5 h-3.5 text-slate-700" />
                Profile
              </button>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  setShareModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 hover:text-slate-955 transition-colors cursor-pointer text-left"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-700" />
                Share
              </button>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 hover:text-slate-955 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-3.5 h-3.5 text-slate-700" />
                Settings
              </button>

              <div className="border-t border-slate-200 mt-1 pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-650 hover:bg-red-50 transition-colors cursor-pointer text-left"
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
          <div className="h-full flex items-center justify-center text-slate-700">
            <div className="flex flex-col items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
              <span className="text-xs font-medium text-slate-700">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          // Welcome Dashboard (Workspace vs Global)
          activeWorkspaceId ? (
            <div className="max-w-3xl mx-auto w-full pt-16 pb-8 flex flex-col justify-center items-center text-center">
              <div className="mb-6 flex justify-center">
                <Image src="/mentorai-symbol-only.svg" alt="MentorAI Symbol" width={44} height={44} />
              </div>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
                Workspace: {workspaceDetails?.name || 'Knowledge Workspace'}
              </h1>
              
              <div className="flex items-center gap-6 mt-4 px-4 py-2 bg-white border border-slate-200 rounded-[8px] text-[11px] font-bold text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-none">
                <div>Documents: <span className="font-mono text-slate-900">{workspaceDetails?.documents?.length || 0}</span></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <div>Notes: <span className="font-mono text-slate-900">{workspaceNotes?.length || 0}</span></div>
              </div>

              <p className="text-slate-750 max-w-sm mt-3 text-xs leading-relaxed">
                {workspaceDetails?.description || 'This workspace is isolated. AI query RAG is restricted only to files linked to this project.'}
              </p>

              {/* Workspace Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-10">
                {[
                  {
                    title: "Summarize Workspace",
                    desc: "Analyze and create a detailed synthesis of all files in this project.",
                    text: "Summarize all documents in this workspace."
                  },
                  {
                    title: "Generate Learning Plan",
                    desc: "Create a step-by-step study outline from these materials.",
                    text: "Generate a structured learning plan based on the workspace documents."
                  },
                  {
                    title: "Find Key Concepts",
                    desc: "Extract core ideas, terminology definitions, and main themes.",
                    text: "What are the most important concepts explained in this workspace?"
                  },
                  {
                    title: "Ask Workspace Analysis",
                    desc: "Provide a comprehensive overview of all notes and files.",
                    text: "Provide a high level analysis of all notes and files."
                  }
                ].map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestClick(sug.text)}
                    className="group p-4 bg-white hover:bg-[#fcfbf9] border border-slate-350 rounded-[6px] cursor-pointer text-left transition-colors"
                  >
                    <h3 className="font-semibold text-slate-850 text-xs group-hover:text-slate-955 flex items-center gap-1">
                      {sug.title}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-800" />
                    </h3>
                    <p className="text-[10px] text-slate-700 mt-1 leading-normal">
                      {sug.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // General Welcome Dashboard (un-workspace'd)
            <div className="max-w-4xl mx-auto w-full pt-12 pb-8 flex flex-col justify-start items-center text-center px-4">
              <div className="mb-4 flex justify-center">
                <Image src="/mentorai-symbol-only.svg" alt="MentorAI Symbol" width={40} height={40} />
              </div>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
                Welcome to MentorAI OS
              </h1>

              <p className="text-slate-700 max-w-md mt-1 text-[11.5px] leading-relaxed">
                Your personalized AI learning and productivity workspace. Choose a project workspace below to access RAG context, or launch a specialized AI Mentor.
              </p>

              {/* Choose Your Workspace Launcher Cards */}
              <div className="w-full mt-8 text-left">
                <h2 className="text-[12px] font-semibold text-slate-900 mb-3 tracking-tight">
                  Choose Your Workspace
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {collections.slice(0, 5).map((col) => (
                    <div
                      key={col.id}
                      onClick={() => {
                        setActiveWorkspaceId(col.id);
                        router.push(`/workspaces/${col.id}`);
                      }}
                      className="group p-4 bg-white hover:bg-[#fcfbf9] border border-slate-200 rounded-[10px] cursor-pointer transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[110px]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color || '#64748B' }} />
                            <h3 className="font-semibold text-slate-850 text-[11.5px] group-hover:text-slate-955 truncate">
                              {col.name}
                            </h3>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-800 shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-700 line-clamp-2 leading-relaxed mb-3">
                          {col.description || 'Personal workspace for organizing documents and chat context.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[9.5px] font-medium text-slate-800 border-t border-slate-100 pt-2 shrink-0">
                        <span>{col.document_count || 0} Files</span>
                        <span className="w-1 h-1 rounded-full bg-slate-350" />
                        <span>Knowledge Context</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Create New Workspace placeholder/card */}
                  <div
                    onClick={() => {
                      router.push('/documents');
                    }}
                    className="group p-4 bg-white hover:bg-[#fcfbf9] border border-dashed border-slate-300 rounded-[10px] cursor-pointer flex flex-col justify-center items-center transition-all min-h-[110px] text-center"
                  >
                    <Plus className="w-4 h-4 text-slate-750 mb-1" />
                    <span className="text-[11px] font-semibold text-slate-900 group-hover:text-slate-955">
                      New Workspace
                    </span>
                    <span className="text-[9.5px] text-slate-700 mt-0.5">
                      Create workspace in File Explorer
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Mentors Launcher Cards */}
              <div className="w-full mt-10 text-left">
                <h2 className="text-[12px] font-semibold text-slate-900 mb-3 tracking-tight">
                  AI Mentors
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    {
                      key: "learning",
                      title: "Learning Mentor",
                      desc: "Structured concept explanation, analogies, and practice quizzes.",
                      icon: <GraduationCap className="w-4 h-4 text-emerald-600" />
                    },
                    {
                      key: "coding",
                      title: "Coding Assistant",
                      desc: "Production-grade code drafting, debugging, and review guidelines.",
                      icon: <Code2 className="w-4 h-4 text-blue-600" />
                    },
                    {
                      key: "dsa",
                      title: "DSA Coach",
                      desc: "Systematic algorithm analysis, dry runs, and interview question prep.",
                      icon: <Terminal className="w-4 h-4 text-indigo-600" />
                    },
                    {
                      key: "research",
                      title: "Research Analyst",
                      desc: "Literature reviews, comparison guides, and citation assistance.",
                      icon: <Search className="w-4 h-4 text-amber-600" />
                    },
                    {
                      key: "career",
                      title: "Career Advisor",
                      desc: "Resume audit, gap assessments, and planning roadmaps.",
                      icon: <Briefcase className="w-4 h-4 text-violet-600" />
                    },
                    {
                      key: "datascience",
                      title: "Data Scientist",
                      desc: "Exploratory analysis, feature transformation, and ML strategies.",
                      icon: <BarChart3 className="w-4 h-4 text-cyan-600" />
                    },
                    {
                      key: "document",
                      title: "Document Assistant",
                      desc: "Answering context-anchored questions based on your files.",
                      icon: <FileText className="w-4 h-4 text-rose-600" />
                    },
                    {
                      key: "lifesaver",
                      title: "Momentum AI",
                      desc: "AI productivity companion that helps you plan, prioritize, and complete goals before deadlines are missed.",
                      icon: <Zap className="w-4 h-4 text-indigo-600" />
                    }
                  ].map((mentor) => (
                    <div
                      key={mentor.key}
                      onClick={() => {
                        if (mentor.key === 'lifesaver') {
                          router.push('/lifesaver');
                        } else if (onCreateSession) {
                          onCreateSession({
                            role_type: mentor.key,
                            role: mentor.key,
                            title: `${mentor.title} Chat`,
                            model_name: 'gemini-2.5-flash',
                            temperature: 0.7
                          });
                        }
                      }}
                      className="group p-4 bg-white hover:bg-[#fcfbf9] border border-slate-200 rounded-[10px] cursor-pointer transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-start min-h-[110px]"
                    >
                      <div className="w-7 h-7 rounded-[6px] bg-[#f4f3f0] border border-slate-200 flex items-center justify-center mb-3 shrink-0">
                        {mentor.icon}
                      </div>
                      <h3 className="font-semibold text-slate-850 text-[11.5px] group-hover:text-slate-955 flex items-center gap-1">
                        {mentor.title}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-800 shrink-0" />
                      </h3>
                      <p className="text-[10px] text-slate-700 mt-1 leading-normal">
                        {mentor.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
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
                  <div className="flex items-center gap-1.5">
                    <div className="preloader w-3 h-3 select-none shrink-0">
                      <div className="crack crack5"></div>
                      <div className="crack crack4"></div>
                      <div className="crack crack3"></div>
                      <div className="crack crack2"></div>
                      <div className="crack"></div>
                    </div>
                    <span className="generating-text text-xs font-semibold select-none">Generating...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {streamError && (
              <div className="w-full flex gap-4 py-4 text-left">
                {/* Avatar Icon */}
                <div className="w-8 h-8 rounded-full bg-transparent border border-slate-350 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)] select-none">
                  <Image src="/mentorai-symbol-only.svg" alt="Error" width={20} height={20} className="w-5 h-5" />
                </div>
                {/* Error Message Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-red-700 select-none">
                    <span className="text-[12px] font-medium text-red-700">System Error</span>
                  </div>
                  <div className="p-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-[8px] text-[13px] leading-relaxed max-w-2xl font-medium">
                    <span className="line-clamp-2" title={cleanErrorMessage(streamError)}>
                      {cleanErrorMessage(streamError)}
                    </span>
                  </div>
                  {onRetry && (
                    <div className="pt-1 select-none flex items-center gap-2">
                      {cleanErrorMessage(streamError).includes('rate limit') ? (
                        <Link
                          href="/pricing"
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-900 bg-slate-900 hover:bg-black text-white text-[11px] font-bold transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95 group/upgrade"
                          title="Upgrade your plan"
                        >
                          <Star className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Upgrade to Pro</span>
                        </Link>
                      ) : (
                        <button
                          onClick={onRetry}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-red-355 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 text-[11px] font-semibold transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95 group/retry"
                          title="Retry generation"
                        >
                          <RotateCcw className="w-3.5 h-3.5 group-hover/retry:rotate-45 transition-transform duration-200" />
                          <span>Retry generating</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        sessionId={activeSessionId || ''}
        sessionTitle={sessionTitle}
      />
    </div>
  );
};
