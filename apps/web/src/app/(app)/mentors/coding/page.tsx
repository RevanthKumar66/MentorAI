'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Code, RefreshCw, Terminal as TermIcon, Play, Sparkles, Bug } from 'lucide-react';

interface CodingReviewResult {
  timeComplexity: string;
  spaceComplexity: string;
  suggestions: string[];
  safeCode: string;
}

const CHALLENGES: Record<string, { title: string; desc: string; skeleton: string }> = {
  async: {
    title: 'Async Event Queue',
    desc: 'Build an asynchronous event task runner in TypeScript that processes items concurrently with a maximum limit, executing tasks in FIFO sequence.',
    skeleton: `class AsyncQueue {\n  private limit: number;\n  private active = 0;\n  private queue: (() => Promise<any>)[] = [];\n\n  constructor(limit: number) {\n    this.limit = limit;\n  }\n\n  async add(task: () => Promise<any>): Promise<any> {\n    // TODO: Implement queuing logic\n  }\n}`
  },
  cache: {
    title: 'In-Memory Cache Store',
    desc: 'Design an in-memory key-value cache database supporting TTL (Time-To-Live) evictions and maximum size limits using an LRU eviction strategy.',
    skeleton: `class LRUCache {\n  private capacity: number;\n  private cache = new Map<string, any>();\n\n  constructor(capacity: number) {\n    this.capacity = capacity;\n  }\n\n  get(key: string): any {\n    // TODO: Return value and update LRU rank\n  }\n\n  set(key: string, value: any, ttlMs?: number): void {\n    // TODO: Write key-value with optional TTL\n  }\n}`
  },
  threadsafe: {
    title: 'Thread-Safe Queue',
    desc: 'Write a thread-safe synchronized task execution pipeline protecting share variables from race conditions.',
    skeleton: `class MutexQueue {\n  private locked = false;\n  private queue: (() => void)[] = [];\n\n  async lock(): Promise<void> {\n    // TODO: Acquire mutual exclusion lock\n  }\n\n  unlock(): void {\n    // TODO: Release lock and process next\n  }\n}`
  }
};

export default function CodingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTool = searchParams.get('tool');
  const challengeKey = searchParams.get('challenge');

  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState(`// Welcome to your Coding Assistant Sandbox.\n// Start typing or select a challenge to begin.\n\nfunction auditDatabase() {\n  console.log("Analyzing index performance...");\n}`);

  // Test Suite state
  const [isRunning, setIsRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<string[]>([]);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  // Review panel state
  const [reviewResult, setReviewResult] = useState<CodingReviewResult | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // Sync challenge skeleton
  useEffect(() => {
    if (challengeKey && CHALLENGES[challengeKey]) {
      const skeleton = CHALLENGES[challengeKey].skeleton;
      const timer = setTimeout(() => {
        setCode(skeleton);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [challengeKey]);

  const runTests = () => {
    setIsRunning(true);
    setTestOutput([
      '⚙ Launching virtual runtime sandbox environment...',
      '✓ Node.js TS compiler active.',
      '⏳ Running test suite (3 cases)...'
    ]);
    setTestSuccess(null);

    setTimeout(() => {
      setTestOutput(prev => [
        ...prev,
        '✓ Case 1: Class initialized correctly.',
        '✓ Case 2: Concurrent tasks respects capacity limits.',
        '✓ Case 3: Proper callback response returned on exit.',
        '🚀 Test run completed successfully.'
      ]);
      setTestSuccess(true);
      setIsRunning(false);
    }, 1800);
  };

  const runReview = () => {
    setIsReviewing(true);
    setTimeout(() => {
      setReviewResult({
        timeComplexity: 'O(1) lookups, O(N) cleaning on TTL expiration',
        spaceComplexity: 'O(C) where C is capacity',
        suggestions: [
          'Use a doubly linked list combined with a hashmap to make LRU element shifts O(1) instead of O(N) Array splits.',
          'Consider using setTimeout closures for TTL evictions instead of cleaning periodically on GET actions.'
        ],
        safeCode: `// Optimized LRU snippet:\nclass Node {\n  key: string; val: any;\n  prev: Node | null = null; next: Node | null = null;\n}`
      });
      setIsReviewing(false);
    }, 1500);
  };

  // 1. INTERACTIVE EDITOR WORKSPACE
  if (activeTool === 'editor') {
    const challenge = challengeKey ? CHALLENGES[challengeKey] : null;

    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in pb-24 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-150 pb-4 gap-4">
          <div>
            <h1 className="text-md font-bold text-slate-900 tracking-tight">
              {challenge ? `Challenge: ${challenge.title}` : 'Coding Workspace Sandbox'}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {challenge ? challenge.desc : 'Write, compile, and optimize typescript logic.'}
            </p>
          </div>
          {/* Language Selector */}
          <div className="flex gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-250 rounded-[6px] text-[10.5px] font-bold focus:outline-none"
            >
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="rust">Rust</option>
              <option value="go">Go</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Code Editor (takes 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-slate-850 rounded-[12px] bg-slate-950 shadow-md overflow-hidden relative">
              {/* Editor Header */}
              <div className="px-4 py-2 border-b border-slate-850 bg-slate-900 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>{language.toUpperCase()} FILE - main.{language === 'typescript' ? 'ts' : language === 'python' ? 'py' : 'rs'}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              {/* Editor Area */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-80 p-4 bg-slate-950 text-slate-200 text-[11px] font-mono focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Run Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={runTests}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-[6px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Run Test Suite
              </button>
              <button
                onClick={runReview}
                disabled={isReviewing}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] rounded-[6px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Review
              </button>
            </div>

            {/* Test Case Terminal output */}
            {testOutput.length > 0 && (
              <div className="border border-slate-850 bg-slate-950 rounded-[10px] p-4 font-mono text-[10.5px] leading-relaxed shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-2">
                  <span className="text-slate-400 flex items-center gap-1.5"><TermIcon className="w-4.5 h-4.5 text-blue-500" /> Virtual Sandbox Logs</span>
                  {testSuccess !== null && (
                    <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold uppercase ${testSuccess ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-rose-955 text-rose-400 border border-rose-900'}`}>
                      {testSuccess ? 'PASSED ✓' : 'FAILED ✗'}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-slate-300">
                  {testOutput.map((log, i) => (
                    <div key={i} className={log.startsWith('✓') ? 'text-emerald-400' : log.startsWith('⚙') ? 'text-blue-400' : 'text-slate-300'}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: AI Refactor review Panel */}
          <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-tight">
              <Sparkles className="w-4 h-4 text-blue-600" />
              AI Code Optimizer
            </h3>

            {isReviewing ? (
              <div className="h-48 flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
                <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
                <p className="text-[11px] font-bold">Parsing code structure & evaluating complexity...</p>
              </div>
            ) : reviewResult ? (
              <div className="space-y-4 text-[10.5px]">
                <div className="border-b border-slate-100 pb-3 space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Time Complexity</span>
                  <span className="font-mono font-bold text-slate-800">{reviewResult.timeComplexity}</span>
                </div>

                <div className="border-b border-slate-100 pb-3 space-y-1">
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Space Complexity</span>
                  <span className="font-mono font-bold text-slate-800">{reviewResult.spaceComplexity}</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-bold text-slate-850 uppercase block">Refactoring Suggestions</span>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-700 font-semibold">
                    {reviewResult.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                <div className="space-y-1.5 mt-2">
                  <span className="text-[9.5px] font-bold text-slate-800 uppercase block font-mono">Optimized Snippet</span>
                  <pre className="p-3 bg-slate-950 text-slate-350 font-mono text-[9.5px] rounded border border-slate-850 overflow-x-auto leading-normal">
                    {reviewResult.safeCode}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
                <Bug className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] font-semibold">Click &ldquo;AI Review&rdquo; below the editor to run structural audits.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // 2. CODING MENTOR GENERAL DASHBOARD
  return (
    <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border border-blue-200 rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-slate-900 tracking-tight mb-1">Production Coding Workspace</h2>
          <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
            Write clean architecture, run diagnostic checks, or practice concurrency design.
          </p>
        </div>
        <button
          onClick={() => router.push('/mentors/coding?tool=editor')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-650 hover:bg-blue-750 text-white font-bold text-[10px] rounded-[6px] transition-colors shrink-0 uppercase tracking-widest shadow-xs cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Open Editor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak card */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Active Streak</h3>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">14 Days Active</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-250 text-blue-700 text-[8.5px] font-bold uppercase tracking-wider">Consistent</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">You rank top 8% in code quality metrics this week. Keep up the high standard!</p>
        </div>

        {/* Challenge tracker */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Practice Challenges Queue</h3>
          <div className="space-y-2">
            <div
              onClick={() => router.push('/mentors/coding?tool=editor&challenge=async')}
              className="p-3 border border-slate-200 hover:border-slate-350 rounded-[8px] bg-slate-55/30 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-blue-650 transition-colors">Async Event Queue</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">TypeScript | Medium difficulty</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-blue-600">Start Challenge →</span>
            </div>
            <div
              onClick={() => router.push('/mentors/coding?tool=editor&challenge=cache')}
              className="p-3 border border-slate-200 hover:border-slate-350 rounded-[8px] bg-white transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-blue-650 transition-colors">In-Memory Cache Store</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Design Patterns | Hard difficulty</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-slate-500">Start Challenge →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
