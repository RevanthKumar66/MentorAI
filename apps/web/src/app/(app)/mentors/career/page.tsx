'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Briefcase, RefreshCw, BarChart, CheckSquare } from 'lucide-react';

interface CareerAnalysisReport {
  matchRate: number;
  strengths: string[];
  gaps: string[];
  verdict: string;
}

export default function CareerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  // Timeline state
  const [timelineSteps, setTimelineSteps] = useState([
    { id: 1, title: 'Optimize Core Resume Achievements', desc: 'Rewrite 3 key items using metric-driven accomplishments.', status: 'completed' },
    { id: 2, title: 'Refactor Capstone Projects', desc: 'Implement API optimization and write Jest testing suites.', status: 'current' },
    { id: 3, title: 'Perform Mock Technical Drills', desc: 'Conduct 5 sorting visualizer sweeps and dry-run recursion.', status: 'pending' },
    { id: 4, title: 'Audit LinkedIn Search Indexing', desc: 'Update headline text andFeatured project links.', status: 'pending' }
  ]);

  // Skills matrix state
  const [skills, setSkills] = useState([
    { name: 'React / Next.js', current: 80, target: 90 },
    { name: 'Node.js / Express', current: 65, target: 80 },
    { name: 'System Design Scaling', current: 40, target: 75 },
    { name: 'Docker / CI-CD', current: 30, target: 70 }
  ]);

  // Job Fit state
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<CareerAnalysisReport | null>(null);

  const toggleStepStatus = (id: number) => {
    setTimelineSteps(prev =>
      prev.map(step => {
        if (step.id === id) {
          const nextStatus = step.status === 'completed' ? 'pending' : step.status === 'current' ? 'completed' : 'current';
          return { ...step, status: nextStatus };
        }
        return step;
      })
    );
  };

  const calibrateSkill = (idx: number) => {
    setSkills(prev =>
      prev.map((skill, i) => {
        if (i === idx) {
          const nextVal = Math.min(skill.current + 10, 100);
          return { ...skill, current: nextVal };
        }
        return skill;
      })
    );
  };

  const analyzeJob = () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisReport({
        matchRate: 74,
        strengths: ['Expertise in React fits UI specifications', 'Experience scaling API pipelines matches backend requirements'],
        gaps: ['Job description requires Kubernetes deployment which is missing', 'Redis caching metrics is missing from skills portfolio'],
        verdict: 'Good match candidate. Minor tweaks in deployment keywords recommended.'
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  // 1. ACTION PLAN TIMELINE
  if (activeTab === 'plan') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Interactive Action Plan Timeline</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Fulfill milestones sequentially. Click on checklist markers to update progression.</p>
        </div>

        <div className="space-y-6 relative border-l border-slate-200 pl-6 ml-2.5">
          {timelineSteps.map((step) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            
            let bulletClass = 'bg-slate-200 border-white ring-2 ring-slate-100';
            if (isCompleted) bulletClass = 'bg-emerald-500 border-white ring-2 ring-emerald-100';
            else if (isCurrent) bulletClass = 'bg-violet-500 border-white ring-2 ring-violet-100 animate-pulse';

            return (
              <div key={step.id} className="relative space-y-1 text-left">
                <button
                  onClick={() => toggleStepStatus(step.id)}
                  className={`absolute -left-8 top-1 w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${bulletClass}`}
                  title="Click to toggle status"
                />
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    isCompleted ? 'bg-emerald-50 text-emerald-700' :
                    isCurrent ? 'bg-violet-50 text-violet-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {step.status}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. SKILLS MATRIX AUDIT
  if (activeTab === 'audit') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Skills Matrix Audit</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Measure current proficiencies against target market job requirements.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Tech Stack Calibration</h3>
          <div className="space-y-4">
            {skills.map((skill, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-[10.5px] font-bold">
                  <span className="text-slate-800">{skill.name}</span>
                  <div className="flex gap-2 items-center text-slate-550">
                    <span>Current: {skill.current}% (Target: {skill.target}%)</span>
                    <button
                      onClick={() => calibrateSkill(idx)}
                      className="px-2 py-0.5 border border-slate-250 bg-white hover:bg-slate-50 rounded text-[9px] font-bold text-slate-700 cursor-pointer shadow-3xs"
                    >
                      Calibrate +10%
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-violet-600 transition-all duration-350"
                    style={{ width: `${skill.current}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
                    style={{ left: `${skill.target}%` }}
                    title="Target Marker"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. JOB FIT ANALYSER
  if (activeTab === 'jobfit') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="space-y-1">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Job Fit Gap Analyst</h1>
          <p className="text-[11px] text-slate-500 font-semibold">Paste job specifications to audit technical compatibility indicators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Job Description Specs</span>
            <textarea
              placeholder="Paste job posting details here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-56 p-4 bg-white border border-slate-250 rounded-[10px] text-[11px] font-semibold focus:outline-none focus:border-slate-400 focus:shadow-xs shadow-inner"
            />
            <button
              onClick={analyzeJob}
              disabled={isAnalyzing}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10.5px] uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing compatibility...
                </>
              ) : (
                'Run Fit Analysis'
              )}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <BarChart className="w-4 h-4 text-violet-600" />
              Gap Report
            </h3>
            {analysisReport ? (
              <div className="space-y-4 text-[10.5px]">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[9.5px] font-bold text-slate-450 uppercase">Match Percentage</span>
                  <span className="text-md font-bold text-slate-900">{analysisReport.matchRate}% Match</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-bold text-emerald-850 block uppercase">Key Strengths Match</span>
                  <ul className="space-y-1 list-disc pl-4 text-slate-700 font-semibold">
                    {analysisReport.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-bold text-rose-850 block uppercase">Detected Gap Gaps</span>
                  <ul className="space-y-1 list-disc pl-4 text-slate-700 font-semibold">
                    {analysisReport.gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-44 flex flex-col justify-center items-center text-center text-slate-450 space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] font-semibold">Fill out specifications on the left to run gap audit.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. DEFAULT CAREER MENTOR DASHBOARD
  return (
    <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-violet-50/50 to-purple-50/30 border border-violet-200 rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-slate-900 tracking-tight mb-1">Career Planning Advisor</h2>
          <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
            Audit skill gaps, checklist target milestones, and optimize job fit matches.
          </p>
        </div>
        <button
          onClick={() => router.push('/mentors/career?tab=plan')}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-[10px] rounded-[6px] transition-colors shrink-0 uppercase tracking-widest shadow-xs cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5" /> Start Action Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Milestone tracker */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Milestone Progress</h3>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">1 of 4 Done</span>
            <span className="px-2 py-0.5 rounded bg-violet-50 border border-violet-250 text-violet-700 text-[8.5px] font-bold uppercase tracking-wider">In Progress</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Next task: Refactor Capstone Projects. Complete it to unlock mock technical drills.</p>
        </div>

        {/* Jobs Recommendations */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Recommended Tech Openings</h3>
          <div className="space-y-2">
            <div
              onClick={() => router.push('/mentors/career?tab=jobfit')}
              className="p-3 border border-slate-200 hover:border-slate-350 rounded-[8px] bg-slate-55/30 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-600" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-violet-650 transition-colors">Senior Software Engineer at Stripe</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">React, Node.js focus | 74% compatibility match</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-violet-600">Scan Job Fit →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
