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
  Cpu, 
  FileText, 
  Lock, 
  Play, 
  Upload, 
  Workflow, 
  Layers,
  Menu,
  X,
  GraduationCap,
  Trophy,
  Briefcase,
  Zap,
  BarChart3,
  Search
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
        
        <section className="relative w-full overflow-hidden">
          {/* Animated AI Waves Background converging to Center Logo */}
          <div 
            className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center"
            style={{
              maskImage: 'radial-gradient(circle, transparent 35%, black 75%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 35%, black 75%)'
            }}
          >
            <svg className="w-full h-full min-h-[500px]" viewBox="0 0 1000 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <style>{`
                @keyframes flowToCenter {
                  0% { stroke-dashoffset: 24; }
                  100% { stroke-dashoffset: 0; }
                }
                .converging-line-solid {
                  stroke: #111111;
                  stroke-width: 1px;
                  fill: none;
                  opacity: 0.10;
                }
                .converging-line-dashed {
                  stroke: #111111;
                  stroke-width: 1.2px;
                  fill: none;
                  opacity: 0.22;
                  stroke-dasharray: 6 8;
                  animation: flowToCenter 4s linear infinite;
                }
              `}</style>
              
              {/* Corner 1: Top-Left to Center */}
              <path className="converging-line-dashed" d="M 0,0 C 200,50 350,150 500,250" />
              <path className="converging-line-solid" d="M 0,100 C 200,120 350,180 500,250" />
              
              {/* Corner 2: Top-Right to Center */}
              <path className="converging-line-dashed" d="M 1000,0 C 800,50 650,150 500,250" />
              <path className="converging-line-solid" d="M 1000,100 C 800,120 650,180 500,250" />

              {/* Corner 3: Bottom-Left to Center */}
              <path className="converging-line-dashed" d="M 0,500 C 200,450 350,350 500,250" />
              <path className="converging-line-solid" d="M 0,400 C 200,380 350,320 500,250" />

              {/* Corner 4: Bottom-Right to Center */}
              <path className="converging-line-dashed" d="M 1000,500 C 800,450 650,350 500,250" />
              <path className="converging-line-solid" d="M 1000,400 C 800,380 650,320 500,250" />

              {/* Top & Bottom Edges */}
              <path className="converging-line-solid" d="M 500,0 C 480,80 490,160 500,250" />
              <path className="converging-line-dashed" d="M 250,0 C 300,80 400,160 500,250" />
              <path className="converging-line-dashed" d="M 750,0 C 700,80 600,160 500,250" />
              
              <path className="converging-line-solid" d="M 500,500 C 480,420 490,340 500,250" />
              <path className="converging-line-dashed" d="M 250,500 C 300,420 400,340 500,250" />
              <path className="converging-line-dashed" d="M 750,500 C 700,420 600,340 500,250" />

              {/* Left & Right Edges */}
              <path className="converging-line-solid" d="M 0,250 C 150,230 300,240 500,250" />
              <path className="converging-line-solid" d="M 1000,250 C 850,230 700,240 500,250" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-8 pt-16 pb-12 text-center flex-1 flex flex-col justify-center z-10">
            
            {/* Centered Large Logo Symbol above Hero */}
            <div className="flex justify-center mb-6 select-none animate-fade-in">
              <Image 
                src="/mentorai-symbol-only.svg" 
                alt="MentorAI Logo" 
                width={80}
                height={80}
                className="w-20 h-20 hover:rotate-12 transition-transform duration-300" 
              />
            </div>
  
            <h1 className="text-3xl sm:text-5xl font-bold text-[#111111] tracking-tight leading-[1.08] max-w-5xl mx-auto">
              Meet your specialized AI Mentors.
            </h1>
          
          <p className="mt-5 text-xs sm:text-sm text-[#52525B] max-w-xl mx-auto font-normal leading-relaxed">
            A unified operating system of expert AI agents and interactive sandboxes for learning, coding, analytics, and goal execution.
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
            <span className="text-sm font-medium text-[#6B7280] tracking-widest block uppercase">Unified Mentorship Hub</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">A Single Platform for Every Workflow</h2>
            <p className="text-sm text-[#52525B] font-normal mt-4 leading-relaxed max-w-2xl mx-auto">
              Stop switching tabs between ChatGPT, LeetCode, Notion, Jupyter, and scattered PDF readers. MentorAI OS converges specialized AI mentors into one unified workspace.
            </p>
          </div>

          {/* Workflow Diagram */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-3 items-center justify-center select-none text-xs text-[#52525B] font-medium font-sans">
            
            {/* Box 1: Students */}
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm flex flex-col items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-md min-h-[120px] w-full justify-center">
              <div className="w-8 h-8 rounded-[6px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7.5px] font-bold text-indigo-500 uppercase tracking-wider block">Students</span>
                <span className="text-[10px] font-bold text-slate-800 block mt-0.5">Learning Mentor</span>
                <span className="text-[8px] text-slate-400 block mt-0.5 font-medium">Replaces ChatGPT</span>
              </div>
            </div>

            {/* Box 2: Job Seekers */}
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm flex flex-col items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-md min-h-[120px] w-full justify-center">
              <div className="w-8 h-8 rounded-[6px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Trophy className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7.5px] font-bold text-indigo-500 uppercase tracking-wider block">Job Seekers</span>
                <span className="text-[10px] font-bold text-slate-800 block mt-0.5">DSA Coach</span>
                <span className="text-[8px] text-slate-400 block mt-0.5 font-medium">Replaces LeetCode</span>
              </div>
            </div>

            {/* Box 3: Researchers */}
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm flex flex-col items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-md min-h-[120px] w-full justify-center">
              <div className="w-8 h-8 rounded-[6px] bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Search className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7.5px] font-bold text-indigo-500 uppercase tracking-wider block">Researchers</span>
                <span className="text-[10px] font-bold text-slate-800 block mt-0.5">Research Assistant</span>
                <span className="text-[8px] text-slate-400 block mt-0.5 font-medium">Replaces Notion</span>
              </div>
            </div>

            {/* Box 4: Analysts */}
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm flex flex-col items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-md min-h-[120px] w-full justify-center">
              <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <BarChart3 className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7.5px] font-bold text-indigo-500 uppercase tracking-wider block">Analysts</span>
                <span className="text-[10px] font-bold text-slate-800 block mt-0.5">Data Science Mentor</span>
                <span className="text-[8px] text-slate-400 block mt-0.5 font-medium">Replaces Jupyter</span>
              </div>
            </div>

            {/* Box 5: Developers */}
            <div className="p-4 rounded-[8px] bg-white border border-slate-200/50 shadow-sm col-span-2 sm:col-span-1 flex flex-col items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-md min-h-[120px] w-full justify-center">
              <div className="w-8 h-8 rounded-[6px] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Code2 className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7.5px] font-bold text-indigo-500 uppercase tracking-wider block">Developers</span>
                <span className="text-[10px] font-bold text-slate-800 block mt-0.5">Coding Mentor</span>
                <span className="text-[8px] text-slate-400 block mt-0.5 font-medium">Replaces Scattered PDFs</span>
              </div>
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

        {/* ── 6. Meet Your AI Mentors (Mentor Catalog & Execution Environments) ─── */}
        <section id="features" className="max-w-7xl mx-auto px-8 py-12 w-full space-y-20">
          
          {/* Mentors Grid */}
          <div className="space-y-10">
            <div className="text-center">
              <span className="text-sm font-medium text-[#6B7280] tracking-widest block uppercase">Meet Your AI Mentors</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] mt-2">A Unified OS of Specialized Experts</h2>
              <p className="text-sm text-[#52525B] mt-3 max-w-xl mx-auto">
                Access a coordinated suite of specialized AI mentors, each trained for specific domains, logic pipelines, and study patterns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Learning Mentor */}
              <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-350 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Learning Mentor</h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                    Calibrates custom study roadmaps, translates materials into local language dialects, and adapts explanation complexity based on your educational style.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider uppercase">Adaptive Study Center</span>
              </div>

              {/* Card 2: Coding Assistant */}
              <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-350 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                    <Code2 className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Coding Mentor</h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                    Reviews code files, highlights logic errors, refactors complex components, recommends design patterns, and executes tests in interactive runtimes.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider uppercase">Interactive Sandbox</span>
              </div>

              {/* Card 3: DSA Coach */}
              <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-350 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
                    <Trophy className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">DSA Coach</h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                    Traces algorithms step-by-step, analyzes time and space complexity, runs dry tests, and recommends interview patterns.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider uppercase">Algorithmic Prep</span>
              </div>

              {/* Card 4: Data Science Copilot */}
              <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-350 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                    <BarChart3 className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Data Science Mentor</h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                    Ingests CSV tables, suggests feature engineering targets, performs automated exploratory data analysis (EDA), and compiles regression plots inline.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider uppercase">Dataset Analytics</span>
              </div>

              {/* Card 5: Research Assistant */}
              <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-350 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                    <Search className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Research Assistant</h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                    Synthesizes academic documentation, parses complex cross-references, extracts structured tables, and mines information from loaded context files.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider uppercase">Information Mining</span>
              </div>

              {/* Card 6: Career & Resume Mentor */}
              <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-350 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-[6px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                    <Briefcase className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Career & Resume Coach</h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed text-justify">
                    Critiques engineering resumes, analyzes keyword matches for target roles, and runs interactive, mock technical and behavioral interviews.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-6 block tracking-wider uppercase">Interview Readiness</span>
              </div>

              {/* Card 7: Momentum AI (Master Orchestrator) */}
              <div className="p-6 bg-white border border-slate-200/70 rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-350 transition-all flex flex-col md:col-span-3 items-center text-center justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-[8px] bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-md">Momentum AI (Autonomous Orchestrator)</h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed max-w-2xl text-center">
                    Our master coordination engine. Momentum AI orchestrates all underlying mentors to breakdown complex user goals, schedule focus sessions, sync tasks to your calendar, and predict productivity risks.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-teal-500 mt-4 block tracking-wider uppercase">Master Execution Engine</span>
              </div>

            </div>
          </div>

          {/* Runtimes Grid */}
          <div className="space-y-10 pt-8 border-t border-slate-200/50">
            <div className="text-center">
              <span className="text-sm font-medium text-[#6B7280] tracking-widest block uppercase">Interactive Sandboxes</span>
              <h2 className="text-3xl font-bold tracking-tight text-[#111111] mt-2">Multi-Language Execution Environments</h2>
              <p className="text-sm text-[#52525B] mt-3 max-w-xl mx-auto">
                No local dependencies required. Run your code in sandbox runtime environments managed directly inside the browser.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
              
              {/* Env 1: Python */}
              <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-between shadow-sm transition-all hover:scale-[1.01] hover:shadow-md min-h-[170px]">
                <div className="flex flex-col items-center gap-3">
                  <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.9 0C8.5 0 7.7.1 6.5.6c-1.9.8-2.3 2.1-2.4 4.5v1.8h4.5v.7H2.1C.9 8.2.1 9 .1 10.9v4.5c0 1.9.8 2.7 2 2.7h1.9v-2.7c0-1.5 1.2-2.7 2.7-2.7h5.4c1.5 0 2.7-1.2 2.7-2.7V4.7c0-1.5-1.2-2.7-2.7-2.7L11.9 0z" fill="#3776AB"/>
                    <path d="M12.1 24c3.4 0 4.2-.1 5.4-.6 1.9-.8 2.3-2.1 2.4-4.5v-1.8H15.4v-.7h6.5c1.2-.6 2-1.4 2-3.3V8.6c0-1.9-.8-2.7-2-2.7H20v2.7c0 1.5-1.2 2.7-2.7 2.7h-5.4c-1.5 0-2.7 1.2-2.7 2.7v5.4c0 1.5 1.2 2.7 2.7 2.7L12.1 24z" fill="#FFE873"/>
                    <circle cx="8.5" cy="3.5" r="0.75" fill="#FFF"/>
                    <circle cx="15.5" cy="20.5" r="0.75" fill="#111"/>
                  </svg>
                  <div>
                    <span className="text-[11.5px] font-bold text-slate-800 block">Python Sandbox</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">Execute scripts, filter data tables, and run math targets.</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider block mt-3 uppercase">Python 3.11</span>
              </div>

              {/* Env 2: TypeScript */}
              <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-between shadow-sm transition-all hover:scale-[1.01] hover:shadow-md min-h-[170px]">
                <div className="flex flex-col items-center gap-3">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#3178C6" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="4" />
                    <path d="M13.2 16.5c.3.5.7.8 1.4.8.6 0 1-.3 1-.7 0-.5-.4-.7-1.1-1-1-.4-2.2-.7-2.2-2.1 0-1.2 1-2.1 2.4-2.1 1.2 0 2 .5 2.5 1.5l-1.3.8c-.3-.5-.7-.8-1.2-.8-.5 0-.8.3-.8.6 0 .4.4.6 1.1.9 1.2.4 2.2.8 2.2 2 0 1.4-1.1 2.2-2.6 2.2-1.5 0-2.4-.8-2.8-1.7l1.3-.5zM7.2 9.4h5.2v1.3H9.8v7.2H8.5V10.7H7.2V9.4z" fill="#FFF"/>
                  </svg>
                  <div>
                    <span className="text-[11.5px] font-bold text-slate-800 block">TypeScript Runtime</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">Test JS scopes, closures, async callbacks, and types.</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider block mt-3 uppercase">Node v18</span>
              </div>

              {/* Env 3: C++ */}
              <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-between shadow-sm transition-all hover:scale-[1.01] hover:shadow-md min-h-[170px]">
                <div className="flex flex-col items-center gap-3">
                  <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" fill="#00599C"/>
                    <path d="M16 11h-3V8h-2v3H8v2h3v3h2v-3h3v-2zm5 0h-3V8h-2v3h-3v2h3v3h2v-3h3v-2z" fill="#FFF" opacity="0.8"/>
                    <path d="M12.5 7.5A4.5 4.5 0 0 0 8 12a4.5 4.5 0 0 0 4.5 4.5c1.8 0 3.3-1 4-2.5l-1.5-.7c-.5.9-1.4 1.5-2.5 1.5A2.8 2.8 0 0 1 9.7 12a2.8 2.8 0 0 1 2.8-2.8c1.1 0 2 .6 2.5 1.5l1.5-.7A4.5 4.5 0 0 0 12.5 7.5z" fill="#FFF"/>
                  </svg>
                  <div>
                    <span className="text-[11.5px] font-bold text-slate-800 block">C++ Compiler</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">Verify pointer structures, dry-run vectors, and compile algorithms.</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider block mt-3 uppercase">GCC v12</span>
              </div>

              {/* Env 4: SQL & Database */}
              <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-between shadow-sm transition-all hover:scale-[1.01] hover:shadow-md min-h-[170px]">
                <div className="flex flex-col items-center gap-3">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#336791" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698zM2.371 11.8765c-.7435-2.4358-1.1779-4.8851-1.2123-5.5719-.1086-2.1714.4171-3.6829 1.5623-4.4927 1.8367-1.2986 4.8398-.5408 6.108-.13-.0032.0032-.0066.0061-.0098.0094-2.0238 2.044-1.9758 5.536-1.9708 5.7495-.0002.0823.0066.1989.0162.3593.0348.5873.0996 1.6804-.0735 2.9184-.1609 1.1504.1937 2.2764.9728 3.0892.0806.0841.1648.1631.2518.2374-.3468.3714-1.1004 1.1926-1.9025 2.1576-.5677.6825-.9597.5517-1.0886.5087-.3919-.1307-.813-.5871-1.2381-1.3223-.4796-.839-.9635-2.0317-1.4155-3.5126z"/>
                  </svg>
                  <div>
                    <span className="text-[11.5px] font-bold text-slate-800 block">Database Console</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">Test B-Trees, relational tables, and analyze schema designs.</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider block mt-3 uppercase">Postgres 15</span>
              </div>

              {/* Env 5: Local Offline */}
              <div className="p-5 bg-white border border-slate-200/60 rounded-[8px] text-center flex flex-col items-center justify-between shadow-sm transition-all hover:scale-[1.01] hover:shadow-md min-h-[170px]">
                <div className="flex flex-col items-center gap-3">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  <div>
                    <span className="text-[11.5px] font-bold text-slate-800 block">Offline Runtimes</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">Run models locally with Ollama support (Llama, Mistral).</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider block mt-3 uppercase">Ollama Local</span>
              </div>

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
