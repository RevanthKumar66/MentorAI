'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText, ShieldAlert, Sparkles, Check, Clipboard, Copy, FileSpreadsheet,
  AlertTriangle, RefreshCw, BarChart3, Star, Heart, Eye, Download, Info
} from 'lucide-react';

export default function ResumePage() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section');

  // Resume builder state
  const [resumeData, setResumeData] = useState({
    name: 'Revanth Kumar',
    email: 'revanth@mentor.ai',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA',
    title: 'Senior Fullstack Engineer',
    skills: 'React, Node.js, Next.js, PostgreSQL, Redis, Docker, TypeScript',
    experience: 'Lead Fullstack Developer at SaaSify (2024-Present)\n- Led migration of monolithic APIs to microservices, reducing average query latency by 42%.\n- Mentored 4 junior engineers on React performance patterns.\n- Scaled server infrastructure to support 150K monthly active users.',
    education: 'B.S. in Computer Science - State University'
  });

  // ATS Scanner state
  const [jobDescription, setJobDescription] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Cover letter state
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Heat map states
  const [heatmapActive, setHeatmapActive] = useState(true);

  // Notification Toast
  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast('Copied to clipboard!');
  };

  const runATSScan = () => {
    if (!jobDescription.trim()) {
      triggerToast('Please paste a job description first');
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      // Parse keywords from JD
      const jdKeywords = ['redis', 'docker', 'system design', 'kubernetes', 'ci/cd', 'typescript'];
      const found = jdKeywords.filter(k => resumeData.skills.toLowerCase().includes(k) || resumeData.experience.toLowerCase().includes(k));
      const missing = jdKeywords.filter(k => !found.includes(k));
      const score = Math.round((found.length / jdKeywords.length) * 100);

      setScanResult({
        score,
        found,
        missing,
        verdict: score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Weak Match - Optimization Required'
      });
      setIsScanning(false);
    }, 1500);
  };

  const generateCoverLetter = () => {
    if (!company || !roleTitle) {
      triggerToast('Please enter both company and role title');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setCoverLetter(`Dear Hiring Team at ${company},\n\nI am writing to express my strong interest in the ${roleTitle} position. With over 5 years of experience in system design and development, and a proven track record of reducing latency by 42% at SaaSify using Node.js and Redis, I am confident in my ability to add immediate value to your engineering team.\n\nMy core technical stack aligns closely with your needs, specifically my deep expertise in React, Next.js, and backend database optimization. I look forward to the opportunity to discuss how my technical skills and leadership experience can support ${company}'s goals.\n\nSincerely,\n${resumeData.name}`);
      setIsGenerating(false);
    }, 1800);
  };

  // 1. ATS SCANNER VIEW
  if (activeSection === 'ats') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded shadow-lg z-50">
            {toast}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">ATS Keyword scanner</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Verify compliance against target job descriptions using RAG parsing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Job Description</span>
            <textarea
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-64 p-4 bg-white border border-slate-250 rounded-[10px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 focus:shadow-xs shadow-inner"
            />
            <button
              onClick={runATSScan}
              disabled={isScanning}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10.5px] uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Running ATS Analysis...
                </>
              ) : (
                'Scan Match Score'
              )}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-tight">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Analysis Report
            </h3>
            {scanResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-450 uppercase block">Match Score</span>
                    <span className="text-md font-bold text-slate-900">{scanResult.score}%</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase ${
                    scanResult.score >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    scanResult.score >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {scanResult.verdict}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9.5px] font-bold text-emerald-850 block uppercase">Matching Keywords Found</span>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.found.map((k: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-[4px] border border-emerald-150">
                        {k}
                      </span>
                    ))}
                    {scanResult.found.length === 0 && <span className="text-[10.5px] text-slate-400 italic">None detected</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9.5px] font-bold text-rose-850 block uppercase">Missing Keywords (Action Required)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.missing.map((k: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-semibold rounded-[4px] border border-rose-150">
                        +{k}
                      </span>
                    ))}
                    {scanResult.missing.length === 0 && <span className="text-[10.5px] text-slate-400 italic">None! Resume is fully optimized.</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
                <Info className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] font-semibold">Paste job specifications on the left to measure keyword compliance.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. COVER LETTER GENERATOR VIEW
  if (activeSection === 'cover') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded shadow-lg z-50">
            {toast}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">AI Cover Letter Generator</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Draft tailored introduction letters calibrated with your resume metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Job Parameters</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Google, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 shadow-inner bg-slate-50/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Developer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 shadow-inner bg-slate-50/50"
                />
              </div>
              <button
                onClick={generateCoverLetter}
                disabled={isGenerating}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10.5px] uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Generating Cover Letter...
                  </>
                ) : (
                  'Generate Letter'
                )}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Generated Output</span>
                {coverLetter && (
                  <button
                    onClick={() => handleCopy(coverLetter)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-[9.5px] font-semibold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                )}
              </div>
              {coverLetter ? (
                <pre className="text-[10.5px] font-semibold leading-relaxed text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 p-4 border border-slate-200 rounded-[8px]">
                  {coverLetter}
                </pre>
              ) : (
                <div className="h-48 flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300" />
                  <p className="text-[11px] font-semibold">Enter parameters on the left and trigger generation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. LINKEDIN PROFILER VIEW
  if (activeSection === 'linkedin') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">LinkedIn Optimization checklist</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Enhance visibility and search indexing configurations for hiring recruiters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Profile Enhancement Guide</h3>
            <div className="space-y-4">
              <div className="flex gap-3 items-start border-b border-slate-100 pb-3">
                <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center text-[10.5px] text-emerald-600 shrink-0 font-bold">1</span>
                <div>
                  <h4 className="text-[11.5px] font-bold text-slate-800">Optimize Headline Keywords</h4>
                  <p className="text-[10.5px] text-slate-500 leading-normal mt-0.5">Instead of just &ldquo;Developer at SaaSify&rdquo;, use &ldquo;Senior Fullstack Engineer | Next.js, Node.js, Redis | Scaling Web Infrastructure&rdquo;.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start border-b border-slate-100 pb-3">
                <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center text-[10.5px] text-emerald-600 shrink-0 font-bold">2</span>
                <div>
                  <h4 className="text-[11.5px] font-bold text-slate-800">Structure &ldquo;About&rdquo; section with Impact Metrics</h4>
                  <p className="text-[10.5px] text-slate-500 leading-normal mt-0.5">Write a 3-paragraph summary detailing core specializations, accomplishments with numbers, and call to action.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-250 flex items-center justify-center text-[10.5px] text-slate-600 shrink-0 font-bold">3</span>
                <div>
                  <h4 className="text-[11.5px] font-bold text-slate-800">Pin Showcase Projects</h4>
                  <p className="text-[10.5px] text-slate-500 leading-normal mt-0.5">Link your top GitHub projects with a visual card preview under the Featured profile section.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/40 to-slate-50 border border-indigo-200 rounded-[12px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Headline Suggestions
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-white border border-indigo-150 rounded-[8px] text-[10.5px] font-semibold text-slate-700 leading-relaxed shadow-2xs">
                &ldquo;Senior Fullstack Engineer | React & Next.js | Building Scalable API Architectures&rdquo;
              </div>
              <div className="p-3 bg-white border border-indigo-150 rounded-[8px] text-[10.5px] font-semibold text-slate-700 leading-relaxed shadow-2xs">
                &ldquo;Senior Software Engineer | Specialized in Frontend Performance & Database Optimization&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. RECRUITER HEAT MAP SIMULATOR
  if (activeSection === 'recruiter') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="flex justify-between items-center border-b border-slate-150 pb-4">
          <div>
            <h1 className="text-md font-bold text-slate-900 tracking-tight">Recruiter View Simulator</h1>
            <p className="text-[11px] text-slate-500 font-semibold">Simulate recruiter scanning behaviors to verify document visual layout density.</p>
          </div>
          <button
            onClick={() => setHeatmapActive(!heatmapActive)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[9.5px] rounded-[6px] transition-colors cursor-pointer uppercase tracking-wider"
          >
            <Eye className="w-4 h-4" /> {heatmapActive ? 'Disable Heatmap' : 'Enable Heatmap'}
          </button>
        </div>

        {/* The simulated page sheet with overlays */}
        <div className="bg-slate-100 p-8 rounded-[12px] border border-slate-200/80 shadow-inner flex justify-center">
          <div className="bg-white max-w-xl w-full p-8 border border-slate-300 shadow-md relative font-sans text-slate-800 text-[10.5px] leading-relaxed select-none">
            
            {/* Heat map visual overlays */}
            {heatmapActive && (
              <div className="absolute inset-0 pointer-events-none opacity-50 z-20 transition-opacity">
                {/* Visual heat map bubbles */}
                <div className="absolute top-10 left-10 w-28 h-20 bg-rose-500 rounded-full filter blur-xl opacity-80" />
                <div className="absolute top-14 left-1/3 w-32 h-16 bg-orange-400 rounded-full filter blur-xl opacity-70" />
                <div className="absolute top-44 left-12 w-44 h-16 bg-amber-400 rounded-full filter blur-xl opacity-60" />
                <div className="absolute top-64 left-10 w-24 h-12 bg-rose-500 rounded-full filter blur-xl opacity-75" />
                <div className="absolute bottom-20 left-16 w-36 h-12 bg-yellow-300 rounded-full filter blur-lg opacity-40" />
              </div>
            )}

            {/* Header info */}
            <div className="text-center space-y-1 border-b border-slate-200 pb-3">
              <h2 className="text-md font-bold text-slate-900">{resumeData.name}</h2>
              <p className="text-slate-500 font-semibold">{resumeData.title}</p>
              <p className="text-[9.5px] text-slate-400">{resumeData.email} | {resumeData.phone} | {resumeData.location}</p>
            </div>

            {/* Resume Content */}
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 border-b border-slate-150 uppercase text-[9.5px] tracking-wider">Professional Summary</h3>
                <p className="text-slate-700">Calibrated system architecture specialist with extensive project execution portfolios in cloud environments. Proven developer skilled in web optimization.</p>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 border-b border-slate-150 uppercase text-[9.5px] tracking-wider">Work Experience</h3>
                <div className="whitespace-pre-wrap text-slate-700">
                  {resumeData.experience}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 border-b border-slate-150 uppercase text-[9.5px] tracking-wider">Technical Skills</h3>
                <p className="text-slate-700 font-semibold">{resumeData.skills}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 5. LIVE RESUME BUILDER FORM VIEW
  if (activeSection) {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded shadow-lg z-50">
            {toast}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Interactive Resume Builder</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Modify content nodes dynamically and view standard A4 compliance sheets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Builder Form Inputs */}
          <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-2">Edit Sections</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.name}
                    onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                    className="w-full px-3.5 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Target Title</label>
                  <input
                    type="text"
                    value={resumeData.title}
                    onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                    className="w-full px-3.5 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Email</label>
                  <input
                    type="text"
                    value={resumeData.email}
                    onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    className="w-full px-3.5 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Phone</label>
                  <input
                    type="text"
                    value={resumeData.phone}
                    onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                    className="w-full px-3.5 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Technical Skills</label>
                <input
                  type="text"
                  value={resumeData.skills}
                  onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                  className="w-full px-3.5 py-1.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-slate-500 uppercase block mb-1">Work Experience</label>
                <textarea
                  value={resumeData.experience}
                  onChange={(e) => setResumeData({ ...resumeData, experience: e.target.value })}
                  className="w-full h-36 p-3.5 border border-slate-250 rounded-[8px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/50 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Paper */}
          <div className="bg-slate-100 p-6 rounded-[12px] border border-slate-200 shadow-inner flex justify-center">
            <div className="bg-white w-full p-6 border border-slate-350 shadow-sm relative font-sans text-slate-800 text-[10px] leading-relaxed">
              <div className="text-center border-b border-slate-200 pb-2 mb-3">
                <h2 className="text-xs font-bold text-slate-900">{resumeData.name}</h2>
                <p className="text-[9px] text-slate-500 font-semibold">{resumeData.title}</p>
                <p className="text-[8.5px] text-slate-400">{resumeData.email} | {resumeData.phone} | {resumeData.location}</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 border-b border-slate-150 uppercase text-[8.5px] tracking-wider">Experience</h4>
                  <p className="whitespace-pre-wrap text-slate-700 font-medium">{resumeData.experience}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 border-b border-slate-150 uppercase text-[8.5px] tracking-wider">Technical Skills</h4>
                  <p className="text-slate-700 font-medium">{resumeData.skills}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 border-b border-slate-150 uppercase text-[8.5px] tracking-wider">Education</h4>
                  <p className="text-slate-700 font-medium">{resumeData.education}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. DEFAULT RESUME AI DASHBOARD
  return (
    <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border border-emerald-200 rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-slate-900 tracking-tight mb-1">AI Resume Calibration</h2>
          <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
            Scan compliance scores, optimize missing keywords, or build targeted CV profiles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ATS score widget */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Active ATS Audit</h3>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">78/100</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[8.5px] font-bold uppercase tracking-wider">Needs Optimization</span>
          </div>
          <div className="space-y-2 text-[10.5px] font-semibold text-slate-650">
            <div className="flex gap-2 items-start text-rose-700">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Missing keywords: Kubernetes, CI/CD</span>
            </div>
            <div className="flex gap-2 items-start text-rose-700">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Resume has no quantifiable performance metrics in project section</span>
            </div>
          </div>
        </div>

        {/* Resume versions list */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Saved Resume Versions</h3>
          <div className="space-y-2">
            <div className="p-3 border border-slate-200 hover:border-slate-350 rounded-[8px] bg-slate-55/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block">General Fullstack Engineer Profile (Primary)</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Last modified: Yesterday</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-emerald-600">Active</span>
            </div>
            <div className="p-3 border border-slate-250 rounded-[8px] bg-white transition-all flex items-center justify-between opacity-80">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block">Lead Platform Architect target</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Last modified: June 15, 2026</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-slate-500">Draft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
