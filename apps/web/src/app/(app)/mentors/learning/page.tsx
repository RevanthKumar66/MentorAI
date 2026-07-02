'use client';

import React, { useState, useEffect } from 'react';
import { useLearning, LanguageType, LearningStyleType } from './context';
import { LESSON_DATABASE } from './courses-db';
import {
  BookOpen, Clock, ArrowRight, ArrowLeft, Bookmark,
  CheckCircle, Play, HelpCircle, Check, X, Code, ExternalLink, Flame,
  Award, FileText, Download, RefreshCw, BookOpenCheck,
  GraduationCap
} from 'lucide-react';

export default function LearningPage() {
  const {
    language,
    learningStyle,
    accessibility,
    activeLessonId,
    setActiveLessonId,
    onboardingData,
    setOnboardingData,
    roadmap,
    setRoadmap,
    bookmarks,
    toggleBookmark,
    completedLessons,
    toggleComplete,
    notes,
    saveNote,
    isNotesPanelOpen,
    setIsNotesPanelOpen,
    resetOnboarding
  } = useLearning();

  // Onboarding form state
  const [onboardForm, setOnboardForm] = useState({
    education: '',
    profession: '',
    experience: '',
    careerGoal: '',
    targetCompanies: [] as string[],
    targetRole: '',
    programmingLanguages: [] as string[],
    interestedSubjects: [] as string[],
    learningStyle: 'Theory & Explanations' as LearningStyleType,
    preferredLanguage: 'Simple English' as LanguageType,
    dailyTime: '1 hour',
    weeklyDays: '5 days',
    motivation: '',
  });

  // Sandbox state
  const [codeText, setCodeText] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [sandboxPassed, setSandboxPassed] = useState<boolean | null>(null);

  // Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(false);

  // Notes state
  const [localNoteText, setLocalNoteText] = useState('');
  const [noteTagInput, setNoteTagInput] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);

  const activeLesson = LESSON_DATABASE[activeLessonId];

  // Adjust state during render when the active lesson changes
  const [prevLessonId, setPrevLessonId] = useState(activeLessonId);
  if (activeLessonId !== prevLessonId) {
    setPrevLessonId(activeLessonId);
    if (activeLesson) {
      setCodeText(activeLesson.codeSandbox?.initialCode || activeLesson.codeBlock || '');
      setConsoleOutput([]);
      setSandboxPassed(null);
      setSelectedOption(null);
      setQuizSubmitted(false);
      setLocalNoteText(notes[activeLessonId] || '');
    }
  }

  // Redirect to dashboard if activeLessonId is invalid
  useEffect(() => {
    if (activeLessonId && !activeLesson) {
      setActiveLessonId('');
    }
  }, [activeLessonId, activeLesson, setActiveLessonId]);

  // Handle Onboarding Roadmap generation
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingData(onboardForm);

    // Generate personalized roadmap list
    const generatedRoadmap = {
      title: `${onboardForm.targetRole || 'Software'} Roadmap`,
      createdAt: new Date().toLocaleDateString(),
      phases: [
        {
          name: 'Phase 1: Fundamental Concept Calibration',
          items: [
            { id: 'dbms-indexing', title: 'Database Indexing & B-Trees', details: 'Critical for backend queries scaling' },
            { id: 'python-basics', title: 'Python Dynamics & Memory Labels', details: 'Core dynamic programming foundations' }
          ]
        },
        {
          name: 'Phase 2: Advanced Systems & Concurrency',
          items: [
            { id: 'os-concurrency', title: 'Threads, Concurrency & Deadlocks', details: 'Understanding multi-core execution traps' },
            { id: 'sysdesign-hashing', title: 'Consistent Hashing & Partitioning', details: 'Distributed systems scaling core architecture' }
          ]
        }
      ]
    };
    setRoadmap(generatedRoadmap);
  };

  // Compile sandbox code simulation
  const runCodeSandbox = () => {
    if (!activeLesson?.codeSandbox) return;
    setIsCompiling(true);
    setConsoleOutput(['Initializing compilation environment...', 'Linking code modules...']);

    setTimeout(() => {
      const testCases = activeLesson.codeSandbox!.testCases;
      const cleanCode = codeText.replace(/\s+/g, ' ').trim();
      const outputs: string[] = [];

      let passedCount = 0;
      testCases.forEach((tc, idx) => {
        // Simple verification regex or keyword match
        const isMatched = cleanCode.toLowerCase().includes(tc.expected.toLowerCase());
        if (isMatched) {
          passedCount++;
          outputs.push(`[✓] Test ${idx + 1}: ${tc.description} - Passed`);
        } else {
          outputs.push(`[✗] Test ${idx + 1}: ${tc.description} - Failed (Expected match with '${tc.expected}')`);
        }
      });

      if (passedCount === testCases.length) {
        setSandboxPassed(true);
        outputs.push('SUCCESS: All test cases passed successfully!');
      } else {
        setSandboxPassed(false);
        outputs.push('ERROR: Verification failed. Check compiler specifications.');
      }

      setConsoleOutput(outputs);
      setIsCompiling(false);
    }, 1200);
  };

  // Bottom Navigation helper
  const handlePrevLesson = () => {
    const keys = Object.keys(LESSON_DATABASE);
    const currIndex = keys.indexOf(activeLessonId);
    if (currIndex > 0) {
      setActiveLessonId(keys[currIndex - 1]);
    }
  };

  const handleNextLesson = () => {
    const keys = Object.keys(LESSON_DATABASE);
    const currIndex = keys.indexOf(activeLessonId);
    if (currIndex !== -1 && currIndex < keys.length - 1) {
      setActiveLessonId(keys[currIndex + 1]);
    }
  };



  // Helper: Export Notes
  const exportNotesToMarkdown = () => {
    const markdownContent = `# Learning Mentor Notes - ${activeLesson?.title}
Created on: ${new Date().toLocaleDateString()}
Target Goal: ${onboardingData?.targetRole}
Language: ${language}

## Notes
${localNoteText}

## Tags
${noteTags.join(', ')}
`;
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeLessonId}-notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Font sizing helper
  const fontSizes = {
    sm: 'text-xs',
    md: 'text-[11.5px] leading-relaxed',
    lg: 'text-sm leading-relaxed',
    xl: 'text-md leading-relaxed',
  };

  // Rendering Helper: custom diagrams based on lesson
  const renderVisualDiagram = () => {
    if (activeLessonId === 'dbms-indexing') {
      return (
        <div className="bg-slate-900 rounded-[6px] p-5 my-6 border border-slate-800 shadow-sm relative overflow-hidden">
          <span className="text-[9px] font-bold text-indigo-400 block uppercase tracking-wider mb-3">
            B-Tree Hierarchical Node Traversal Simulator
          </span>
          <div className="flex flex-col items-center gap-5">
            {/* Root */}
            <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-[6px] text-slate-100 text-[10px] text-center">
              <span className="font-bold text-slate-400 block mb-0.5">Root Node [100px Offset]</span>
              Keys: [ 20 | 50 ]
            </div>
            {/* Arrows */}
            <div className="flex justify-between w-64 text-indigo-500">
              <div className="text-center w-1/3">↙ Value &lt; 20</div>
              <div className="text-center w-1/3 text-emerald-500">↓ 20 ≤ Value &lt; 50</div>
              <div className="text-center w-1/3">↘ Value ≥ 50</div>
            </div>
            {/* Child levels */}
            <div className="flex justify-center items-center gap-4 w-full">
              <div className="px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-[6px] text-slate-350 text-[9.5px]">
                Keys: [ 10 | 15 ]
              </div>
              <div className="px-3 py-1.5 bg-indigo-950/80 border border-indigo-700 rounded-[6px] text-slate-200 text-[9.5px] ring-1 ring-indigo-500">
                <span className="font-bold text-indigo-400 block">Matched Node (Search: 30)</span>
                Keys: [ 30 | 42 ]
              </div>
              <div className="px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-[6px] text-slate-350 text-[9.5px]">
                Keys: [ 60 | 85 ]
              </div>
            </div>
            {/* Leaf layer links */}
            <div className="w-full flex items-center justify-center gap-1.5 border-t border-slate-800 pt-3 mt-1">
              <span className="text-[8.5px] font-bold text-emerald-500 uppercase tracking-widest mr-2">Contiguous Leaves:</span>
              <div className="px-2 py-1 bg-slate-800 text-[9px] rounded">10 ⇄ 15</div>
              <div className="px-2 py-1 bg-indigo-900 border border-emerald-500 text-[9px] rounded text-emerald-400">30 ⇄ 31 ⇄ 35 ⇄ 42</div>
              <div className="px-2 py-1 bg-slate-800 text-[9px] rounded">60 ⇄ 85</div>
            </div>
          </div>
        </div>
      );
    }

    if (activeLessonId === 'os-concurrency') {
      return (
        <div className="bg-slate-900 rounded-[6px] p-5 my-6 border border-slate-800 shadow-sm text-center">
          <span className="text-[9px] font-bold text-rose-400 block uppercase tracking-wider mb-4">
            Deadlock Circular Wait Standstill Visualizer
          </span>
          <div className="flex justify-center items-center gap-8">
            <div className="p-3 bg-slate-850 border border-slate-750 rounded-[6px] text-[10px] text-slate-200 max-w-[140px]">
              <span className="font-bold text-rose-400 block mb-1">Thread A</span>
              Holds: Resource 1<br />
              Requests: Resource 2
            </div>
            <div className="flex flex-col items-center">
              <span className="text-rose-500 font-bold text-[9px] uppercase tracking-widest animate-pulse">Standstill Lock</span>
              <div className="h-0.5 w-16 bg-gradient-to-r from-rose-500 to-indigo-500 my-1" />
              <span className="text-[12px]">⇄</span>
            </div>
            <div className="p-3 bg-slate-850 border border-slate-750 rounded-[6px] text-[10px] text-slate-200 max-w-[140px]">
              <span className="font-bold text-rose-400 block mb-1">Thread B</span>
              Holds: Resource 2<br />
              Requests: Resource 1
            </div>
          </div>
        </div>
      );
    }

    if (activeLessonId === 'sysdesign-hashing') {
      return (
        <div className="bg-slate-900 rounded-[6px] p-5 my-6 border border-slate-800 shadow-sm text-center flex flex-col items-center">
          <span className="text-[9px] font-bold text-teal-400 block uppercase tracking-wider mb-4">
            Consistent Hash Ring Node Router
          </span>
          <div className="relative w-36 h-36 border border-slate-700 border-dashed rounded-full flex items-center justify-center">
            {/* Ring nodes */}
            <span className="absolute top-1 px-1.5 py-0.5 bg-slate-850 text-slate-350 text-[8px] rounded border border-slate-700">Server A (30°)</span>
            <span className="absolute right-1 px-1.5 py-0.5 bg-slate-850 text-slate-350 text-[8px] rounded border border-slate-700">Server B (120°)</span>
            <span className="absolute bottom-1 px-1.5 py-0.5 bg-slate-850 text-slate-350 text-[8px] rounded border border-slate-700">Server C (270°)</span>

            {/* Request routing marker */}
            <div className="text-center z-10">
              <span className="text-[10px] text-teal-400 font-bold block uppercase">Client Req</span>
              <span className="text-[8px] text-slate-400 block">Hash: 85°</span>
              <span className="text-[8px] text-emerald-400 font-semibold block mt-1">→ Route B</span>
            </div>

            {/* Arrow indicators */}
            <div className="absolute inset-0 rounded-full border-t border-teal-500 border-r animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>
      );
    }

    return null;
  };

  // ==================== VIEW 1: FIRST-TIME ONBOARDING FLOW ====================
  if (!onboardingData) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-transparent border border-slate-250 flex items-center justify-center mx-auto text-slate-850">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-md font-semibold text-slate-900 tracking-tight">Personalize Learning</h1>
          <p className="text-[11px] text-slate-750 leading-normal max-w-xs mx-auto text-center">
            Configure your adaptive study roadmap.
          </p>
        </div>

        <form onSubmit={handleOnboardingSubmit} className="bg-transparent border border-slate-200/60 rounded-[6px] p-6 space-y-5">
          {/* Row 1: Education, Profession, Experience */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Current Education</label>
              <select
                required
                value={onboardForm.education}
                onChange={(e) => setOnboardForm({ ...onboardForm, education: e.target.value })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value="">Select Level</option>
                <option value="Undergrad Student">Undergraduate Student</option>
                <option value="Graduate Student">Graduate Student</option>
                <option value="Self-Taught">Self-Taught</option>
                <option value="Bootcamp Graduate">Bootcamp Graduate</option>
                <option value="High School">High School</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Current Profession</label>
              <select
                required
                value={onboardForm.profession}
                onChange={(e) => setOnboardForm({ ...onboardForm, profession: e.target.value })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value="">Select Profession</option>
                <option value="Student">Full-time Student</option>
                <option value="Junior Dev">Junior Developer</option>
                <option value="System Admin">System Administrator</option>
                <option value="Non-Tech Transition">Non-Tech Transition</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Years of Experience</label>
              <input
                type="text"
                required
                placeholder="e.g., 1 year or None"
                value={onboardForm.experience}
                onChange={(e) => setOnboardForm({ ...onboardForm, experience: e.target.value })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Career Goal, Target Role, Preferred Language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Career Goal Target</label>
              <input
                type="text"
                required
                placeholder="e.g., Senior Systems Architect"
                value={onboardForm.careerGoal}
                onChange={(e) => setOnboardForm({ ...onboardForm, careerGoal: e.target.value })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Target Role</label>
              <input
                type="text"
                required
                placeholder="e.g., Backend Developer"
                value={onboardForm.targetRole}
                onChange={(e) => setOnboardForm({ ...onboardForm, targetRole: e.target.value })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Preferred Language</label>
              <select
                value={onboardForm.preferredLanguage}
                onChange={(e) => setOnboardForm({ ...onboardForm, preferredLanguage: e.target.value as LanguageType })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value="Simple English">Simple English</option>
                <option value="Professional English">Professional English</option>
                <option value="Telugu + English Mixed">Telugu + English Mixed</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
              </select>
            </div>
          </div>

          {/* Row 3: Explanation Style, Daily Time, Weekly Days */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Explanation Style</label>
              <select
                value={onboardForm.learningStyle}
                onChange={(e) => setOnboardForm({ ...onboardForm, learningStyle: e.target.value as LearningStyleType })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value="Theory & Explanations">Theory & Explanations</option>
                <option value="Code & Practical Examples Heavy">Code & Practical Examples</option>
                <option value="Interview Prep & Leetcode Focus">Interview Prep Focus</option>
                <option value="Project-Based Building">Project-Based Building</option>
                <option value="Visual Learning">Visual Learning</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Daily Study Time</label>
              <select
                value={onboardForm.dailyTime}
                onChange={(e) => setOnboardForm({ ...onboardForm, dailyTime: e.target.value })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value="30 minutes">30 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="2 hours">2 hours</option>
                <option value="3 hours">3 hours</option>
                <option value="4+ hours">4+ hours</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Weekly Days</label>
              <select
                value={onboardForm.weeklyDays}
                onChange={(e) => setOnboardForm({ ...onboardForm, weeklyDays: e.target.value })}
                className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value="2 days">2 days</option>
                <option value="3 days">3 days</option>
                <option value="4 days">4 days</option>
                <option value="5 days">5 days</option>
                <option value="6 days">6 days</option>
                <option value="7 days">7 days</option>
              </select>
            </div>
          </div>

          {/* Target Companies (Checkboxes) */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Target Companies</label>
            <div className="grid grid-cols-3 gap-2">
              {['All', 'FAANG / Big Tech', 'Unicorn Startups', 'Enterprise SaaS', 'Finance Tech', 'Agencies'].map((c) => {
                const isChecked = onboardForm.targetCompanies.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (c === 'All') {
                        setOnboardForm({
                          ...onboardForm,
                          targetCompanies: isChecked
                            ? []
                            : ['All', 'FAANG / Big Tech', 'Unicorn Startups', 'Enterprise SaaS', 'Finance Tech', 'Agencies'],
                        });
                      } else {
                        const newSelection = isChecked
                          ? onboardForm.targetCompanies.filter((x) => x !== c && x !== 'All')
                          : [...onboardForm.targetCompanies.filter(x => x !== 'All'), c];
                        
                        const othersSelected = ['FAANG / Big Tech', 'Unicorn Startups', 'Enterprise SaaS', 'Finance Tech', 'Agencies'].every(x => newSelection.includes(x));
                        if (othersSelected) {
                          setOnboardForm({
                            ...onboardForm,
                            targetCompanies: ['All', ...newSelection],
                          });
                        } else {
                          setOnboardForm({
                            ...onboardForm,
                            targetCompanies: newSelection,
                          });
                        }
                      }
                    }}
                    className={`p-2 border rounded-[6px] text-center text-[10px] font-semibold transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/25 border-emerald-600 text-emerald-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Programming Languages */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Programming Languages of Interest</label>
            <div className="grid grid-cols-4 gap-2">
              {['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'Rust', 'Go', 'SQL'].map((lang) => {
                const isChecked = onboardForm.programmingLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setOnboardForm({
                        ...onboardForm,
                        programmingLanguages: isChecked
                          ? onboardForm.programmingLanguages.filter((x) => x !== lang)
                          : [...onboardForm.programmingLanguages, lang],
                      });
                    }}
                    className={`p-2 border rounded-[6px] text-center text-[10.5px] font-semibold transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50/25 border-emerald-600 text-emerald-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motivation Text Area */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-slate-750 tracking-wide block">Learning Motivation</label>
            <textarea
              required
              rows={2}
              placeholder="e.g., Seeking to land a job at Google in 6 months."
              value={onboardForm.motivation}
              onChange={(e) => setOnboardForm({ ...onboardForm, motivation: e.target.value })}
              className="w-full p-2 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-[6px] font-semibold text-[10.5px] tracking-wide transition-colors cursor-pointer shadow-xs"
          >
            Calibrate Adaptive Roadmap
          </button>
        </form>
      </div>
    );
  }

  // ==================== VIEW 2: PERSONALIZED LEARNING DASHBOARD ====================
  if (!activeLessonId || !activeLesson) {
    return (
      <div className="w-full px-8 md:px-14 py-8 space-y-8 animate-fade-in pb-20">
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-md font-semibold text-slate-900 tracking-tight">Adaptive Study Center</h1>
            <p className="text-[11px] text-slate-700 leading-normal max-w-lg text-justify">
              Your customized roadmap has been initialized. Jump back in or take diagnostic checks. The system updates your analytics as you read chapters and pass code sandboxes.
            </p>
          </div>
          <button
            onClick={() => setActiveLessonId('dbms-indexing')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10.5px] rounded-[6px] transition-colors shrink-0 tracking-wide shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Continue Learning
          </button>
        </div>

        {/* Top analytics metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-[6px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0 text-emerald-600">
              <Flame className="w-4 h-4 fill-emerald-100" />
            </div>
            <div>
              <span className="text-[8.5px] font-semibold text-slate-600 block tracking-wide">Active Streak</span>
              <span className="text-sm font-bold text-slate-800">5 Days</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[6px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 text-blue-600">
              <BookOpenCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[8.5px] font-semibold text-slate-600 block tracking-wide">Completions</span>
              <span className="text-sm font-bold text-slate-800">{completedLessons.length} Lessons</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[6px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[8.5px] font-semibold text-slate-600 block tracking-wide">Hours Tracked</span>
              <span className="text-sm font-bold text-slate-800">4.2 Hours</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[6px] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[8.5px] font-semibold text-slate-600 block tracking-wide">Quiz Accuracy</span>
              <span className="text-sm font-bold text-slate-800">88%</span>
            </div>
          </div>
        </div>

        {/* Roadmap Display & Calendar tracker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Personalized Roadmap Timeline */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-[6px] p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-medium text-slate-900 tracking-tight">Custom Study Path</h3>
              <span className="text-[8.5px] font-medium text-slate-400">Roadmap Generated</span>
            </div>
            <div className="space-y-6 relative border-l border-slate-100 pl-4 ml-2.5">
              {roadmap?.phases.map((phase, pIdx: number) => (
                <div key={pIdx} className="relative">
                  <span className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-2 ${
                    pIdx === 0 ? 'bg-emerald-505 ring-emerald-100' : 'bg-slate-250 ring-slate-100'
                  }`} />
                  <h4 className="text-[11.5px] font-semibold text-slate-900 mb-2">{phase.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {phase.items.map((item) => {
                      const isDone = completedLessons.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveLessonId(item.id)}
                          className={`p-3 border rounded-[6px] text-left transition-colors flex justify-between items-center group cursor-pointer ${
                            isDone
                              ? 'bg-slate-50 border-slate-200 opacity-75'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <span className={`text-[10.5px] font-semibold block ${isDone ? 'line-through text-slate-550' : 'text-slate-850'}`}>
                              {item.title}
                            </span>
                            <span className="text-[8.5px] text-slate-400 font-semibold block mt-0.5">{item.details}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-650 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning calendar tracker */}
          <div className="bg-white border border-slate-200 rounded-[6px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-medium text-slate-900 tracking-tight border-b pb-2">Calendar Tracker</h3>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-bold text-slate-400">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
              {Array.from({ length: 30 }).map((_, idx) => {
                const dayNum = idx + 1;
                // mock study hours coloring
                const hasStudied = dayNum % 5 === 0 || dayNum % 7 === 1;
                return (
                  <div
                    key={idx}
                    className={`aspect-square flex items-center justify-center rounded-[3px] text-[9.5px] font-bold ${
                      hasStudied
                        ? 'bg-emerald-600 text-white font-black'
                        : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
            <div className="text-[9.5px] text-slate-500 font-semibold leading-relaxed text-justify border-t pt-2 mt-2">
              📅 Keep your streak green by completing 1 coding challenge or reading 1 custom lesson section every single day.
            </div>
          </div>
        </div>

        {/* Bookmarks, Achievements, Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-[6px] p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-medium text-slate-900 tracking-tight border-b pb-2">Bookmarked Lessons</h3>
            {bookmarks.length === 0 ? (
              <p className="text-[10.5px] text-slate-400 italic">No bookmarks saved yet. Star lessons to see them here.</p>
            ) : (
              <div className="space-y-1.5">
                {bookmarks.map((bId) => {
                  const lessonObj = LESSON_DATABASE[bId];
                  if (!lessonObj) return null;
                  return (
                    <div key={bId} className="flex justify-between items-center p-2 bg-slate-50 rounded-[4px] border border-slate-100">
                      <span className="text-[10.5px] font-bold text-slate-700 truncate">{lessonObj.title}</span>
                      <button
                        onClick={() => setActiveLessonId(bId)}
                        className="text-[9.5px] font-semibold tracking-wide text-emerald-600 hover:text-emerald-755 cursor-pointer"
                      >
                        Launch
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-[6px] p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-medium text-slate-900 tracking-tight border-b pb-2">Completed Achievements</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-md">🎓</span>
                <div>
                  <span className="text-[10.5px] font-bold block">First Launch Calibration</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold block">Onboarding checklist completed</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-md">🔥</span>
                <div>
                  <span className="text-[10.5px] font-bold block">Active Streaker</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold block">Opened workspace 5 days in a row</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={resetOnboarding}
                className="text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:underline cursor-pointer"
              >
                Reset Onboarding Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== VIEW 3: CENTER LEARNING WORKSPACE READER ====================
  // Check if lesson text has adaptive translations, fallback to base theory
  const adaptedTheoryText = activeLesson.adaptiveTheory?.[language] || activeLesson.theory;

  // Retrieve matching analogy
  const defaultAnalogy = {
    analogy: 'Educational Analogy',
    example: 'Analogy example goes here. Concept matches typical developer patterns.'
  };
  const currentAnalogyObj = activeLesson.adaptiveAnalogy?.[learningStyle] || defaultAnalogy;

  // Bookmarks check
  const isBookmarked = bookmarks.includes(activeLessonId);
  const isLessonCompleted = completedLessons.includes(activeLessonId);

  return (
    <div className={`relative w-full transition-all duration-150 ${accessibility.readingMode ? 'px-8 md:px-20 py-10' : 'px-8 md:px-14 py-8'} pb-24 space-y-8`}>
      {/* Lesson Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <button
          onClick={() => setActiveLessonId('')}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 tracking-wide"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>

        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase border ${
          activeLesson.difficulty === 'Beginner' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' :
          activeLesson.difficulty === 'Intermediate' ? 'bg-amber-50 border-amber-250 text-amber-700' :
          'bg-rose-50 border-rose-250 text-rose-700'
        }`}>
          {activeLesson.difficulty}
        </span>
      </div>

      {/* Lesson Title & Stats */}
      <div className="space-y-2">
        <h1 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight leading-tight">
          {activeLesson.title}
        </h1>
        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-normal tracking-wide">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeLesson.duration}</span>
          <span>•</span>
          <span>Language: {language}</span>
          <span>•</span>
          <span>Style: {learningStyle}</span>
        </div>
      </div>

      {/* Learning Objectives block */}
      <div className="bg-emerald-50/50 border border-emerald-150 rounded-[6px] p-4.5 space-y-2.5 shadow-xs">
        <h3 className="text-xs font-medium text-emerald-950 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-750" />
          Learning Objectives
        </h3>
        <ul className="space-y-1.5 pl-4 list-disc text-[10.5px] leading-relaxed text-slate-700 font-normal">
          {activeLesson.objectives.map((obj, idx) => <li key={idx}>{obj}</li>)}
        </ul>
      </div>

      {/* Theory Content Block (Justified Align) */}
      <div className="space-y-4">
        <h3 className="text-xs font-medium text-slate-900 tracking-tight border-l-2 border-emerald-600 pl-2">
          Conceptual Theory
        </h3>
        <div
          className={`${fontSizes[accessibility.fontSize]} text-slate-700 font-normal space-y-4 whitespace-pre-line text-justify`}
        >
          {adaptedTheoryText}
        </div>
      </div>

      {/* Visual Component Render */}
      {renderVisualDiagram()}

      {/* Style-based Analogy Component */}
      <div className="bg-amber-50/30 border border-amber-200 rounded-[6px] p-4.5 space-y-2">
        <span className="text-[9px] font-medium text-amber-850 tracking-wide block">
          Style Analogy: {currentAnalogyObj.analogy}
        </span>
        <p className="text-[10.5px] text-slate-700 font-normal leading-relaxed text-justify">
          {currentAnalogyObj.example}
        </p>
      </div>

      {/* Custom Inline Coding Sandbox Section */}
      {activeLesson.codeSandbox && (
        <div className="border border-slate-200 bg-white rounded-[6px] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-850">
            <span className="text-[10px] font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-500" /> Interactive Coding Sandbox
            </span>
            <span className="text-[9px] font-semibold text-slate-400">Environment: {activeLesson.codeLanguage || 'C++'}</span>
          </div>

          <div className="p-4 space-y-4">
            <div className="text-[10px] font-normal text-slate-600 leading-normal bg-slate-50 p-2.5 rounded border border-slate-100 whitespace-pre-line">
              <span className="font-medium text-slate-900 block mb-0.5">Instructions:</span>
              {activeLesson.codeSandbox.instructions}
            </div>

            {/* Code Input */}
            <div className="relative">
              <textarea
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                rows={8}
                className="w-full p-4 bg-slate-950 text-slate-200 border border-slate-850 rounded-[6px] text-[10.5px] font-mono overflow-x-auto shadow-inner resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={runCodeSandbox}
                  disabled={isCompiling}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-[6px] font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isCompiling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Code & Tests
                    </>
                  )}
                </button>
                <button
                  onClick={() => setCodeText(activeLesson.codeSandbox?.initialCode || '')}
                  className="px-3 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 font-semibold text-[10px] rounded-[6px] transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {sandboxPassed !== null && (
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${sandboxPassed ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {sandboxPassed ? <CheckCircle className="w-4 h-4 fill-emerald-50" /> : <X className="w-4 h-4" />}
                  {sandboxPassed ? 'Verification Passed' : 'Verification Failed'}
                </div>
              )}
            </div>

            {/* Console Output Log */}
            {consoleOutput.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded p-3 font-mono text-[9.5px] space-y-1 text-slate-300">
                <span className="text-[8px] font-normal text-slate-500 tracking-wide block border-b border-slate-800 pb-1 mb-1">
                  Compiler Terminal Outputs:
                </span>
                {consoleOutput.map((log, idx) => {
                  const isErr = log.includes('[✗]') || log.includes('ERROR:');
                  const isSuccess = log.includes('[✓]') || log.includes('SUCCESS:');
                  return (
                    <div
                      key={idx}
                      className={isErr ? 'text-rose-400 font-bold' : isSuccess ? 'text-emerald-400 font-bold' : 'text-slate-350'}
                    >
                      {log}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Best Practices & Common Mistakes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/20 border border-emerald-200 rounded-[6px] p-4.5 space-y-2">
          <span className="text-[9px] font-medium text-emerald-800 tracking-wide block">Best Practices</span>
          <ul className="space-y-1.5 list-disc pl-4 text-[10.5px] leading-normal text-slate-700 font-normal">
            {activeLesson.bestPractices.map((bp, i) => <li key={i}>{bp}</li>)}
          </ul>
        </div>

        <div className="bg-rose-50/20 border border-rose-200 rounded-[6px] p-4.5 space-y-2">
          <span className="text-[9px] font-medium text-rose-800 tracking-wide block">Common Mistakes</span>
          <ul className="space-y-1.5 list-disc pl-4 text-[10.5px] leading-normal text-slate-700 font-normal">
            {activeLesson.commonMistakes.map((cm, i) => <li key={i}>{cm}</li>)}
          </ul>
        </div>
      </div>

      {/* Interview Tips card */}
      <div className="bg-gradient-to-r from-amber-50/30 to-orange-50/10 border border-amber-250 rounded-[6px] p-4.5 space-y-2">
        <span className="text-[9px] font-medium text-amber-850 tracking-wide block">Recruiter & Interview Specs</span>
        <ul className="space-y-1.5 list-disc pl-4 text-[10.5px] leading-normal text-slate-700 font-normal">
          {activeLesson.interviewTips.map((tip, i) => <li key={i}>{tip}</li>)}
        </ul>
      </div>

      {/* Quiz Section */}
      <div className="border border-slate-200 bg-white rounded-[6px] p-6 space-y-4.5 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          Concept Check Challenge
        </h3>
        <p className="text-[11px] font-normal text-slate-700 leading-relaxed text-justify">
          {activeLesson.quiz.question}
        </p>

        <div className="space-y-2">
          {activeLesson.quiz.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let borderClass = 'border-slate-200 hover:border-slate-350 bg-white';
            if (quizSubmitted) {
              if (idx === activeLesson.quiz.correctIndex) {
                borderClass = 'border-emerald-500 bg-emerald-50/30 text-emerald-950';
              } else if (isSelected) {
                borderClass = 'border-rose-500 bg-rose-50/30 text-rose-950';
              } else {
                borderClass = 'border-slate-200 opacity-60 bg-white';
              }
            } else if (isSelected) {
              borderClass = 'border-slate-900 bg-slate-50';
            }

            return (
              <button
                key={idx}
                disabled={quizSubmitted}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-3.5 border rounded-[6px] text-[10.5px] font-normal transition-all flex justify-between items-center ${borderClass} ${!quizSubmitted ? 'cursor-pointer' : ''}`}
              >
                <span>{opt}</span>
                {quizSubmitted && idx === activeLesson.quiz.correctIndex && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                {quizSubmitted && isSelected && idx !== activeLesson.quiz.correctIndex && <X className="w-4 h-4 text-rose-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {!quizSubmitted ? (
          <button
            onClick={() => {
              if (selectedOption !== null) {
                setQuizSubmitted(true);
                setIsQuizCorrect(selectedOption === activeLesson.quiz.correctIndex);
              }
            }}
            disabled={selectedOption === null}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-[6px] font-semibold text-[10.5px] tracking-wide transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            Verify Answer
          </button>
        ) : (
          <div className={`p-4 rounded-[6px] text-[10.5px] border ${isQuizCorrect ? 'bg-emerald-50/20 border-emerald-200 text-emerald-850 font-semibold' : 'bg-rose-50/20 border-rose-200 text-rose-850 font-semibold'}`}>
            <p className="font-semibold tracking-wide mb-1">
              {isQuizCorrect ? '✓ Correct Explanation' : '✗ Incorrect Explanation'}
            </p>
            <p className="leading-relaxed text-justify">
              {activeLesson.quiz.adaptiveExplanations?.[language] || activeLesson.quiz.explanation}
            </p>
          </div>
        )}
      </div>

      {/* YouTube Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-950 tracking-tight border-l-2 border-emerald-600 pl-2">
          Continue Learning: YouTube Recommendations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeLesson.youtubeRecommendations.map((yt, idx) => (
            <div key={idx} className="bg-transparent border border-slate-200/60 rounded-[6px] p-4.5 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-28 bg-slate-900 rounded-[4px] flex items-center justify-center text-slate-400 relative overflow-hidden group">
                  {/* Simulated Thumbnail */}
                  <span className="text-[10px] font-bold text-slate-400">Play video from {yt.creator}</span>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white fill-current" />
                  </div>
                </div>
                <h4 className="text-[10.5px] font-bold text-slate-850 leading-tight tracking-tight mt-1">{yt.title}</h4>
                <div className="flex items-center justify-between text-[9px] font-normal text-slate-400">
                  <span>Channel: {yt.creator}</span>
                  <span>Duration: {yt.duration}</span>
                </div>
                <p className="text-[9.5px] text-slate-500 font-normal leading-relaxed text-justify">
                  {yt.reason}
                </p>
              </div>
              <a
                href={yt.link}
                target="_blank"
                rel="noreferrer"
                className="w-full py-1.5 border border-slate-250 hover:bg-slate-50 text-[9.5px] font-bold text-slate-700 rounded-[6px] text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                Watch on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Lesson Navigation */}
      <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={handlePrevLesson}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-250 hover:bg-slate-55 text-slate-700 font-semibold text-[10.5px] rounded-[6px] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous Lesson
          </button>
          <button
            onClick={handleNextLesson}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-250 hover:bg-slate-55 text-slate-700 font-semibold text-[10.5px] rounded-[6px] transition-colors cursor-pointer"
          >
            Next Lesson <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => toggleBookmark(activeLessonId)}
            className={`p-2 border rounded-[6px] transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-amber-50 border-amber-250 text-amber-600'
                : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-50'
            }`}
            title="Bookmark lesson"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => setIsNotesPanelOpen(!isNotesPanelOpen)}
            className={`px-3 py-2 border rounded-[6px] font-semibold text-[10.5px] tracking-wide transition-all cursor-pointer ${
              isNotesPanelOpen
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Personal Notes
          </button>
          <button
            onClick={() => toggleComplete(activeLessonId)}
            className={`flex items-center gap-1.5 px-4 py-2 font-semibold text-[10.5px] tracking-wide rounded-[6px] transition-all cursor-pointer shadow-xs ${
              isLessonCompleted
                ? 'bg-emerald-50 border border-emerald-250 text-emerald-700'
                : 'bg-emerald-600 hover:bg-emerald-750 text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isLessonCompleted ? 'Completed ✓' : 'Complete'}
          </button>
        </div>
      </div>

      {/* ==================== VIEW 4: PERSONAL NOTES SYSTEM PANEL ==================== */}
      {isNotesPanelOpen && (
        <aside className="fixed top-0 right-0 z-50 h-screen w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col p-4 space-y-4 animate-slide-in">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-xs font-medium text-slate-950 tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" /> Lesson Notebook
            </h3>
            <button
              onClick={() => setIsNotesPanelOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col space-y-3">
            <textarea
              value={localNoteText}
              onChange={(e) => {
                setLocalNoteText(e.target.value);
                saveNote(activeLessonId, e.target.value);
              }}
              placeholder="Jot down notes, key terms, or copy-paste code snippets. Changes save automatically."
              className="w-full flex-1 p-3 border border-slate-200 text-[10.5px] rounded-[6px] font-semibold text-slate-700 bg-transparent focus:bg-white focus:border-emerald-600 outline-none resize-none"
            />

            {/* Tags addition */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-semibold text-slate-500 tracking-wide block">Note Tags</span>
              <div className="flex flex-wrap gap-1">
                {noteTags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => setNoteTags(noteTags.filter((t) => t !== tag))}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-full text-[8.5px] font-bold text-slate-500 cursor-pointer"
                  >
                    #{tag} ✕
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Add tag"
                  value={noteTagInput}
                  onChange={(e) => setNoteTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && noteTagInput.trim()) {
                      setNoteTags([...noteTags, noteTagInput.trim()]);
                      setNoteTagInput('');
                    }
                  }}
                  className="flex-1 p-1.5 border border-slate-200 text-[10px] rounded-[6px] font-semibold outline-none"
                />
                <button
                  onClick={() => {
                    if (noteTagInput.trim()) {
                      setNoteTags([...noteTags, noteTagInput.trim()]);
                      setNoteTagInput('');
                    }
                  }}
                  className="px-2.5 bg-slate-900 text-white text-[9.5px] font-bold rounded-[6px] cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex gap-2">
            <button
              onClick={exportNotesToMarkdown}
              className="flex-1 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 font-semibold text-[9.5px] tracking-wide rounded-[6px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export MD
            </button>
            <button
              onClick={() => {
                // simulated PDF print
                window.print();
              }}
              className="flex-1 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 font-semibold text-[9.5px] tracking-wide rounded-[6px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              Print Note
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
