'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { LearningProvider, useLearning, LanguageType, LearningStyleType } from './context';
import {
  GraduationCap, Search, Settings2, Bookmark, CheckCircle, ChevronDown,
  Menu, X, User, BookOpenCheck, Globe, Compass, Send, Sparkles,
  Copy, ThumbsUp, ThumbsDown, Check
} from 'lucide-react';
import { COURSE_CATEGORIES, LESSON_DATABASE } from './courses-db';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import { chatApi } from '@/modules/chat/services/chat-api';
import { streamChatResponse } from '@/modules/chat/services/chat-stream';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';

interface CodeCellProps {
  code: string;
  className?: string;
}

const CodeCell = ({ code, className }: CodeCellProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = (className || 'code').replace('language-', '');

  const highlighted = React.useMemo(() => {
    try {
      const langObj = Prism.languages[language];
      if (langObj) {
        return Prism.highlight(code, langObj, language);
      }
      const jsLang = Prism.languages.javascript;
      if (jsLang) {
        return Prism.highlight(code, jsLang, 'javascript');
      }
    } catch (e) {
      console.error('Prism highlighting error:', e);
    }
    return code;
  }, [code, language]);

  return (
    <div className="light-code-block relative group/code my-1 rounded-[6px] overflow-hidden border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between bg-slate-100/70 px-3 py-1 border-b border-slate-200 text-[8.5px] text-slate-500 font-mono select-none">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-2.5 h-2.5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-2.5 h-2.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-2 overflow-x-auto font-mono text-[9.5px] text-slate-800 leading-normal scrollbar-none">
        <code
          className={className}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
};

const formatModuleId = (id?: string) => {
  if (!id) return '';
  const mapping: Record<string, string> = {
    python: 'Python',
    dbms: 'DBMS',
    os: 'OS',
    sysdesign: 'System Design',
  };
  return mapping[id.toLowerCase()] || id.charAt(0).toUpperCase() + id.slice(1);
};

const getFollowUpQuestions = (lessonId: string): string[] => {
  switch (lessonId) {
    case 'dbms-indexing':
      return [
        'How does B+Tree indexing differ from hash indexing?',
        'What are the disadvantages of having too many indexes?',
        'Explain clustered vs non-clustered index.'
      ];
    case 'os-concurrency':
      return [
        'What is a race condition and how do we prevent it?',
        'Explain the difference between a process and a thread.',
        'How does a mutex solve concurrency issues?'
      ];
    case 'sysdesign-hashing':
      return [
        'How do virtual nodes help in consistent hashing?',
        'What happens when a server node crashes in a hash ring?',
        'How do we partition data in consistent hashing?'
      ];
    case 'python-basics':
      return [
        'What is the difference between list and tuple in Python?',
        'Explain list comprehensions with an example.',
        'How does decorators work in Python?'
      ];
    default:
      return [
        'Can you explain this concept in more detail?',
        'Give me a real-world project example using this.',
        'What are the common interview questions for this topic?'
      ];
  }
};

function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const {
    language,
    setLanguage,
    learningStyle,
    setLearningStyle,
    accessibility,
    updateAccessibility,
    activeLessonId,
    setActiveLessonId,
    completedLessons,
    bookmarks,
    isSidebarCollapsed,
    searchQuery,
    setSearchQuery,
    onboardingData,
    isAiMentorOpen,
    setIsAiMentorOpen,
  } = useLearning();

  const [isAccessDropdownOpen, setIsAccessDropdownOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [courseOpen, setCourseOpen] = React.useState<Record<string, boolean>>({
    programming: true,
    cs: true,
    frontend: true,
    backend: true,
    devops: true,
    mobile: true,
    datascience: true,
    aiml: true,
    dsa: true,
    tools: true,
  });

  // AI Mentor Chat State (lives in layout so it persists across all views)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I am your Mentor AI assistant. I can help explain concepts, generate analogies, suggest interview questions, or answer anything about your current lesson. Ask me anything!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session when panel opens
  useEffect(() => {
    if (isAiMentorOpen && !sessionId) {
      const initChat = async () => {
        try {
          const sessions = await chatApi.listSessions();
          const existing = sessions.find((s: any) => s.role_type === 'learning');
          if (existing) {
            setSessionId(existing.id);
            const details = await chatApi.getSessionDetails(existing.id);
            if (details?.messages?.length > 0) {
              setChatMessages(details.messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })));
            }
          } else {
            const newSession = await chatApi.createSession({ role: 'learning', role_type: 'learning', title: 'Learning Mentor AI', model_name: 'gemini-2.5-flash', temperature: 0.7 });
            setSessionId(newSession.id);
          }
        } catch (err) { console.error('Failed to init AI chat session', err); }
      };
      void initChat();
    }
  }, [isAiMentorOpen, sessionId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamedText]);

  const handleSendAiMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim() || isStreaming) return;

    // Clear input field and set loading/streaming state
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: promptToSend }]);
    setIsStreaming(true);

    const languageInstruction = language === 'Telugu + English Mixed'
      ? 'IMPORTANT: Respond in Telugu-English mixed language (Hinglish/WhatsApp-style code-switching, writing Telugu words in Latin/English alphabets, NOT Telugu script). Example: "naku easy ga ardam ayyela machine learning ante ento cheppu - basically machine learning ante computer ki data tho run avvadam...". Do NOT use Telugu script characters (like ల, క, ప etc). Use only English script/alphabets.'
      : `IMPORTANT: Respond in ${language} where appropriate.`;

    const enrichedPrompt = `[CONTEXT] You are the AI Learning Mentor. Active Lesson: ${activeLesson?.title || 'None'}. Preferred Language: ${language}. Explanation Style: ${learningStyle}. ${languageInstruction} User: ${promptToSend}`;

    try {
      if (sessionId) {
        let buffer = '';
        await streamChatResponse(sessionId, enrichedPrompt, {
          onChunk: (chunk) => { buffer += chunk; setStreamedText(buffer); },
          onError: (err) => { 
            setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err}` }]); 
            setIsStreaming(false); 
          }
        });
        setChatMessages((prev) => [...prev, { role: 'assistant', content: buffer }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Session not initialized. Please try again.' }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Unable to reach AI. Please check your connection.' }]);
    } finally {
      setIsStreaming(false);
      setStreamedText('');
    }
  };



  const toggleCourseCollapse = (courseId: string) => {
    setCourseOpen((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const activeLesson = LESSON_DATABASE[activeLessonId] || LESSON_DATABASE['dbms-indexing'];

  // Global search filtering
  const filteredCategories = COURSE_CATEGORIES.map((cat) => {
    const matchedModules = cat.modules.map((mod) => {
      const matchedLessons = mod.lessons.filter((l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...mod, lessons: matchedLessons };
    }).filter((mod) => mod.lessons.length > 0);

    return { ...cat, modules: matchedModules };
  }).filter((cat) => cat.modules.length > 0);

  // Quick stats
  const totalLessons = Object.keys(LESSON_DATABASE).length;
  const completedCount = completedLessons.length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const explanationStyles: LearningStyleType[] = [
    'Theory & Explanations',
    'Code & Practical Examples Heavy',
    'Interview Prep & Leetcode Focus',
    'Project-Based Building',
    'Visual Learning',
  ];

  const languages: LanguageType[] = [
    'Simple English',
    'Professional English',
    'Beginner English',
    'Interview English',
    'Technical English',
    'Telugu',
    'Telugu + English Mixed',
    'Tamil',
    'Hindi',
    'Kannada',
    'Malayalam',
    'Marathi',
    'Bengali',
    'Gujarati',
    'Punjabi',
  ];

  return (
    <div
      className={`h-screen w-screen flex flex-col font-sans transition-colors duration-200 select-none overflow-hidden ${
        accessibility.highContrast
          ? 'bg-black text-white border-white [&_*]:border-white'
          : 'bg-[#faf9f6] text-slate-800'
      }`}
    >
      {/* Top Header */}
      {!accessibility.focusMode && (
        <header
          className={`sticky top-0 z-40 h-13 px-4 md:px-6 flex items-center justify-between transition-colors shadow-xs ${
            accessibility.highContrast ? 'bg-black' : 'bg-white/95 backdrop-blur-md'
          }`}
        >
          {/* Logo & Course Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded hover:bg-slate-100"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Link
              href="/mentors/learning"
              onClick={() => setActiveLessonId('')}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-transparent border border-slate-250 flex items-center justify-center text-slate-850 transition-transform group-hover:scale-102">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11.5px] font-bold text-slate-900 tracking-wide block leading-none">
                  Learning Mentor
                </span>
                <span className="text-[9px] text-slate-500 font-semibold block tracking-wide mt-0.5">
                  Mentor AI OS Workspace
                </span>
              </div>
            </Link>

            {onboardingData && (
              <>
                <span className="hidden md:inline text-slate-300">|</span>
                <div className="hidden md:flex flex-col">
                  <span className="text-[9.5px] font-semibold text-slate-500 tracking-wide leading-none">
                    Target Goal
                  </span>
                  <span className="text-[10px] font-semibold text-slate-700 leading-normal mt-0.5 max-w-[200px] truncate">
                    {onboardingData.targetRole || onboardingData.careerGoal || 'Software Engineer'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Breadcrumb / Lesson Progress */}
          {onboardingData && activeLessonId && (
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-normal tracking-wide text-slate-900">
              <span>{formatModuleId(activeLesson?.moduleId)}</span>
              <span>/</span>
              <span className="text-slate-900 truncate max-w-[150px]">{activeLesson?.title}</span>
            </div>
          )}

          {/* Global Search Input */}
          <div className="hidden md:flex items-center relative w-80 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search concepts or courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-1.5 pl-8 pr-3 text-[10.5px] font-normal rounded-[6px] outline-none transition-all ${
                accessibility.highContrast
                  ? 'bg-black border border-white text-white focus:ring-1 focus:ring-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageType)}
                className={`w-40 py-1.5 pl-8 pr-6 text-[10px] font-semibold tracking-wide border rounded-[6px] appearance-none cursor-pointer outline-none transition-all truncate ${
                  accessibility.highContrast
                    ? 'bg-black border-white text-white'
                    : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 focus:border-emerald-600'
                }`}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Explanation Style Selector */}
            <div className="relative flex items-center hidden sm:flex">
              <Compass className="w-3.5 h-3.5 absolute left-2.5 text-slate-505 pointer-events-none" />
              <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value as LearningStyleType)}
                className={`w-40 py-1.5 pl-8 pr-6 text-[10px] font-semibold tracking-wide border rounded-[6px] appearance-none cursor-pointer outline-none transition-all truncate ${
                  accessibility.highContrast
                    ? 'bg-black border-white text-white'
                    : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 focus:border-emerald-600'
                }`}
              >
                {explanationStyles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Accessibility Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setIsAccessDropdownOpen(!isAccessDropdownOpen)}
                title="Accessibility controls"
                className={`p-1.5 border rounded-[6px] transition-colors cursor-pointer ${
                  isAccessDropdownOpen
                    ? 'bg-emerald-50 border-emerald-350 text-emerald-700'
                    : accessibility.highContrast
                    ? 'bg-black border-white text-white'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Settings2 className="w-4 h-4" />
              </button>

              {isAccessDropdownOpen && (
                <div
                  className={`absolute right-0 mt-1.5 w-60 rounded-[6px] border p-3.5 shadow-md z-50 ${
                    accessibility.highContrast ? 'bg-black border-white text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-slate-500 tracking-wide block border-b pb-1.5 mb-2.5">
                    Accessibility Settings
                  </span>

                  <div className="space-y-3">
                    {/* Focus Mode */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[10.5px] font-bold">Focus Mode (Hide Shell)</span>
                      <input
                        type="checkbox"
                        checked={accessibility.focusMode}
                        onChange={(e) => updateAccessibility({ focusMode: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>

                    {/* Reading Mode */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[10.5px] font-bold">Reading Optimized Layout</span>
                      <input
                        type="checkbox"
                        checked={accessibility.readingMode}
                        onChange={(e) => updateAccessibility({ readingMode: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>

                    {/* High Contrast Mode */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-[10.5px] font-bold">High Contrast Mode</span>
                      <input
                        type="checkbox"
                        checked={accessibility.highContrast}
                        onChange={(e) => updateAccessibility({ highContrast: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </label>

                    {/* Font Size Adjust */}
                    <div className="space-y-1.5">
                      <span className="text-[10.5px] font-bold block">Text Size Adjustment</span>
                      <div className="grid grid-cols-4 gap-1">
                        {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                          <button
                            key={sz}
                            onClick={() => updateAccessibility({ fontSize: sz })}
                            className={`py-1 border rounded-[4px] text-[10px] font-bold uppercase transition-all cursor-pointer ${
                              accessibility.fontSize === sz
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : accessibility.highContrast
                                ? 'bg-black border-white text-white hover:bg-white/10'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Picture */}
            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-600" />
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Body */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Left Sidebar (Desktop) */}
        {!accessibility.focusMode && !isSidebarCollapsed && onboardingData && (
          <aside
            className={`hidden md:flex flex-col w-56 shrink-0 overflow-hidden transition-colors ${
              accessibility.highContrast ? 'bg-black' : 'bg-white'
            }`}
          >
            {/* Sidebar Header Stats */}
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-[9px] font-medium text-slate-500 tracking-wide">
                <span>Course Completion</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9.5px] font-normal text-slate-500">
                <span className="flex items-center gap-1">
                  <BookOpenCheck className="w-3 h-3 text-emerald-600" /> {completedCount} Done
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-amber-500 fill-current" /> {bookmarks.length} Bookmarks
                </span>
              </div>
            </div>

            {/* Course Navigation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 scrollbar-thin">
              {filteredCategories.map((category) => (
                <div key={category.id} className="space-y-1">
                  <button
                    onClick={() => toggleCourseCollapse(category.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[9.5px] font-semibold tracking-wide text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <span>{category.name}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${courseOpen[category.id] ? '' : '-rotate-90'}`}
                    />
                  </button>

                  {courseOpen[category.id] && (
                    <div className="space-y-2 pl-1 border-l border-slate-100 ml-1.5 mt-1">
                      {category.modules.map((module) => (
                        <div key={module.id} className="space-y-1">
                          <span className="block px-2 text-[9px] font-normal text-slate-500 tracking-wide leading-normal">
                            {module.name}
                          </span>
                          <div className="space-y-0.5">
                            {module.lessons.map((lesson) => {
                              const isActive = activeLessonId === lesson.id;
                              const isLessonCompleted = completedLessons.includes(lesson.id);
                              const isBookmarked = bookmarks.includes(lesson.id);

                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => setActiveLessonId(lesson.id)}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] text-left text-[10.5px] font-normal transition-colors group cursor-pointer ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-850 font-medium border-l-2 border-emerald-600'
                                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {isLessonCompleted ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 fill-emerald-50" />
                                    ) : (
                                      <span className="w-3.5 h-3.5 rounded-full border border-slate-350 flex items-center justify-center shrink-0 text-[8px] font-bold text-slate-400 group-hover:border-emerald-600">
                                        •
                                      </span>
                                    )}
                                    <span className="truncate">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isBookmarked && (
                                      <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Quick links & bookmarks category */}
              {bookmarks.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="block px-2 text-[9.5px] font-normal text-slate-500 tracking-wide mb-1">
                    Starred Bookmarks
                  </span>
                  <div className="space-y-0.5">
                    {bookmarks.map((bId) => {
                      const l = LESSON_DATABASE[bId];
                      if (!l) return null;
                      return (
                        <button
                          key={bId}
                          onClick={() => setActiveLessonId(bId)}
                          className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[10px] text-slate-600 hover:bg-slate-50 truncate cursor-pointer font-normal"
                        >
                          <Bookmark className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                          <span className="truncate">{l.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center Learning Workspace Container */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto flex flex-col relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex-1">
            {children}
          </div>
        </main>

        {/* ==================== AI MENTOR RIGHT SIDEBAR ==================== */}
        {isAiMentorOpen && (
          <aside className="hidden md:flex flex-col w-80 xl:w-88 shrink-0 bg-white h-full overflow-hidden border-l border-slate-100">
            {/* Sidebar Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <Image src="/mentorai-symbol-only.svg" alt="MentorAI" width={16} height={16} className="w-4 h-4 object-contain" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-900 block leading-none">Mentor Ai</span>
                  <span className="text-[8.5px] text-slate-400 font-normal block mt-0.5 tracking-wide">
                    {activeLessonId ? `On: ${LESSON_DATABASE[activeLessonId]?.title || '—'}` : 'Learning assistant'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-full text-[7.5px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 tracking-wide">
                  Rag Active
                </span>
                <button
                  onClick={() => setIsAiMentorOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick context chips */}
            <div className="px-3 py-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => handleSendAiMessage('Summarize the key concepts of this lesson')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-medium rounded-full shrink-0 cursor-pointer whitespace-nowrap transition-colors"
              >
                Summarize Lesson
              </button>
              <button
                onClick={() => handleSendAiMessage('Explain using a simple real-world analogy')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-medium rounded-full shrink-0 cursor-pointer whitespace-nowrap transition-colors"
              >
                Give Analogy
              </button>
              <button
                onClick={() => handleSendAiMessage('Generate 3 interview questions on this topic')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-medium rounded-full shrink-0 cursor-pointer whitespace-nowrap transition-colors"
              >
                Interview Qs
              </button>
              <button
                onClick={() => handleSendAiMessage(`Explain this topic in ${language}`)}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-medium rounded-full shrink-0 cursor-pointer whitespace-nowrap transition-colors"
              >
                Translate
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 mr-1.5">
                      <Image src="/mentorai-symbol-only.svg" alt="AI" width={12} height={12} className="w-3 h-3 object-contain" />
                    </div>
                  )}
                  <div className="max-w-[82%] flex flex-col gap-0.5">
                    <div
                      className={`text-[10.5px] font-normal ${
                        msg.role === 'user'
                          ? 'bg-slate-900 text-white rounded-tr-none px-3 py-2.5 rounded-[6px] whitespace-pre-wrap leading-relaxed'
                          : 'bg-transparent border-none text-slate-800 px-1 py-1 text-justify whitespace-normal leading-normal'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="text-[10.5px] leading-normal text-slate-800 text-justify">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-0.5 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-0.5 space-y-0.5 [&_p]:mb-0 [&_li]:mb-0">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-0.5 space-y-0.5 [&_p]:mb-0 [&_li]:mb-0">{children}</ol>,
                              li: ({ children }) => <li className="text-slate-800">{children}</li>,
                              code: ({ className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const isInline = !match;
                                if (isInline) {
                                  return (
                                    <code className="bg-slate-100 text-rose-600 px-1 py-0.5 rounded-[4px] text-[10px] font-mono font-medium" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <CodeCell code={String(children).replace(/\n$/, '')} className={className} />
                                );
                              },
                              table: ({ children }) => <table className="w-full text-left border-collapse border border-slate-200 my-1 rounded-[6px] overflow-hidden text-[10px] shadow-xs">{children}</table>,
                              th: ({ children }) => <th className="bg-slate-50 p-1.5 font-medium border border-slate-200 text-slate-800">{children}</th>,
                              td: ({ children }) => <td className="p-1.5 border border-slate-200 text-slate-655 bg-white">{children}</td>,
                              h1: ({ children }) => <h1 className="text-[11px] font-bold text-slate-900 mb-0.5 mt-1 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-[10.5px] font-bold text-slate-900 mb-0.5 mt-0.5 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-[10px] font-bold text-slate-900 mb-0.5 mt-0.5 first:mt-0">{children}</h3>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-300 pl-2.5 my-0.5 italic text-slate-500">{children}</blockquote>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mt-0.5 px-1 text-slate-400">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            setCopiedIndex(idx);
                            setTimeout(() => setCopiedIndex(null), 2000);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                          title="Like"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                          title="Dislike"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'assistant' && !isStreaming && (
                <div className="mt-2 space-y-1 px-1 ml-6.5">
                  <span className="text-[8.5px] font-semibold text-slate-400 tracking-wide block">
                    Suggested Follow-up Questions
                  </span>
                  <div className="flex flex-col gap-1">
                    {getFollowUpQuestions(activeLessonId).map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSendAiMessage(q)}
                        className="text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-normal rounded-[6px] cursor-pointer transition-colors hover:border-slate-350"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isStreaming && streamedText && (
                <div className="flex justify-start">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 mr-1.5">
                    <Image src="/mentorai-symbol-only.svg" alt="AI" width={12} height={12} className="w-3 h-3 object-contain" />
                  </div>
                  <div className="max-w-[82%] flex flex-col gap-0.5">
                    <div className="text-[10.5px] leading-normal text-slate-800 text-justify px-1 py-1 relative">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-0.5 last:mb-0 inline">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-0.5 space-y-0.5 [&_p]:mb-0 [&_li]:mb-0">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-0.5 space-y-0.5 [&_p]:mb-0 [&_li]:mb-0">{children}</ol>,
                          li: ({ children }) => <li className="text-slate-800">{children}</li>,
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match;
                            if (isInline) {
                              return (
                                <code className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-medium" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <CodeCell code={String(children).replace(/\n$/, '')} className={className} />
                            );
                          },
                          table: ({ children }) => <table className="w-full text-left border-collapse border border-slate-200 my-1 rounded-[6px] overflow-hidden text-[10px] shadow-xs">{children}</table>,
                          th: ({ children }) => <th className="bg-slate-50 p-1.5 font-medium border border-slate-200 text-slate-800">{children}</th>,
                          td: ({ children }) => <td className="p-1.5 border border-slate-200 text-slate-655 bg-white">{children}</td>,
                          h1: ({ children }) => <h1 className="text-[11px] font-bold text-slate-900 mb-0.5 mt-1 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-[10.5px] font-bold text-slate-900 mb-0.5 mt-0.5 first:mt-0">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-[10px] font-bold text-slate-900 mb-0.5 mt-0.5 first:mt-0">{children}</h3>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-300 pl-2.5 my-0.5 italic text-slate-500">{children}</blockquote>,
                        }}
                      >
                        {streamedText}
                      </ReactMarkdown>
                      <span className="inline-block w-1.5 h-3 ml-0.5 bg-slate-400 animate-pulse rounded-sm align-middle" />
                    </div>
                  </div>
                </div>
              )}

              {isStreaming && !streamedText && (
                <div className="flex justify-start items-center gap-1.5 pl-7">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-100 bg-white shrink-0">
              <div className="flex gap-1.5 items-center bg-slate-50 border border-slate-200 rounded-[6px] px-2.5 py-1.5 focus-within:border-slate-400 focus-within:bg-white transition-colors">
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendAiMessage(); }}
                  className="flex-1 bg-transparent text-[10.5px] font-normal text-slate-800 placeholder-slate-400 outline-none"
                />
                <button
                  onClick={() => handleSendAiMessage()}
                  disabled={isStreaming || !chatInput.trim()}
                  className="w-6 h-6 rounded-[4px] bg-slate-900 hover:bg-black flex items-center justify-center cursor-pointer disabled:opacity-40 transition-colors shrink-0"
                >
                  <Send className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Focus Mode shortcut tip */}
      {accessibility.focusMode && (
        <button
          onClick={() => updateAccessibility({ focusMode: false })}
          className="fixed bottom-4 left-4 z-50 bg-slate-900/90 text-white border border-slate-800 text-[10px] py-1.5 px-3 rounded-[6px] hover:bg-slate-950 font-medium tracking-wide flex items-center gap-1.5 transition-opacity"
        >
          <X className="w-3.5 h-3.5" /> Exit focus mode
        </button>
      )}

      {/* Persistent AI Mentor Toggle Button — always visible */}
      {!isAiMentorOpen && onboardingData && (
        <button
          onClick={() => setIsAiMentorOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
          title="Open AI Mentor"
        >
          <Image src="/mentorai-symbol-only.svg" alt="Mentor AI" width={22} height={22} className="w-5.5 h-5.5 object-contain" />
        </button>
      )}
    </div>
  );
}

export default function LearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen justify-center items-center bg-[#faf9f6]">
          <div className="flex flex-col items-center gap-2">
            <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
            <p className="text-slate-500 text-xs font-semibold">Loading Learning Workspace...</p>
          </div>
        </div>
      }
    >
      <LearningProvider>
        <LayoutShell>{children}</LayoutShell>
      </LearningProvider>
    </Suspense>
  );
}
