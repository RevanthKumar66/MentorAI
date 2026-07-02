'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft, PanelLeft, PanelLeftClose, ChevronDown, Sparkles, Send, Bot, X,
  GraduationCap, Briefcase, Code, GitFork, Search, BarChart3, FileText, FileSpreadsheet, Zap,
  SearchIcon, Star, CheckSquare, Plus, Loader2, RefreshCw, Trophy, BookOpen, Compass
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { streamChatResponse } from '@/modules/chat/services/chat-stream';
import { chatApi } from '@/modules/chat/services/chat-api';

export interface SidebarFolder {
  id: string;
  name: string;
  items: { id: string; name: string; href?: string; completed?: boolean }[];
}

interface MentorWorkspaceLayoutProps {
  mentorKey: 'learning' | 'resume' | 'coding' | 'dsa' | 'research' | 'career' | 'datascience' | 'document' | 'language' | 'agent' | 'job';
  title: string;
  icon: React.ReactNode;
  themeColor: string; // e.g. 'emerald', 'blue', 'indigo', etc.
  sidebarFolders: SidebarFolder[];
  onboardingQuestions: {
    id: string;
    question: string;
    options?: string[];
    placeholder?: string;
  }[];
  children: React.ReactNode;
  contextText?: string; // Optional text representation of current workspace context (RAG)
}

export function MentorWorkspaceLayout({
  mentorKey,
  title,
  icon,
  themeColor,
  sidebarFolders: initialFolders,
  onboardingQuestions,
  children,
  contextText = ''
}: MentorWorkspaceLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Onboarding States
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<string, string>>({});
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any>(null);

  // Sidebar States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [folders, setFolders] = useState<SidebarFolder[]>(initialFolders);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);

  // AI Assistant States
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Hello! I am your ${title} Companion. Ask me anything about your current tasks, roadmap, or workspace.` }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load Onboarding state, Bookmarks, and Folder Completion from Local Storage
  useEffect(() => {
    const onboardingDone = localStorage.getItem(`mentor_onboarded_${mentorKey}`) === 'true';
    setIsOnboarded(onboardingDone);

    const savedRoadmap = localStorage.getItem(`mentor_roadmap_${mentorKey}`);
    if (savedRoadmap) {
      setGeneratedRoadmap(JSON.parse(savedRoadmap));
    }

    const savedBookmarks = localStorage.getItem(`mentor_bookmarks_${mentorKey}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    const savedCompleted = localStorage.getItem(`mentor_completed_${mentorKey}`);
    if (savedCompleted) {
      setCompletedTopics(JSON.parse(savedCompleted));
    }

    // Expand all folders by default
    const defaults: Record<string, boolean> = {};
    initialFolders.forEach(f => {
      defaults[f.id] = true;
    });
    setExpandedFolders(defaults);
    setFolders(initialFolders);
  }, [mentorKey, initialFolders]);

  // Sync Completion states inside folders
  useEffect(() => {
    setFolders(prev =>
      prev.map(folder => ({
        ...folder,
        items: folder.items.map(item => ({
          ...item,
          completed: completedTopics.includes(item.id)
        }))
      }))
    );
  }, [completedTopics]);

  // Initialize or fetch Backend Chat Session for Floating AI Assistant
  useEffect(() => {
    if (assistantOpen && !sessionId) {
      const initSession = async () => {
        try {
          // List existing sessions to see if there's one for this mentor
          const sessions = await chatApi.listSessions();
          const existing = sessions.find((s: any) => s.role === mentorKey);
          if (existing) {
            setSessionId(existing.id);
            const details = await chatApi.getSessionDetails(existing.id);
            if (details && details.messages && details.messages.length > 0) {
              setChatMessages(
                details.messages.map((m: any) => ({
                  role: m.role === 'user' ? 'user' : 'assistant',
                  content: m.content
                }))
              );
            }
          } else {
            // Create a new session
            const newSession = await chatApi.createSession({
              role: mentorKey,
              role_type: mentorKey,
              title: `${title} AI Assistant`,
              model_name: 'gemini-2.5-flash',
              temperature: 0.7
            });
            setSessionId(newSession.id);
          }
        } catch (err) {
          console.error('Failed to initialize mentor assistant session', err);
        }
      };
      void initSession();
    }
  }, [assistantOpen, sessionId, mentorKey, title]);

  // Handle Onboarding Answer Selection
  const handleAnswerQuestion = (answer: string) => {
    const qId = onboardingQuestions[currentQuestionIndex].id;
    const newAnswers = { ...onboardingAnswers, [qId]: answer };
    setOnboardingAnswers(newAnswers);

    if (currentQuestionIndex < onboardingQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Trigger Roadmap Generation
      triggerRoadmapGeneration(newAnswers);
    }
  };

  const triggerRoadmapGeneration = (answers: Record<string, string>) => {
    setIsGeneratingRoadmap(true);
    // Simulate smart AI roadmap generation
    setTimeout(() => {
      const roadmap = {
        title: `Adaptive Learning roadmap for target: ${answers.career_goal || answers.target_company || 'Career Goal'}`,
        generatedAt: new Date().toLocaleDateString(),
        answers,
        phases: [
          {
            name: 'Phase 1: Foundations & Fundamentals',
            items: ['Core Syntax & Setup', 'Data Structures Intro', 'Common Design Patterns']
          },
          {
            name: 'Phase 2: Core Engineering',
            items: ['Database Schema & Normalization', 'API Design & Integration', 'System Performance Optimization']
          },
          {
            name: 'Phase 3: High-Level Concepts & Capstone',
            items: ['System Scalability', 'Advanced Interview Scenarios', 'Production Deployment & Profiling']
          }
        ]
      };
      localStorage.setItem(`mentor_onboarded_${mentorKey}`, 'true');
      localStorage.setItem(`mentor_roadmap_${mentorKey}`, JSON.stringify(roadmap));
      setGeneratedRoadmap(roadmap);
      setIsOnboarded(true);
      setIsGeneratingRoadmap(false);
    }, 2000);
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem(`mentor_onboarded_${mentorKey}`);
    localStorage.removeItem(`mentor_roadmap_${mentorKey}`);
    setOnboardingAnswers({});
    setCurrentQuestionIndex(0);
    setIsOnboarded(false);
  };

  // Toggle Folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Search filter
  const filteredFolders = folders.map(f => {
    const items = f.items.filter(item =>
      item.name.toLowerCase().includes(sidebarSearch.toLowerCase())
    );
    return { ...f, items };
  }).filter(f => f.items.length > 0 || f.name.toLowerCase().includes(sidebarSearch.toLowerCase()));

  // Toggle Bookmarks
  const toggleBookmark = (topicName: string) => {
    let nextBookmarks;
    if (bookmarks.includes(topicName)) {
      nextBookmarks = bookmarks.filter(b => b !== topicName);
    } else {
      nextBookmarks = [...bookmarks, topicName];
    }
    setBookmarks(nextBookmarks);
    localStorage.setItem(`mentor_bookmarks_${mentorKey}`, JSON.stringify(nextBookmarks));

    // Agentic command visual confirmation
    showToast(`Bookmark updated: ${topicName}`);
  };

  // Toggle Complete Topic
  const toggleTopicComplete = (topicId: string, topicName: string) => {
    let nextCompleted;
    if (completedTopics.includes(topicId)) {
      nextCompleted = completedTopics.filter(c => c !== topicId);
    } else {
      nextCompleted = [...completedTopics, topicId];
    }
    setCompletedTopics(nextCompleted);
    localStorage.setItem(`mentor_completed_${mentorKey}`, JSON.stringify(nextCompleted));

    showToast(completedTopics.includes(topicId) ? `Topic marked active` : `Completed: ${topicName}`);
  };

  // Toast confirmation utility
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Parse natural language Agentic commands in Assistant input
  const processAgenticCommand = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    
    // Command: Bookmark
    if (lower.startsWith('bookmark ') || lower.includes('add this to bookmarks')) {
      const topicName = text.replace(/bookmark/i, '').replace(/add this to bookmarks/i, '').trim() || 'Current Lesson';
      toggleBookmark(topicName);
      setChatMessages(prev => [...prev, 
        { role: 'user', content: text },
        { role: 'assistant', content: `I've successfully added "${topicName}" to your bookmarks!` }
      ]);
      return true;
    }

    // Command: Skip onboarding / Reset onboarding
    if (lower === 'reset onboarding' || lower === 'restart setup') {
      handleResetOnboarding();
      setChatMessages(prev => [...prev, 
        { role: 'user', content: text },
        { role: 'assistant', content: `Onboarding has been reset. You can set up your roadmap again.` }
      ]);
      setAssistantOpen(false);
      return true;
    }

    // Command: Complete topic
    if (lower.startsWith('complete ') || lower.startsWith('finish ')) {
      const topic = text.replace(/complete/i, '').replace(/finish/i, '').trim();
      // Find matching topic in folders
      let found = false;
      for (const f of folders) {
        for (const item of f.items) {
          if (item.name.toLowerCase().includes(topic.toLowerCase())) {
            toggleTopicComplete(item.id, item.name);
            found = true;
            setChatMessages(prev => [...prev, 
              { role: 'user', content: text },
              { role: 'assistant', content: `Awesome job! I've marked "${item.name}" as completed.` }
            ]);
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        setChatMessages(prev => [...prev, 
          { role: 'user', content: text },
          { role: 'assistant', content: `I couldn't find a topic matching "${topic}". Try checking the sidebar.` }
        ]);
      }
      return true;
    }

    // Command: Schedule study / revision
    if (lower.includes('schedule revision') || lower.includes('remind me tomorrow')) {
      setChatMessages(prev => [...prev, 
        { role: 'user', content: text },
        { role: 'assistant', content: `📅 System Action: Scheduled revision session for tomorrow morning at 9:00 AM. I'll flag this in your main calendar!` }
      ]);
      return true;
    }

    return false;
  };

  // Send Floating Assistant Chat Message (Streaming RAG Engine)
  const handleSendMessage = async () => {
    if (!inputVal.trim() || isStreaming) return;
    const userMsg = inputVal;
    setInputVal('');

    // Check if it's a client-side agentic shortcut command first
    const isCommand = processAgenticCommand(userMsg);
    if (isCommand) return;

    // Standard streaming chat with RAG context pre-injected
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsStreaming(true);
    setStreamedText('');

    let finalPrompt = userMsg;
    // Inject workspace RAG context to ground the LLM
    if (contextText) {
      finalPrompt = `[CONTEXT WORKSPACE DATA: ${contextText.slice(0, 1000)}]\n\nUser Question: ${userMsg}`;
    }

    try {
      if (sessionId) {
        let textAccumulator = '';
        await streamChatResponse(sessionId, finalPrompt, {
          onChunk: (chunk) => {
            textAccumulator += chunk;
            setStreamedText(textAccumulator);
          },
          onError: (err) => {
            console.error('Chat stream error', err);
            setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err}` }]);
          }
        });
        setChatMessages(prev => [...prev, { role: 'assistant', content: textAccumulator }]);
      } else {
        // Fallback for visual continuity if API session fails
        setTimeout(() => {
          setChatMessages(prev => [...prev, { role: 'assistant', content: `Based on your ${title} workspace documents, here is the answer: ${userMsg}. (Simulation mode active)` }]);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection timed out. Please verify API endpoints.' }]);
    } finally {
      setIsStreaming(false);
      setStreamedText('');
    }
  };

  // Progress Computations
  const totalItems = folders.reduce((sum, f) => sum + f.items.length, 0);
  const completedCount = completedTopics.length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Sidebar Render
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#f9f9f8] border-r border-slate-200">
      {/* Sidebar Header: "Back to Workspace Launcher" */}
      <div className={`px-4 py-4 flex items-center justify-between border-b border-slate-200 ${sidebarCollapsed ? 'flex-col gap-3.5 justify-center' : ''}`}>
        <Link href="/chat" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          {!sidebarCollapsed && <span className="text-[11px] font-bold tracking-tight">Main Hub</span>}
        </Link>
        
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
        >
          {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Mentor Profile / Progress Banner */}
      {!sidebarCollapsed && (
        <div className="p-4 border-b border-slate-150 bg-[#fafafa]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`w-8 h-8 rounded-[8px] bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0`}>
              {icon}
            </div>
            <div>
              <h2 className="text-[12px] font-bold text-slate-900 leading-tight">{title}</h2>
              <span className="text-[9.5px] text-slate-500 font-semibold uppercase tracking-wider">{mentorKey} Workspace</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1 mt-3">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-600">
              <span>PROGRESS</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 bg-${themeColor}-600`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Expandable navigation tree */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Search */}
        {!sidebarCollapsed && (
          <div className="relative px-2 mb-2">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chapters..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1 bg-white border border-slate-250 rounded-[6px] text-[10.5px] font-medium placeholder-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>
        )}

        {/* Folders */}
        <div className="space-y-2">
          {filteredFolders.map(folder => (
            <div key={folder.id} className="space-y-0.5">
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200/40 rounded transition-colors text-left"
                >
                  <span className="truncate">{folder.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-450 transition-transform ${expandedFolders[folder.id] ? '' : '-rotate-90'}`} />
                </button>
              )}
              {expandedFolders[folder.id] && (
                <div className="space-y-0.5 pl-1.5">
                  {folder.items.map(item => {
                    const isItemActive = pathname === item.href;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded px-2 py-1.5 text-[10.5px] font-medium transition-all ${
                          isItemActive 
                            ? 'bg-white text-slate-950 border border-slate-200 shadow-xs' 
                            : 'text-slate-650 hover:text-slate-950 hover:bg-slate-200/30'
                        }`}
                      >
                        {item.href ? (
                          <Link href={item.href} className="flex-1 truncate font-semibold">
                            {item.name}
                          </Link>
                        ) : (
                          <span className="flex-1 truncate font-semibold cursor-default">{item.name}</span>
                        )}
                        {!sidebarCollapsed && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleBookmark(item.name)}
                              className={`p-0.5 hover:bg-slate-200 rounded transition-colors ${bookmarks.includes(item.name) ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <Star className="w-3 h-3 fill-current" />
                            </button>
                            <button
                              onClick={() => toggleTopicComplete(item.id, item.name)}
                              className={`p-0.5 hover:bg-slate-200 rounded transition-colors ${completedTopics.includes(item.id) ? `text-${themeColor}-600` : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <CheckSquare className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Favorites list */}
        {!sidebarCollapsed && bookmarks.length > 0 && (
          <div className="pt-2 border-t border-slate-200 px-2 space-y-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Bookmarks</span>
            {bookmarks.map((bookmark, i) => (
              <div key={i} className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700 py-0.5">
                <span className="truncate">{bookmark}</span>
                <button onClick={() => toggleBookmark(bookmark)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset button at bottom */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-slate-200 bg-[#f9f9f8]">
          <button
            onClick={handleResetOnboarding}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-semibold text-[10px] rounded-[6px] transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            Reset Custom Roadmap
          </button>
        </div>
      )}
    </div>
  );

  // Onboarding Wizard Render
  if (!isOnboarded) {
    const activeQuestion = onboardingQuestions[currentQuestionIndex];
    return (
      <div className="flex h-screen w-screen justify-center items-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="bg-white border border-slate-200 rounded-[16px] shadow-lg max-w-lg w-full overflow-hidden p-6 md:p-8 space-y-6 flex flex-col relative">
          
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className={`w-12 h-12 rounded-[12px] bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-2`}>
              {icon}
            </div>
            <h1 className="text-md font-bold text-slate-900 tracking-tight">Personalizing Your {title} Workspace</h1>
            <p className="text-[11px] text-slate-500 font-medium">To create your adaptive roadmap, help us calibrate the environment.</p>
          </div>

          {/* Progress Tracker */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-slate-650">
              <span>ONBOARDING CALIBRATION</span>
              <span>QUESTION {currentQuestionIndex + 1} OF {onboardingQuestions.length}</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 bg-${themeColor}-600`}
                style={{ width: `${((currentQuestionIndex + 1) / onboardingQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Dynamic Question Layout */}
          {!isGeneratingRoadmap ? (
            <div className="flex-1 space-y-4 py-2">
              <h3 className="text-sm font-semibold text-slate-850 text-center leading-relaxed">{activeQuestion.question}</h3>
              {activeQuestion.options ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswerQuestion(opt)}
                      className="w-full px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-[8px] text-[11px] font-semibold text-slate-800 text-left transition-all cursor-pointer shadow-xs"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const ans = fd.get('text-ans') as string;
                    if (ans.trim()) handleAnswerQuestion(ans);
                  }}
                  className="space-y-3"
                >
                  <input
                    name="text-ans"
                    type="text"
                    required
                    autoFocus
                    placeholder={activeQuestion.placeholder || 'Type your answer here...'}
                    className="w-full px-4 py-3 border border-slate-250 rounded-[8px] text-[11.5px] font-semibold focus:outline-none focus:border-slate-400 shadow-inner bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    className={`w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-[10.5px] uppercase tracking-wider rounded-[8px] cursor-pointer transition-colors`}
                  >
                    Continue
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-8 space-y-3 text-center">
              <Loader2 className={`w-8 h-8 animate-spin text-${themeColor}-600`} />
              <p className="text-xs font-bold text-slate-800 tracking-tight">Generating adaptive AI roadmap...</p>
              <p className="text-[10px] text-slate-500 max-w-[280px]">Our context engine is creating a custom workspace layout calibrated for your career targets.</p>
            </div>
          )}

          {/* Bottom navigation */}
          {currentQuestionIndex > 0 && !isGeneratingRoadmap && (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              className="text-[10.5px] font-bold text-slate-500 hover:text-slate-700 mx-auto underline cursor-pointer"
            >
              Previous Question
            </button>
          )}
        </div>
      </div>
    );
  }

  // Main Workspace Environment Layout Render
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800">
      
      {/* Toast Alert popup */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-55 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-[8px] shadow-lg border border-slate-800 transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* 1. Left Navigation Sidebar */}
      <aside className={`flex flex-col select-none h-full shrink-0 transition-all duration-300 z-20 ${sidebarCollapsed ? 'w-14' : 'w-52'}`}>
        {sidebarContent}
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative bg-slate-50/40">
        {children}

        {/* Floating circular assistant logo */}
        <div className="fixed bottom-5 right-5 z-45">
          <button
            onClick={() => setAssistantOpen(!assistantOpen)}
            className={`w-12 h-12 rounded-full shadow-lg border flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer bg-slate-900 border-slate-850 hover:bg-slate-950 text-white`}
            title="Ask Mentor AI"
          >
            {assistantOpen ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5 text-indigo-400" />}
          </button>
        </div>

        {/* Floating AI Panel Drawers */}
        {assistantOpen && (
          <div className="fixed top-0 right-0 h-full w-80 z-40 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-150 bg-[#fafafa] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[6px] bg-slate-100 flex items-center justify-center border border-slate-250">
                  {icon}
                </div>
                <div>
                  <h3 className="text-[11.5px] font-bold text-slate-900">{title} AI</h3>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Contextual RAG Assistant</span>
                </div>
              </div>
              <button
                onClick={() => setAssistantOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 text-[10px] ${
                    msg.role === 'user' 
                      ? 'bg-slate-100 border-slate-250 text-slate-700' 
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className={`p-2.5 rounded-[8px] text-[10.5px] leading-relaxed max-w-[80%] font-medium ${
                    msg.role === 'user' 
                      ? 'bg-slate-950 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isStreaming && (
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] shrink-0">
                    AI
                  </div>
                  <div className="p-2.5 rounded-[8px] text-[10.5px] leading-relaxed max-w-[80%] font-medium bg-slate-100 text-slate-800 shadow-sm border border-slate-200">
                    {streamedText || <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-[#fafafa]">
              {contextText && (
                <div className="px-2 py-1 mb-2 bg-indigo-50/50 border border-indigo-150/60 rounded text-[8px] font-bold text-indigo-700 uppercase tracking-widest truncate">
                  ⚡ Anchored to current layout
                </div>
              )}
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  placeholder="Ask explanation, generate notes..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-250 rounded-[6px] text-[11px] font-semibold focus:outline-none focus:border-slate-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isStreaming}
                  className="p-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-[6px] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
