'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  ChevronRight, 
  Check, 
  Terminal, 
  Code2, 
  Database, 
  BookOpen, 
  Cpu, 
  FileText, 
  Lock, 
  Play, 
  Upload, 
  Workflow, 
  Layers,
  Menu,
  X
} from 'lucide-react';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'code' | 'data'>('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (e: Event) => {
      const target = e.target;
      const scrollY = window.scrollY 
        || document.documentElement.scrollTop 
        || document.body.scrollTop 
        || 0;
      
      let elementScroll = 0;
      if (target instanceof HTMLElement && target !== document.body && target !== document.documentElement) {
        elementScroll = target.scrollTop;
      }
      
      setScrolled(scrollY > 20 || elementScroll > 20);
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true });
  }, []);

  // Mock FAQ state
  const faqs = [
    {
      q: "Is MentorAI free to use?",
      a: "Yes, MentorAI offers a generous free tier that lets you connect your own models (like Gemini, OpenAI, or Ollama) or use our default cloud models. You only pay for your own LLM usage or opt for our premium managed tier."
    },
    {
      q: "Can I upload large PDFs and datasets?",
      a: "Absolutely. MentorAI includes a vector-embedded document store. You can upload PDFs, CSVs, markdown, and text files. Large documents are split, embedded, and indexed for fast semantic retrieval."
    },
    {
      q: "How does the local model support work?",
      a: "MentorAI integrates with Ollama out of the box. If you have Ollama running locally on your machine, you can point MentorAI to your local endpoint and run models like Llama 3 or Mistral entirely offline."
    },
    {
      q: "Does it help with coding and DSA interviews?",
      a: "Yes. The integrated DSA Coach maps algorithmic problems, performs dry runs on your code inputs, and helps analyze complexity. It acts as an interactive compiler and interviewer to prepare you for technical rounds."
    },
    {
      q: "Is my data private?",
      a: "Yes. MentorAI is open-architecture and privacy-first. Your API keys, document embeddings, and chat histories are stored securely in your database instance. We do not sell or telemetry your code, documents, or prompts."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] font-sans antialiased selection:bg-[#111111] selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* ── Custom CSS Animations for Smooth Floating Background Mesh ── */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.06); }
          66% { transform: translate(-30px, 30px) scale(0.96); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 25s infinite ease-in-out;
        }
      `}</style>

      {/* ── Background Patterns (Smooth Animated Mesh) ────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `radial-gradient(#111 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Soft floating blurred shapes for smooth animation */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-slate-200/40 blur-[130px] animate-blob" style={{ animationDuration: '24s' }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-slate-100/50 blur-[140px] animate-blob" style={{ animationDuration: '28s', animationDelay: '4s' }} />
        <div className="absolute top-[35%] left-[50%] -translate-x-1/2 w-[45%] h-[45%] rounded-full bg-white blur-[110px] animate-blob" style={{ animationDuration: '20s', animationDelay: '2s' }} />
      </div>

      {/* ── 1. Navbar ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full shrink-0 pt-3 px-4 pb-0 pointer-events-none">
        <div
          className={`max-w-7xl mx-auto flex items-center justify-between h-14 px-6 rounded-[14px] transition-all duration-500 pointer-events-auto ${
            scrolled
              ? 'border border-slate-200/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
              : 'border border-transparent'
          }`}
          style={scrolled ? {
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px) saturate(190%)',
            WebkitBackdropFilter: 'blur(20px) saturate(190%)',
          } : {}}
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image 
              src="/mentorai-symbol-only.svg" 
              alt="MentorAI Symbol" 
              width={28}
              height={28}
              className="w-7 h-7 transition-transform group-hover:rotate-12 duration-200" 
            />
            <span className="font-semibold text-[15px] tracking-tight font-sans">MentorAI <span className="font-light text-slate-500">OS</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-slate-600">
            <a href="#features" className="hover:text-[#111111] transition-colors">Features</a>
            <a href="#use-cases" className="hover:text-[#111111] transition-colors">Use Cases</a>
            <a href="#roadmap" className="hover:text-[#111111] transition-colors">Roadmap</a>
            <a href="#tech-stack" className="hover:text-[#111111] transition-colors">Infrastructure</a>
            <a href="#faq" className="hover:text-[#111111] transition-colors">FAQ</a>
            <a href="https://github.com" className="hover:text-[#111111] transition-colors flex items-center gap-1.5">
              <GithubIcon className="w-4 h-4" />
              GitHub
            </a>
          </nav>

          {/* Right buttons */}
          <div className="hidden md:flex items-center gap-5">
            <Link 
              href="/login" 
              className="text-[13.5px] font-medium text-slate-600 hover:text-[#111111] transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-[13.5px] font-medium rounded-[6px] transition-all active:scale-[0.98]"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-slate-600 hover:text-[#111111] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div
            className="md:hidden mt-2 mx-auto max-w-7xl rounded-[12px] border border-white/50 px-6 py-5 flex flex-col gap-4 text-sm font-medium text-slate-700 pointer-events-auto"
            style={{
              background: 'rgba(247,247,247,0.85)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            }}
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#111111]">Features</a>
            <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#111111]">Use Cases</a>
            <a href="#roadmap" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#111111]">Roadmap</a>
            <a href="#tech-stack" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#111111]">Infrastructure</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#111111]">FAQ</a>
            <hr className="border-slate-200 my-1" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#111111] py-1">Log in</Link>
            <Link 
              href="/signup" 
              onClick={() => setMobileMenuOpen(false)} 
              className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-center rounded-[6px] transition-all"
            >
              Sign Up
            </Link>
          </div>
        )}
      </header>


      {/* ── Semantic Main Wrapper ────────────────────────────────────── */}
      <main className="flex-grow w-full relative z-10 flex flex-col">
        
        {/* ── 2. Hero Section ──────────────────────────────────────────── */}
        <section className="relative max-w-7xl mx-auto px-8 pt-16 pb-12 text-center flex-1 flex flex-col justify-center">
          
          {/* Centered Medium Logo Symbol above Hero */}
          <div className="flex justify-center mb-6 select-none animate-fade-in">
            <Image 
              src="/mentorai-symbol-only.svg" 
              alt="MentorAI Logo" 
              width={64}
              height={64}
              className="w-16 h-16 hover:rotate-12 transition-transform duration-300" 
            />
          </div>

          <h1 className="text-4xl sm:text-7xl font-bold text-[#111111] tracking-tight leading-[1.08] max-w-5xl mx-auto">
            Learn faster. Build better. Think deeper.
          </h1>
          
          <p className="mt-6 text-sm sm:text-base text-[#52525B] max-w-xl mx-auto font-normal leading-relaxed">
            One AI Workspace for Learning, Coding, Research, and Career Growth.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-[13px] font-semibold rounded-[6px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-[0.98]"
            >
              Start Free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="#preview"
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold rounded-[6px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.01)] active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 text-slate-400 fill-slate-400" />
              Watch Demo
            </a>
          </div>

          {/* ── Who It's For ────────────────────────────────────────── */}
          <div className="mt-20 pt-8 border-t border-slate-200/50 max-w-4xl mx-auto">
            <p className="text-sm font-medium text-[#6B7280] tracking-widest mb-4">Tailored Workflows for Professionals & Students</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[12px] font-semibold text-slate-600 select-none">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> Students</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> Developers</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> AI Engineers</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> Job Seekers</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> Data Scientists</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-400" /> Researchers</span>
            </div>
          </div>
        </section>

        {/* ── 3. Interactive Product Preview ─────────────────────────────── */}
        <section id="preview" className="max-w-7xl mx-auto px-8 py-10 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">Inside MentorAI OS</h2>
            <p className="text-xs text-[#52525B] mt-2">Interact with the core layers of our operating workspace below.</p>
          </div>

          <div className="w-full border border-slate-200/70 bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col md:flex-row min-h-[460px]">
            
            {/* Side Tabs Swapper */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200/70 bg-slate-50/50 p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none select-none">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 md:flex-none flex items-center gap-2.5 px-4 py-2.5 rounded-[8px] text-[12px] font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'chat' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Terminal className="w-4 h-4 shrink-0" />
                Chat & Tutoring
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`flex-1 md:flex-none flex items-center gap-2.5 px-4 py-2.5 rounded-[8px] text-[12px] font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'docs' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                Knowledge Base
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 md:flex-none flex items-center gap-2.5 px-4 py-2.5 rounded-[8px] text-[12px] font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'code' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-4 h-4 shrink-0" />
                Code Review
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`flex-1 md:flex-none flex items-center gap-2.5 px-4 py-2.5 rounded-[8px] text-[12px] font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeTab === 'data' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                Dataset Analysis
              </button>
            </div>

            {/* Tab Previews (Pure CSS Mockups) */}
            <div className="flex-1 p-6 bg-white flex flex-col justify-center min-w-0">
              
              {/* CHAT TAB */}
              {activeTab === 'chat' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col gap-3">
                    {/* User Bubble */}
                    <div className="self-end bg-[#ecebea]/80 text-[#1f1f1f] text-[12px] px-3.5 py-2 rounded-[16px] max-w-[80%] leading-relaxed font-medium">
                      Explain Dijkstra&apos;s algorithm visually.
                    </div>
                    {/* Assistant Bubble */}
                    <div className="flex gap-3 text-left">
                      <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center shrink-0 bg-slate-50">
                        <Image src="/mentorai-symbol-only.svg" alt="M" width={14} height={14} className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 space-y-2.5 min-w-0">
                        <span className="text-[10px] font-bold text-[#71717A] font-mono tracking-wider">MentorAI</span>
                        <div className="text-[12.5px] leading-relaxed text-[#1f1f1f] bg-slate-50/60 p-4 border border-slate-200/50 rounded-[10px] space-y-3">
                          <p>Dijkstra&apos;s algorithm finds the shortest path in a weighted graph:</p>
                          
                          {/* Callout box */}
                          <div className="p-3 bg-indigo-50/40 border border-indigo-100/60 text-indigo-900 text-xs rounded-[8px]">
                            <strong>Key Concept:</strong> Always select the unvisited node with the smallest tentative distance, relaxation is done for all its neighbors.
                          </div>

                          <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[12px]">
                            <li>Initialize distances: Source is 0, all others are infinite.</li>
                            <li>Keep track of visited nodes using a priority queue.</li>
                          </ul>
                        </div>

                        {/* Suggestions pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button className="px-2.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-600 cursor-default">
                            Code implementation in Python
                          </button>
                          <button className="px-2.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-600 cursor-default">
                            Compare with Bellman-Ford
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'docs' && (
                <div className="space-y-5 animate-fade-in text-left">
                  {/* Drag and Drop Box */}
                  <div className="border border-dashed border-slate-200 rounded-[10px] p-6 text-center bg-slate-50/30 flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400 mb-2 animate-bounce" />
                    <span className="text-[12px] font-semibold text-slate-800">Drag & Drop files to upload</span>
                    <span className="text-[10px] text-[#52525B] mt-0.5">Supports PDF, CSV, Markdown up to 32MB</span>
                  </div>

                  {/* Uploaded files list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-slate-200/60 rounded-[8px] bg-white text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">algorithms_curriculum.pdf</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase shrink-0">Ready</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-slate-200/60 rounded-[8px] bg-white text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Database className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">user_growth_metrics.csv</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase shrink-0">Ready</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CODE TAB */}
              {activeTab === 'code' && (
                <div className="border border-slate-200 rounded-[10px] overflow-hidden text-left font-mono text-[11px] shadow-sm animate-fade-in flex flex-col h-full">
                  {/* Editor Bar */}
                  <div className="bg-[#0b0e17] px-4 py-2 border-b border-slate-800 text-[10px] text-slate-500 flex justify-between select-none">
                    <span>dijkstra.py (Git Diff)</span>
                    <span className="text-emerald-500">Suggested Optimization</span>
                  </div>
                  {/* Diff area */}
                  <div className="bg-[#0f1424] p-4 text-slate-300 space-y-0.5 leading-relaxed overflow-x-auto">
                    <div className="text-[#52525B]">10  def get_shortest_path(graph, start):</div>
                    <div className="text-[#52525B]">11      distances = &#123;node: float(&apos;inf&apos;) for node in graph&#125;</div>
                    <div className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded-sm border-l-2 border-rose-500">- 12      # Linear array search (O(V^2))</div>
                    <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded-sm border-l-2 border-emerald-500">+ 12      # Min-heap queue implementation (O((V+E)logV))</div>
                    <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded-sm border-l-2 border-emerald-500">+ 13      priority_queue = [(0, start)]</div>
                    <div className="text-[#52525B]">14      distances[start] = 0</div>
                  </div>
                  {/* Assistant review widget */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs font-sans text-slate-700 flex gap-2">
                    <Image src="/mentorai-symbol-only.svg" alt="MentorAI" width={16} height={16} className="w-4 h-4 object-contain shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block mb-0.5">AI Suggestion:</strong>
                      Using a priority queue reduces lookup overhead from linear search to logarithmic time. Perfect for sparse graphs.
                    </div>
                  </div>
                </div>
              )}

              {/* DATA TAB */}
              {activeTab === 'data' && (
                <div className="space-y-4 animate-fade-in text-left">
                  {/* Insight metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border border-slate-200/50 rounded-[8px] bg-slate-50/50 text-xs">
                      <span className="text-[#71717A] block text-[10px] font-bold uppercase tracking-wider">Correlation Coefficient</span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">0.897 (Strong Positive)</span>
                    </div>
                    <div className="p-3 border border-slate-200/50 rounded-[8px] bg-slate-50/50 text-xs">
                      <span className="text-[#71717A] block text-[10px] font-bold uppercase tracking-wider">Suggested Step</span>
                      <span className="text-base font-bold text-slate-900 mt-1 block">Linear regression modeling</span>
                    </div>
                  </div>

                  {/* SVG correlation chart mockup */}
                  <div className="border border-slate-200/70 p-4 rounded-[8px] flex items-center justify-center bg-white h-44 relative">
                    <svg className="w-full h-full max-h-36 overflow-visible" viewBox="0 0 300 100">
                      {/* Grid lines */}
                      <line x1="20" y1="10" x2="20" y2="90" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3" />
                      <line x1="20" y1="90" x2="290" y2="90" stroke="#E5E7EB" strokeWidth="1" />
                      <line x1="20" y1="50" x2="290" y2="50" stroke="#F3F4F6" strokeWidth="1" strokeDasharray="2" />
                      
                      {/* Trend Line */}
                      <line x1="30" y1="80" x2="270" y2="20" stroke="#111111" strokeWidth="1.5" />

                      {/* Data scatter points */}
                      <circle cx="50" cy="75" r="3" fill="#6366F1" />
                      <circle cx="80" cy="72" r="3" fill="#6366F1" />
                      <circle cx="110" cy="62" r="3" fill="#6366F1" />
                      <circle cx="140" cy="53" r="3" fill="#6366F1" />
                      <circle cx="170" cy="48" r="3" fill="#6366F1" />
                      <circle cx="200" cy="38" r="3" fill="#6366F1" />
                      <circle cx="230" cy="28" r="3" fill="#6366F1" />
                      <circle cx="260" cy="22" r="3" fill="#6366F1" />
                    </svg>
                    <div className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-400">EDA: Correlation scatter plot</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 4. Why MentorAI Exists ───────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-8 py-10 w-full text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-sm font-medium text-[#6B7280] tracking-widest block">Workflow Fragmentation</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">Five tools for one workflow.</h2>
            <p className="text-sm text-[#52525B] font-normal mt-4 leading-relaxed max-w-2xl mx-auto">
              Stop switching tabs. MentorAI combines chat, documents, code, and datasets into one seamless workspace.
            </p>
          </div>

          {/* Workflow Diagram */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-3 items-center justify-center select-none text-xs text-[#52525B] font-medium font-sans">
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm flex flex-col items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-md">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#10a37f" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
              </svg>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider">Concept Learning</span>
            </div>
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm flex flex-col items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-md">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#FFA116" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
              </svg>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider">DSA Practice</span>
            </div>
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm flex flex-col items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-md">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
              </svg>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider">Notes & KB</span>
            </div>
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm flex flex-col items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-md">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#F37626" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.157 22.201A1.784 1.799 0 0 1 5.374 24a1.784 1.799 0 0 1-1.784-1.799 1.784 1.799 0 0 1 1.784-1.799 1.784 1.799 0 0 1 1.783 1.799zM20.582 1.427a1.415 1.427 0 0 1-1.415 1.428 1.415 1.427 0 0 1-1.416-1.428A1.415 1.427 0 0 1 19.167 0a1.415 1.427 0 0 1 1.415 1.427zM4.992 3.336A1.047 1.056 0 0 1 3.946 4.39a1.047 1.056 0 0 1-1.047-1.055A1.047 1.056 0 0 1 3.946 2.28a1.047 1.056 0 0 1 1.046 1.056zm7.336 1.517c3.769 0 7.06 1.38 8.768 3.424a9.363 9.363 0 0 0-3.393-4.547 9.238 9.238 0 0 0-5.377-1.728A9.238 9.238 0 0 0 6.95 3.73a9.363 9.363 0 0 0-3.394 4.547c1.713-2.04 5.004-3.424 8.772-3.424zm.001 13.295c-3.768 0-7.06-1.381-8.768-3.425a9.363 9.363 0 0 0 3.394 4.547A9.238 9.238 0 0 0 12.33 21a9.238 9.238 0 0 0 5.377-1.729 9.363 9.363 0 0 0 3.393-4.547c-1.712 2.044-5.003 3.425-8.772 3.425Z"/>
              </svg>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider">Datasets Analysis</span>
            </div>
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm col-span-2 sm:col-span-1 flex flex-col items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-md">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#EC1C24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.63 15.3c-.71-.745-2.166-1.17-4.224-1.17-1.1 0-2.377.106-3.761.354a19.443 19.443 0 0 1-2.307-2.661c-.532-.71-.994-1.49-1.42-2.236.817-2.484 1.207-4.507 1.207-5.962 0-1.632-.603-3.336-2.342-3.336-.532 0-1.065.32-1.349.781-.78 1.384-.425 4.4.923 7.381a60.277 60.277 0 0 1-1.703 4.507c-.568 1.349-1.207 2.733-1.917 4.01C2.834 18.53.314 20.34.03 21.758c-.106.533.071 1.03.462 1.42.142.107.639.533 1.49.533 2.59 0 5.323-4.188 6.707-6.707 1.065-.355 2.13-.71 3.194-.994a34.963 34.963 0 0 1 3.407-.745c2.732 2.448 5.145 2.839 6.352 2.839 1.49 0 2.023-.604 2.2-1.1.32-.64.106-1.349-.213-1.704zm-1.42 1.03c-.107.532-.64.887-1.384.887-.213 0-.39-.036-.604-.071-1.348-.32-2.626-.994-3.903-2.059a17.717 17.717 0 0 1 2.98-.248c.746 0 1.385.035 1.81.142.497.106 1.278.426 1.1 1.348zm-7.524-1.668a38.01 38.01 0 0 0-2.945.674 39.68 39.68 0 0 0-2.52.745 40.05 40.05 0 0 0 1.207-2.555c.426-.994.78-2.023 1.136-2.981.354.603.745 1.207 1.135 1.739a50.127 50.127 0 0 0 1.987 2.378zM10.038 1.46a.768.768 0 0 1 .674-.425c.745 0 .887.851.887 1.526 0 1.135-.355 2.874-.958 4.861-1.03-2.768-1.1-5.074-.603-5.962zM6.134 17.997c-1.81 2.981-3.549 4.826-4.613 4.826a.872.872 0 0 1-.532-.177c-.213-.213-.32-.461-.249-.745.213-1.065 2.271-2.555 5.394-3.904Z"/>
              </svg>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider">Scattered Docs</span>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="h-8 w-[1.5px] bg-[#111111]/25 animate-pulse" />
              <div className="w-10 h-10 flex items-center justify-center my-2 select-none">
                <Image src="/mentorai-symbol-only.svg" alt="MentorAI Symbol" width={40} height={40} className="w-10 h-10 object-contain" />
              </div>
              <div className="h-8 w-[1.5px] bg-[#111111]/25 animate-pulse" />
              
              <div className="mt-3 px-6 py-3 border border-slate-900 bg-slate-900 text-white rounded-[8px] font-semibold text-xs shadow-md tracking-wider">
                MentorAI OS Workspace
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Problem Comparison Table ─────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-8 py-10 w-full">
          <div className="border border-slate-200/60 rounded-[12px] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-800 w-1/2">Traditional Workflow</th>
                  <th className="p-4 font-bold text-[#111111] w-1/2 border-l border-slate-200">MentorAI OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-4">Generates isolated text responses; copy-pasting required</td>
                  <td className="p-4 border-l border-slate-200 font-semibold text-slate-900">One workspace with integrated dynamic rendering widgets</td>
                </tr>
                <tr>
                  <td className="p-4">Solve algorithmic tasks on another tab (LeetCode)</td>
                  <td className="p-4 border-l border-slate-200 font-semibold text-slate-900">Integrated DSA Coach showing pattern traces and dry-runs</td>
                </tr>
                <tr>
                  <td className="p-4">Take notes and compile roadmaps separately in Notion</td>
                  <td className="p-4 border-l border-slate-200 font-semibold text-slate-900">Directly sync markdown documents and save custom pathways</td>
                </tr>
                <tr>
                  <td className="p-4">Load CSV datasets into local Python notebooks</td>
                  <td className="p-4 border-l border-slate-200 font-semibold text-slate-900">Upload CSVs directly and visualize correlations inline</td>
                </tr>
                <tr>
                  <td className="p-4">Open PDF guides side-by-side or scattered on your disk</td>
                  <td className="p-4 border-l border-slate-200 font-semibold text-slate-900">Integrated vector database with semantic lookup</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 6. One Workspace. Multiple AI Capabilities (Feature Grid) ─── */}
        <section id="features" className="max-w-7xl mx-auto px-8 py-10 w-full">
          <div className="text-center mb-10">
            <span className="text-sm font-medium text-[#6B7280] tracking-widest">Built to Perform</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] mt-2">One Workspace. Multiple AI Capabilities.</h2>
            <p className="text-sm text-[#52525B] mt-3 max-w-lg mx-auto">
              A comprehensive suite of functional agents designed to accelerate your day-to-day workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: AI Mentor */}
            <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">AI Mentor</h3>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                  Generates personalized learning paths, custom study roadmaps, practice drills, and summaries based on your goals.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Concept Tutoring</span>
            </div>

            {/* Card 2: Coding Assistant */}
            <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-[6px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                  <Code2 className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Coding Assistant</h3>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                  Writes refactored code, generates clean codebases, runs reviews, suggests design patterns, and highlights structural bugs.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Code Generation</span>
            </div>

            {/* Card 3: DSA Coach */}
            <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-[6px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
                  <Terminal className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">DSA Coach</h3>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                  Traces algorithms step-by-step, analyzes time and space complexity, runs dry tests, and recommends interview patterns.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Algorithm Prep</span>
            </div>

            {/* Card 4: Knowledge Base */}
            <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-[6px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Knowledge Base</h3>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                  Connects PDFs, notes, markdown guides, and sheets. Searches and indexes documentation using vector search.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Vector Indexing</span>
            </div>

            {/* Card 5: Data Science Copilot */}
            <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-[6px] bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Data Science Copilot</h3>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                  Ingests CSV tables, suggests feature engineering targets, performs EDA, and outputs clean visualization code.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Data Analytics</span>
            </div>

            {/* Card 6: Research Assistant */}
            <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-[6px] bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                  <Cpu className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Research Assistant</h3>
                <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                  Synthesizes documentation, parses references, extracts structured data tables, and drafts comprehensive insights.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Information Mining</span>
            </div>

          </div>
        </section>

        {/* ── 7. Use Cases ───────────────────────────────────────────────── */}
        <section id="use-cases" className="max-w-7xl mx-auto px-8 py-10 w-full">
          <div className="text-center mb-10">
            <span className="text-sm font-medium text-[#6B7280] tracking-widest">Targeted Workflows</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] mt-2">Built for Every Role.</h2>
            <p className="text-xs text-[#52525B] mt-2">Explore how different roles optimize their work output in MentorAI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Student */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-[10px] space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Students</h4>
              <p className="text-xs text-[#52525B] leading-relaxed text-justify">
                Accelerate learning loops. Generate customized study plans, mock exams, visual summaries of difficult theories, and parse textbooks with context.
              </p>
            </div>

            {/* Developer */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-[10px] space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Developers</h4>
              <p className="text-xs text-[#52525B] leading-relaxed text-justify">
                Write cleaner, optimized code. Conduct complex system architecture design reviews, debug syntax errors, and refactor applications directly inside the workspace.
              </p>
            </div>

            {/* Job Seeker */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-[10px] space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Job Seekers</h4>
              <p className="text-xs text-[#52525B] leading-relaxed text-justify">
                Prepare for elite software engineering interviews. Practice DSA problems, get feedback on mock answers, and run resume reviews with a simulated interviewer.
              </p>
            </div>

            {/* Data Scientist */}
            <div className="p-6 bg-white border border-slate-200/60 rounded-[10px] space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Data Scientists</h4>
              <p className="text-xs text-[#52525B] leading-relaxed text-justify">
                Run EDA pipelines on the fly. Ingest CSV data files, verify columns, perform statistical analysis, and construct charts automatically.
              </p>
            </div>
          </div>
        </section>

        {/* ── 8. How MentorAI Works ──────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-8 py-10 w-full text-center">
          <div className="max-w-2xl mx-auto mb-10">
            <span className="text-sm font-medium text-[#6B7280] tracking-widest block">Workflow Pipeline</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111111] mt-2">Zero Friction Learning Loop</h2>
            <p className="text-xs text-[#52525B] mt-2">A clean four-stage workflow that transforms information into mastery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto relative">
            
            {/* Step 1 */}
            <div className="relative flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-[#111111]/10 bg-white flex items-center justify-center text-xs font-mono font-bold text-[#111111] shadow-sm select-none z-10">
                01
              </div>
              <h4 className="font-bold text-slate-800 text-xs mt-4">Upload</h4>
              <p className="text-[11px] text-[#52525B] mt-1 max-w-[200px] leading-relaxed">
                Ingest notes, coding files, database schemas, or PDFs to prime the agent&apos;s context.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-[#111111]/10 bg-white flex items-center justify-center text-xs font-mono font-bold text-[#111111] shadow-sm select-none z-10">
                02
              </div>
              <h4 className="font-bold text-slate-800 text-xs mt-4">Analyze</h4>
              <p className="text-[11px] text-[#52525B] mt-1 max-w-[200px] leading-relaxed">
                The Response Intelligence Layer classifies intent and structures the prompt layout.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-[#111111]/10 bg-white flex items-center justify-center text-xs font-mono font-bold text-[#111111] shadow-sm select-none z-10">
                03
              </div>
              <h4 className="font-bold text-slate-800 text-xs mt-4">Understand</h4>
              <p className="text-[11px] text-[#52525B] mt-1 max-w-[200px] leading-relaxed">
                Interact with custom renderers, visual diagrams, data tables, and structured code diffs.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-[#111111]/10 bg-white flex items-center justify-center text-xs font-mono font-bold text-[#111111] shadow-sm select-none z-10">
                04
              </div>
              <h4 className="font-bold text-slate-800 text-xs mt-4">Apply</h4>
              <p className="text-[11px] text-[#52525B] mt-1 max-w-[200px] leading-relaxed">
                Execute short roadmaps, test optimized code modules, and build technical mastery.
              </p>
            </div>

            {/* Background Connector Line */}
            <div className="hidden md:block absolute top-5 left-[12%] right-[12%] h-[1.5px] bg-slate-200/60 z-0 pointer-events-none" />
          </div>
        </section>

        {/* ── 9. Technology & Infrastructure ─────────────────────────────── */}
        <section id="tech-stack" className="max-w-7xl mx-auto px-8 py-10 w-full text-center">
          <div className="max-w-2xl mx-auto mb-10">
            <span className="text-sm font-medium text-[#6B7280] tracking-widest block">Modern Architecture</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111111] mt-2">Built with Modern AI Infrastructure</h2>
            <p className="text-xs text-[#52525B] mt-2">Production-grade technologies configured for extreme performance and scalability.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {/* Tech 1: Next.js */}
            <div className="p-4 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z"/>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-800 font-sans">Next.js</span>
                <span className="text-[9px] text-slate-400">App Router UI</span>
              </div>
            </div>
            {/* Tech 2: FastAPI */}
            <div className="p-4 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#009688" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .0387C5.3729.0384.0003 5.3931 0 11.9988c-.001 6.6066 5.372 11.9628 12 11.9625 6.628.0003 12.001-5.3559 12-11.9625-.0003-6.6057-5.3729-11.9604-12-11.96m-.829 5.4153h7.55l-7.5805 5.3284h5.1828L5.279 18.5436q2.9466-6.5444 5.892-13.0896"/>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-800 font-sans">FastAPI</span>
                <span className="text-[9px] text-slate-400">Python Backend</span>
              </div>
            </div>
            {/* Tech 3: Supabase */}
            <div className="p-4 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#3ECF8E" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.9 1.036c-.015-.986-1.26-1.41-1.874-.637L.764 12.05C-.33 13.427.65 15.455 2.409 15.455h9.579l.113 7.51c.014.985 1.259 1.408 1.873.636l9.262-11.653c1.093-1.375.113-3.403-1.645-3.403h-9.642z"/>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-800 font-sans">Supabase</span>
                <span className="text-[9px] text-slate-400">Auth & Storage</span>
              </div>
            </div>
            {/* Tech 4: PostgreSQL */}
            <div className="p-4 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#336791" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698zM2.371 11.8765c-.7435-2.4358-1.1779-4.8851-1.2123-5.5719-.1086-2.1714.4171-3.6829 1.5623-4.4927 1.8367-1.2986 4.8398-.5408 6.108-.13-.0032.0032-.0066.0061-.0098.0094-2.0238 2.044-1.9758 5.536-1.9708 5.7495-.0002.0823.0066.1989.0162.3593.0348.5873.0996 1.6804-.0735 2.9184-.1609 1.1504.1937 2.2764.9728 3.0892.0806.0841.1648.1631.2518.2374-.3468.3714-1.1004 1.1926-1.9025 2.1576-.5677.6825-.9597.5517-1.0886.5087-.3919-.1307-.813-.5871-1.2381-1.3223-.4796-.839-.9635-2.0317-1.4155-3.5126zm6.0072 5.0871c-.1711-.0428-.3271-.1132-.4322-.1772.0889-.0394.2374-.0902.4833-.1409 1.2833-.2641 1.4815-.4506 1.9143-1.0002.0992-.126.2116-.2687.3673-.4426a.3549.3549 0 0 0 .0737-.1298c.1708-.1513.2724-.1099.4369-.0417.156.0646.3078.26.3695.4752.0291.1016.0619.2945-.0452.4444-.9043 1.2658-2.2216 1.2494-3.1676 1.0128zm2.094-3.988-.0525.141c-.133.3566-.2567.6881-.3334 1.003-.6674-.0021-1.3168-.2872-1.8105-.8024-.6279-.6551-.9131-1.5664-.7825-2.5004.1828-1.3079.1153-2.4468.079-3.0586-.005-.0857-.0095-.1607-.0122-.2199.2957-.2621 1.6659-.9962 2.6429-.7724.4459.1022.7176.4057.8305.928.5846 2.7038.0774 3.8307-.3302 4.7363-.084.1866-.1633.3629-.2311.5454zm7.3637 4.5725c-.0169.1768-.0358.376-.0618.5959l-.146.4383a.3547.3547 0 0 0-.0182.1077c-.0059.4747-.054.6489-.115.8693-.0634.2292-.1353.4891-.1794 1.0575-.11 1.4143-.8782 2.2267-2.4172 2.5565-1.5155.3251-1.7843-.4968-2.0212-1.2217a6.5824 6.5824 0 0 0-.0769-.2266c-.2154-.5858-.1911-1.4119-.1574-2.5551.0165-.5612-.0249-1.9013-.3302-2.6462.0044-.2932.0106-.5909.019-.8918a.3529.3529 0 0 0-.0153-.1126 1.4927 1.4927 0 0 0-.0439-.208c-.1226-.4283-.4213-.7866-.7797-.9351-.1424-.059-.4038-.1672-.7178-.0869.067-.276.1831-.5875.309-.9249l.0529-.142c.0595-.16.134-.3257.213-.5012.4265-.9476 1.0106-2.2453.3766-5.1772-.2374-1.0981-1.0304-1.6343-2.2324-1.5098-.7207.0746-1.3799.3654-1.7088.5321a5.6716 5.6716 0 0 0-.1958.1041c.0918-1.1064.4386-3.1741 1.7357-4.4823a4.0306 4.0306 0 0 1 .3033-.276.3532.3532 0 0 0 .1447-.0644c.7524-.5706 1.6945-.8506 2.802-.8325.4091.0067.8017.0339 1.1742.081 1.939.3544 3.2439 1.4468 4.0359 2.3827.8143.9623 1.2552 1.9315 1.4312 2.4543-1.3232-.1346-2.2234.1268-2.6797.779-.9926 1.4189.543 4.1729 1.2811 5.4964.1353.2426.2522.4522.2889.5413.2403.5825.5515.9713.7787 1.2552.0696.087.1372.1714.1885.245-.4008.1155-1.1208.3825-1.0552 1.717-.0123.1563-.0423.4469-.0834.8148-.0461.2077-.0702.4603-.0994.7662zm.8905-1.6211c-.0405-.8316.2691-.9185.5967-1.0105a2.8566 2.8566 0 0 0 .135-.0406 1.202 1.202 0 0 0 .1342.103c.5703.3765 1.5823.4213 3.0068.1344-.2016.1769-.5189.3994-.9533.6011-.4098.1903-1.0957.333-1.7473.3636-.7197.0336-1.0859-.0807-1.1721-.151zm.5695-9.2712c-.0059.3508-.0542.6692-.1054 1.0017-.055.3576-.112.7274-.1264 1.1762-.0142.4368.0404.8909.0932 1.3301.1066.887.216 1.8003-.2075 2.7014a3.5272 3.5272 0 0 1-.1876-.3856c-.0527-.1276-.1669-.3326-.3251-.6162-.6156-1.1041-2.0574-3.6896-1.3193-4.7446.3795-.5427 1.3408-.5661 2.1781-.463zm.2284 7.0137a12.3762 12.3762 0 0 0-.0853-.1074l-.0355-.0444c.7262-1.1995.5842-2.3862.4578-3.4385-.0519-.4318-.1009-.8396-.0885-1.2226.0129-.4061.0666-.7543.1185-1.0911.0639-.415.1288-.8443.1109-1.3505.0134-.0531.0188-.1158.0118-.1902-.0457-.4855-.5999-1.938-1.7294-3.253-.6076-.7073-1.4896-1.4972-2.6889-2.0395.5251-.1066 1.2328-.2035 2.0244-.1859 2.0515.0456 3.6746.8135 4.8242 2.2824a.908.908 0 0 1 .0667.1002c.7231 1.3556-.2762 6.2751-2.9867 10.5405zm-8.8166-6.1162c-.025.1794-.3089.4225-.6211.4225a.5821.5821 0 0 1-.0809-.0056c-.1873-.026-.3765-.144-.5059-.3156-.0458-.0605-.1203-.178-.1055-.2844.0055-.0401.0261-.0985.0925-.1488.1182-.0894.3518-.1226.6096-.0867.3163.0441.6426.1938.6113.4186zm7.9305-.4114c.0111.0792-.049.201-.1531.3102-.0683.0717-.212.1961-.4079.2232a.5456.5456 0 0 1-.075.0052c-.2935 0-.5414-.2344-.5607-.3717-.024-.1765.2641-.3106.5611-.352.297-.0414.6111.0088.6356.1851z"/>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-800 font-sans">PostgreSQL</span>
                <span className="text-[9px] text-slate-400">Relational DB</span>
              </div>
            </div>
            {/* Tech 5: Vector Search */}
            <div className="p-4 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-800 font-sans">Vector Search</span>
                <span className="text-[9px] text-slate-400">RAG Retrieval</span>
              </div>
            </div>
            {/* Tech 6: Gemini */}
            <div className="p-4 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-center shadow-sm transition-all hover:scale-[1.02] hover:shadow-md gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="30%" stopColor="#9B72CB" />
                    <stop offset="70%" stopColor="#D96570" />
                    <stop offset="100%" stopColor="#F3AF42" />
                  </linearGradient>
                </defs>
                <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" fill="url(#gemini-grad)"/>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-800 font-sans">Gemini</span>
                <span className="text-[9px] text-slate-400">LLM Reasoning</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10. Roadmap Section ────────────────────────────────────────── */}
        <section id="roadmap" className="max-w-7xl mx-auto px-8 py-10 w-full">
          <div className="text-center mb-10">
            <span className="text-sm font-medium text-[#6B7280] tracking-widest">Strategic Release Plan</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111111] mt-2">Platform Roadmap</h2>
            <p className="text-sm text-[#52525B] mt-2">Active feature releases and future agent development timelines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Column 1: Today */}
            <div className="p-5 border border-slate-200/60 bg-white rounded-[10px] shadow-sm flex flex-col justify-between min-h-[200px]">
              <div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded tracking-wider">Today</span>
                <ul className="mt-4 space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    AI Chat & Tutoring
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    PDF / Document Ingestion
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Dynamic Markdown Parsing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Interactive Mermaid Diagrams
                  </li>
                </ul>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Current Release</span>
            </div>

            {/* Column 2: Next */}
            <div className="p-5 border border-slate-200/60 bg-white rounded-[10px] shadow-sm flex flex-col justify-between min-h-[200px]">
              <div>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-wider">Next</span>
                <ul className="mt-4 space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Personal Knowledge Base
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Coding Assistant Agent
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Git Repository Indexer
                  </li>
                </ul>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Active Development</span>
            </div>

            {/* Column 3: Future */}
            <div className="p-5 border border-slate-200/60 bg-white rounded-[10px] shadow-sm flex flex-col justify-between min-h-[200px]">
              <div>
                <span className="text-[9px] font-bold text-[#52525B] bg-slate-100 px-2 py-0.5 rounded tracking-wider">In Progress</span>
                <ul className="mt-4 space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Interactive DSA Compiler
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Auto-Learning Agent
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Data Science Copilot
                  </li>
                </ul>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider">Long Term Vision</span>
            </div>

          </div>
        </section>

        {/* ── 11. Open Source & Privacy ──────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-8 py-10 w-full text-center">
          <div className="max-w-2xl mx-auto mb-10">
            <span className="text-sm font-medium text-[#6B7280] tracking-widest block">Open & Secure</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111111] mt-2">Privacy First. Developer Trust.</h2>
            <p className="text-xs text-[#52525B] mt-2">Your data and keys stay yours. Open architecture built on developer trust.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
            
            {/* Card 1 */}
            <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] flex flex-col items-center justify-center">
              <span className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
                <Layers className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800">Open Architecture</span>
              <span className="text-[10px] text-[#52525B] mt-1 text-center text-justify">Run the code locally or extend modules.</span>
            </div>

            {/* Card 2 */}
            <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] flex flex-col items-center justify-center">
              <span className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
                <Cpu className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800">Bring Your Own Model</span>
              <span className="text-[10px] text-[#52525B] mt-1 text-center text-justify">Use your own keys for Gemini or OpenAI.</span>
            </div>

            {/* Card 3 */}
            <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] flex flex-col items-center justify-center">
              <span className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
                <Workflow className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800">Local Model Support</span>
              <span className="text-[10px] text-[#52525B] mt-1 text-center text-justify">Ollama integration for offline execution.</span>
            </div>

            {/* Card 4 */}
            <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] flex flex-col items-center justify-center">
              <span className="w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 mb-3">
                <Lock className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-slate-800">Privacy First</span>
              <span className="text-[10px] text-[#52525B] mt-1 text-center text-justify">No telemetry or sell-out on database data.</span>
            </div>

          </div>
        </section>

        {/* ── 12. FAQ Section ────────────────────────────────────────────── */}
        <section id="faq" className="max-w-7xl mx-auto px-8 py-10 w-full">
          <div className="text-center mb-10">
            <span className="text-sm font-medium text-[#6B7280] tracking-widest">Answering Questions</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111111] mt-2">Frequently Asked Questions</h2>
            <p className="text-xs text-[#52525B] mt-2">Everything you need to know about the architecture, hosting, and privacy.</p>
          </div>

          <div className="max-w-2xl mx-auto divide-y divide-slate-200/60">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group py-4 select-none [&[open]>summary]:mb-2 transition-all">
                <summary className="flex items-center justify-between font-semibold text-xs sm:text-sm text-slate-800 cursor-pointer focus:outline-none hover:text-[#111111]">
                  <span>{faq.q}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform duration-200" />
                </summary>
                <div className="text-xs text-[#52525B] leading-relaxed text-justify font-normal pt-1 select-text">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── 13. Final CTA ──────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-8 py-10 w-full text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#111111]">
              Ready to build your personal AI workspace?
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] max-w-md mx-auto">
              Experience a highly organized environment tailored for learning, coding, and analytics.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 items-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-[12.5px] font-semibold rounded-[6px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                Start Free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="https://github.com"
                className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12.5px] font-semibold rounded-[6px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                View GitHub
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ── 14. Footer ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-[#E5E7EB] bg-[#F7F7F7] pt-12 pb-8 w-full shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Logo info */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <Image src="/mentorai-symbol-only.svg" alt="MentorAI OS" width={16} height={16} className="w-4 h-4" />
                <span className="font-bold text-xs">MentorAI OS</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px]">
                The open architecture AI operating system for technical mastery, analytics, and RAG search.
              </p>
            </div>

            {/* Col 1: Product */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">Product</h4>
              <ul className="space-y-1.5 text-[11.5px] font-medium text-[#52525B]">
                <li><a href="#features" className="hover:text-[#111111] transition-colors">Features</a></li>
                <li><a href="#roadmap" className="hover:text-[#111111] transition-colors">Roadmap</a></li>
                <li><Link href="/login" className="hover:text-[#111111] transition-colors">Docs</Link></li>
              </ul>
            </div>

            {/* Col 2: Developers */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">Developers</h4>
              <ul className="space-y-1.5 text-[11.5px] font-medium text-[#52525B]">
                <li><a href="https://github.com" className="hover:text-[#111111] transition-colors">GitHub</a></li>
                <li><Link href="/login" className="hover:text-[#111111] transition-colors">API Docs</Link></li>
              </ul>
            </div>

            {/* Col 3: Company */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">Company</h4>
              <ul className="space-y-1.5 text-[11.5px] font-medium text-[#52525B]">
                <li><a href="#" className="hover:text-[#111111] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[#111111] transition-colors">Contact</a></li>
              </ul>
            </div>

          </div>

          <div className="mt-12 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400">
            <span>&copy; {new Date().getFullYear()} MentorAI OS. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-600">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600">Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
