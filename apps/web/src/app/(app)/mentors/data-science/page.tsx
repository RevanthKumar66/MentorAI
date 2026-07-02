'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play, RefreshCw, Database } from 'lucide-react';

export default function DataSciencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeNotebook = searchParams.get('nb');

  // Notebook cell states
  const [cell1Running, setCell1Running] = useState(false);
  const [cell1Executed, setCell1Executed] = useState(false);
  const [cell2Running, setCell2Running] = useState(false);
  const [cell2Executed, setCell2Executed] = useState(false);

  const runCell1 = () => {
    setCell1Running(true);
    setTimeout(() => {
      setCell1Running(false);
      setCell1Executed(true);
    }, 1200);
  };

  const runCell2 = () => {
    setCell2Running(true);
    setTimeout(() => {
      setCell2Running(false);
      setCell2Executed(true);
    }, 1500);
  };

  // 1. EXPLORATORY DATA ANALYSIS NOTEBOOK
  if (activeNotebook === 'eda') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="border-b border-slate-150 pb-4">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Exploratory Data Analysis Notebook</h1>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
            Run Pandas queries and visualize metrics distributions dynamically.
          </p>
        </div>

        <div className="space-y-6">
          {/* Cell 1: Load Data */}
          <div className="bg-slate-950 border border-slate-850 rounded-[12px] overflow-hidden shadow-md">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-850 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>In [1]:</span>
              <button
                onClick={runCell1}
                disabled={cell1Running}
                className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" /> Run Cell
              </button>
            </div>
            <pre className="p-4 text-slate-200 text-[11px] font-mono overflow-x-auto leading-normal">
              <code>{`import pandas as pd
import numpy as np

# Load user engagement matrix
df = pd.DataFrame({
    'UserID': ['U101', 'U102', 'U103', 'U104'],
    'ActiveTimeHrs': [4.5, 2.8, 6.2, 3.1],
    'TasksCompleted': [18, 12, 24, 15]
})
df.head()`}</code>
            </pre>
            
            {cell1Running && (
              <div className="p-3 bg-slate-900 border-t border-slate-850 flex items-center justify-center text-[10px] font-mono text-cyan-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Executing DataFrame operations...
              </div>
            )}

            {cell1Executed && !cell1Running && (
              <div className="p-4 bg-white border-t border-slate-250 overflow-x-auto">
                <table className="w-full text-left text-[10.5px] border-collapse font-semibold text-slate-750">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="p-2 font-bold text-slate-900">Index</th>
                      <th className="p-2 font-bold text-slate-900">UserID</th>
                      <th className="p-2 font-bold text-slate-900">ActiveTimeHrs</th>
                      <th className="p-2 font-bold text-slate-900">TasksCompleted</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100"><td className="p-2 text-slate-400 font-mono">0</td><td className="p-2">U101</td><td className="p-2">4.5</td><td className="p-2">18</td></tr>
                    <tr className="border-b border-slate-100"><td className="p-2 text-slate-400 font-mono">1</td><td className="p-2">U102</td><td className="p-2">2.8</td><td className="p-2">12</td></tr>
                    <tr className="border-b border-slate-100"><td className="p-2 text-slate-400 font-mono">2</td><td className="p-2">U103</td><td className="p-2">6.2</td><td className="p-2">24</td></tr>
                    <tr><td className="p-2 text-slate-400 font-mono">3</td><td className="p-2">U104</td><td className="p-2">3.1</td><td className="p-2">15</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cell 2: Plot Data */}
          <div className="bg-slate-950 border border-slate-850 rounded-[12px] overflow-hidden shadow-md">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-850 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>In [2]:</span>
              <button
                onClick={runCell2}
                disabled={cell2Running}
                className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" /> Run Cell
              </button>
            </div>
            <pre className="p-4 text-slate-200 text-[11px] font-mono overflow-x-auto leading-normal">
              <code>{`import matplotlib.pyplot as plt

# Generate interactive task distribution chart
plt.figure(figsize=(6, 3))
plt.bar(df['UserID'], df['TasksCompleted'], color='cyan')
plt.title('Tasks Completed per User')
plt.show()`}</code>
            </pre>

            {cell2Running && (
              <div className="p-3 bg-slate-900 border-t border-slate-850 flex items-center justify-center text-[10px] font-mono text-cyan-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Rendering canvas figures...
              </div>
            )}

            {cell2Executed && !cell2Running && (
              <div className="p-6 bg-white border-t border-slate-250 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-3">Tasks Completed per User (Rendered SVG Figure)</span>
                {/* Simulated SVG Bar Chart */}
                <div className="h-40 w-72 flex items-end justify-between border-b border-l border-slate-300 px-6 pb-2">
                  <div className="flex flex-col items-center gap-1.5 w-8">
                    <div className="bg-cyan-500 border border-cyan-400 w-full rounded-t-[2px] h-20" />
                    <span className="text-[9px] font-semibold text-slate-500">U101</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-8">
                    <div className="bg-cyan-500 border border-cyan-400 w-full rounded-t-[2px] h-12" />
                    <span className="text-[9px] font-semibold text-slate-500">U102</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-8">
                    <div className="bg-cyan-500 border border-cyan-400 w-full rounded-t-[2px] h-28" />
                    <span className="text-[9px] font-semibold text-slate-500">U103</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 w-8">
                    <div className="bg-cyan-500 border border-cyan-400 w-full rounded-t-[2px] h-16" />
                    <span className="text-[9px] font-semibold text-slate-500">U104</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. MODEL EVALUATION NOTEBOOK
  if (activeNotebook === 'eval') {
    return (
      <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-4xl mx-auto pb-24">
        <div className="border-b border-slate-150 pb-4">
          <h1 className="text-md font-bold text-slate-900 tracking-tight">Model Evaluation Notebook</h1>
          <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
            Audit classification metrics, confusion matrices, and ROC scores.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Classification Report Output</h3>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-[8px] font-mono text-[10px] text-slate-700 leading-normal overflow-x-auto">
            <pre>{`              precision    recall  f1-score   support

     Class 0       0.86      0.90      0.88       150
     Class 1       0.89      0.85      0.87       130

    accuracy                           0.88       280
   macro avg       0.88      0.88      0.88       280
weighted avg       0.88      0.88      0.88       280`}</pre>
          </div>
        </div>
      </div>
    );
  }

  // 3. DEFAULT DATA SCIENCE DASHBOARD
  return (
    <div className="w-full px-6 md:px-14 py-8 space-y-6 animate-fade-in max-w-5xl mx-auto pb-24">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-cyan-50/50 to-sky-50/30 border border-cyan-200 rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-slate-900 tracking-tight mb-1">Data Science Jupyter Sandbox</h2>
          <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
            Run statistical analytics, plot bar graphs, and audit ML classification models.
          </p>
        </div>
        <button
          onClick={() => router.push('/mentors/data-science?nb=eda')}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] rounded-[6px] transition-colors shrink-0 uppercase tracking-widest shadow-xs cursor-pointer"
        >
          <Database className="w-3.5 h-3.5" /> Launch Jupyter Notebook
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Notebooks List */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-[12px] p-5 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Active Jupyter Notebooks</h3>
          <div className="space-y-2">
            <div
              onClick={() => router.push('/mentors/data-science?nb=eda')}
              className="p-3 border border-slate-200 hover:border-slate-350 rounded-[8px] bg-slate-55/30 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-600" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-cyan-605 transition-colors">Exploratory Data Analysis (user_metrics.ipynb)</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Contains interactive bar plots | Active</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-cyan-600">Open Notebook →</span>
            </div>
            <div
              onClick={() => router.push('/mentors/data-science?nb=eval')}
              className="p-3 border border-slate-250 rounded-[8px] bg-white transition-all flex items-center justify-between cursor-pointer group opacity-85"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block group-hover:text-cyan-605 transition-colors">Model Performance Evaluator (classification_report.ipynb)</span>
                  <span className="text-[8.5px] text-slate-400 font-semibold uppercase">Evaluates precision & recall metrics</span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold text-slate-500">Open Notebook →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
