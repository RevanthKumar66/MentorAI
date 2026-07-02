'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play, RefreshCw, BarChart, Layers } from 'lucide-react';

interface DSATestResult {
  success: boolean;
  runtime: string;
  memory: string;
  logs: string[];
}

export default function DSAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  // Sorting visualizer state
  const [array, setArray] = useState<number[]>([45, 12, 85, 32, 60, 25, 90, 50]);
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [sortedIndices, setSortedIndices] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [sortingStepDescription, setSortingStepDescription] = useState('Click Start Sort to begin step-by-step sorting simulation.');

  // Leetcode problem editor
  const [code, setCode] = useState(`function twoSum(nums: number[], target: number): number[] {\n  // TODO: Implement O(N) Hashmap lookup\n  return [];\n}`);
  const [testResult, setTestResult] = useState<DSATestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Generate random array
  const resetArray = () => {
    setArray([45, 12, 85, 32, 60, 25, 90, 50]);
    setActiveIndices([]);
    setSortedIndices([]);
    setSortingStepDescription('Array reset. Ready to sort.');
  };

  // Bubble sort step implementation
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runBubbleSort = async () => {
    if (isSorting) return;
    setIsSorting(true);
    const arr = [...array];
    const n = arr.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        // Highlight active comparing items
        setActiveIndices([j, j + 1]);
        setSortingStepDescription(`Comparing index ${j} (${arr[j]}) and index ${j+1} (${arr[j+1]})`);
        await sleep(600);

        if (arr[j] > arr[j + 1]) {
          // Swap elements
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          setArray([...arr]);
          setSortingStepDescription(`Swap: ${arr[j+1]} is larger than ${arr[j]}. Shifting right.`);
          await sleep(600);
        }
      }
      // Add sorted node
      setSortedIndices(prev => [...prev, n - i - 1]);
    }
    setSortedIndices(Array.from({ length: n }, (_, i) => i));
    setActiveIndices([]);
    setSortingStepDescription('Sorting complete! Array is fully balanced.');
    setIsSorting(false);
  };

  const executeProblemTests = () => {
    setIsRunning(true);
    setTestResult(null);
    setTimeout(() => {
      setTestResult({
        success: true,
        runtime: '48 ms',
        memory: '42 MB',
        logs: [
          'Case 1: nums = [2,7,11,15], target = 9 -> Output: [0,1] (Passed)',
          'Case 2: nums = [3,2,4], target = 6 -> Output: [1,2] (Passed)',
          'Case 3: nums = [3,3], target = 6 -> Output: [0,1] (Passed)'
        ]
      });
      setIsRunning(false);
    }, 1500);
  };

  // 1. ALGORITHM VISUALIZER TAB
  if (activeTab === 'visualizer') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-150 pb-4 gap-4">
          <div>
            <h1 className="text-md font-bold text-slate-900 tracking-tight">Bubble Sort Algorithmic Visualizer</h1>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Observe bubble sort runtime exchanges and partition swaps dynamically.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={runBubbleSort}
              disabled={isSorting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9.5px] rounded-[6px] transition-colors cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start Sort
            </button>
            <button
              onClick={resetArray}
              disabled={isSorting}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[9.5px] rounded-[6px] transition-colors cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Animation Canvas */}
        <div className="bg-slate-950 rounded-[12px] p-8 border border-slate-850 shadow-inner space-y-6">
          <div className="h-48 flex items-end justify-center gap-2">
            {array.map((val, idx) => {
              const isActive = activeIndices.includes(idx);
              const isSorted = sortedIndices.includes(idx);
              
              let barColor = 'bg-slate-800 border-slate-700';
              if (isActive) barColor = 'bg-rose-500 border-rose-400';
              else if (isSorted) barColor = 'bg-emerald-600 border-emerald-500';

              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[40px]">
                  <span className="text-[9px] font-mono text-slate-400">{val}</span>
                  <div
                    className={`w-full rounded-t-[4px] border transition-all duration-300 ${barColor}`}
                    style={{ height: `${val * 1.5}px` }}
                  />
                  <span className="text-[8.5px] font-mono text-slate-500">[{idx}]</span>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-900 border border-slate-850 rounded-[8px] text-[10.5px] font-mono text-slate-350 text-center leading-normal">
            {sortingStepDescription}
          </div>
        </div>

        {/* Complexity Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-[10px] p-5 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Time Complexity Specifications</span>
            <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-700 font-semibold">
              <p><strong className="text-slate-900">Best Case:</strong> O(N) when the array is already sorted.</p>
              <p><strong className="text-slate-900">Average/Worst Case:</strong> O(N^2) comparison swaps are required.</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-[10px] p-5 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Space Complexity Specifications</span>
            <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-700 font-semibold">
              <p><strong className="text-slate-900">Auxiliary Space:</strong> O(1) in-place swaps requires no auxiliary memory buffer.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. LEETCODE PROBLEMS WORKSPACE
  if (activeTab === 'problems') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
        <div className="border-b border-slate-150 pb-4">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Two Sum (Arrays & Hashing)</h1>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
            Find indices of two numbers that add up to a specific target value.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description */}
          <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Problem Description</h3>
            <p className="text-[11px] leading-relaxed text-slate-700 font-medium">
              Given an array of integers <code className="bg-slate-100 px-1 rounded">nums</code> and an integer <code className="bg-slate-100 px-1 rounded">target</code>, return indices of the two numbers such that they add up to <code className="bg-slate-100 px-1 rounded">target</code>.<br/><br/>
              You may assume that each input would have exactly one solution, and you may not use the same element twice.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-[8px] font-mono text-[10px] border border-slate-200 space-y-1 text-slate-750">
              <p><strong>Example 1:</strong></p>
              <p>Input: nums = [2,7,11,15], target = 9</p>
              <p>Output: [0,1]</p>
              <p>Explanation: Because nums[0] + nums[1] == 9, we return [0,1].</p>
            </div>
          </div>

          {/* Sandbox code and tests */}
          <div className="space-y-4">
            <div className="border border-slate-850 bg-slate-950 rounded-[12px] overflow-hidden shadow-md">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-850 text-[10px] text-slate-400 font-mono">
                <span>main.ts</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-48 p-4 bg-slate-950 text-slate-200 font-mono text-[11px] focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            <button
              onClick={executeProblemTests}
              disabled={isRunning}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-[10.5px] uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
            >
              Submit solution to runtime
            </button>

            {testResult && (
              <div className="bg-white border border-slate-250 rounded-[12px] p-5 space-y-3 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">✓ Tests Passed</span>
                  <div className="flex gap-3 text-[9px] font-mono text-slate-500">
                    <span>Time: {testResult.runtime}</span>
                    <span>Memory: {testResult.memory}</span>
                  </div>
                </div>
                <div className="space-y-1 font-mono text-[10px] text-slate-650">
                  {testResult.logs.map((log: string, i: number) => <div key={i}>{log}</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. DEFAULT DSA MENTOR DASHBOARD
  return (
    <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/30 border border-indigo-200 rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-slate-900 tracking-tight mb-1">DSA Skill Coaching Dashboard</h2>
          <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
            Train sorting structures, solve arrays patterns, and master dynamic programming complexity.
          </p>
        </div>
        <button
          onClick={() => router.push('/mentors/dsa?tab=visualizer&algo=bubble')}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-[6px] transition-colors shrink-0 uppercase tracking-widest shadow-xs cursor-pointer"
        >
          <BarChart className="w-3.5 h-3.5" /> Start Sorting Visualizer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress tracker */}
        <div className="bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Syllabus Progress</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[9.5px] font-bold text-slate-600 mb-1">
                <span>ARRAYS & HASHING</span>
                <span>60%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-600 w-[60%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9.5px] font-bold text-slate-600 mb-1">
                <span>LINKED LISTS</span>
                <span>20%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-600 w-[20%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9.5px] font-bold text-slate-600 mb-1">
                <span>DYNAMIC PROGRAMMING</span>
                <span>0%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-600 w-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Active Problems Queue</h3>
          <div className="space-y-2">
            <div
              onClick={() => router.push('/mentors/dsa?tab=problems&id=twosum')}
              className="p-3 border border-slate-200 hover:border-slate-350 rounded-[8px] bg-slate-55/30 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors">Two Sum (Arrays & Hashing)</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Easy difficulty | Accept rate: 52%</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-indigo-600">Solve Problem →</span>
            </div>
            <div
              onClick={() => router.push('/mentors/dsa?tab=problems&id=reverse')}
              className="p-3 border border-slate-250 rounded-[8px] bg-white transition-all flex items-center justify-between cursor-pointer group opacity-85"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors">Reverse Linked List</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Medium difficulty | Accept rate: 64%</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-slate-500">Solve Problem →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
