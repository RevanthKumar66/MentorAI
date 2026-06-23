'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Crosshair, AlertTriangle, Cpu, ArrowRight } from 'lucide-react';

const tools = [
  {
    name: 'AI Planner',
    description: 'Formulate week-by-week roadmaps and target milestones. Generates structured tasks dynamically based on capacity and complexity.',
    href: '/lifesaver/planner',
    icon: Sparkles,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    hoverBorder: 'hover:border-amber-300',
    colorText: 'text-amber-800',
  },
  {
    name: 'Focus AI',
    description: 'Generate your daily mission text. Runs a priority engine that evaluates tasks by urgency, impact, and milestone alignment.',
    href: '/lifesaver/focus',
    icon: Crosshair,
    iconBg: 'bg-indigo-50 text-indigo-650 border-indigo-250',
    hoverBorder: 'hover:border-indigo-300',
    colorText: 'text-indigo-900',
  },
  {
    name: 'Risk Center',
    description: 'Predict schedule delay risks and project failure probabilities. AI automatically maps warning factors and outlines recovery plans.',
    href: '/lifesaver/risk',
    icon: AlertTriangle,
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    hoverBorder: 'hover:border-rose-300',
    colorText: 'text-rose-900',
  },
  {
    name: 'Execution Agent',
    description: 'Activate your AI Chief of Staff. Autonomous rescheduling of missed tasks, workload optimizations, and daily strategic briefings.',
    href: '/lifesaver/execution',
    icon: Cpu,
    iconBg: 'bg-emerald-50 text-emerald-650 border-emerald-250',
    hoverBorder: 'hover:border-emerald-350',
    colorText: 'text-emerald-900',
  },
];

export default function AICenterPage() {
  return (
    <div className="w-full px-14 py-6 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-slate-900 border border-slate-900 flex items-center justify-center text-white shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-950 tracking-tight">AI Intelligence Center</h2>
          <p className="text-[10.5px] text-slate-500 font-medium">
            Strategic roadmaps, real-time focus navigators, risk forecasts, and autonomous execution coaching.
          </p>
        </div>
      </div>

      {/* Intro Banner */}
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/40 border border-slate-200/60 rounded-[12px] space-y-2">
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block">
          Platform Overview
        </span>
        <h3 className="text-[14px] font-semibold text-slate-950 tracking-tight leading-snug">
          Momentum AI — The Deadline Survival System
        </h3>
        <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed max-w-2xl">
          MentorAI OS features a multi-tiered intelligence center that moves beyond standard task lists.
          It deterministically evaluates your capacity, guides daily prioritization, flags high-risk milestones, and automatically intervenes to reschedule overdue actions.
        </p>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.name}
              href={t.href}
              className={`bg-white border border-slate-200/60 rounded-[12px] p-5 flex flex-col justify-between gap-5 transition-all duration-200 hover:shadow-md cursor-pointer group ${t.hoverBorder}`}
            >
              <div className="space-y-3.5">
                {/* Header Icon + Title */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center border shrink-0 ${t.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-[13px] font-bold text-slate-950 group-hover:text-black">
                    {t.name}
                  </h4>
                </div>

                {/* Description */}
                <p className="text-[10.5px] leading-relaxed text-slate-700 font-medium">
                  {t.description}
                </p>
              </div>

              {/* Action Link Footer */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800 group-hover:text-black border-t border-slate-50 pt-3 mt-auto">
                <span>Launch {t.name}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
