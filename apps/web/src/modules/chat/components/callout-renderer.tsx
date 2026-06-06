'use client';

import React from 'react';
import { Info, Lightbulb, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CalloutRendererProps {
  type: string; // 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION'
  children: React.ReactNode;
}

export const CalloutRenderer: React.FC<CalloutRendererProps> = ({ type, children }) => {
  const normalizedType = type.toUpperCase().trim();
  
  let styles = {
    bg: 'bg-slate-50/70',
    border: 'border-slate-300/60 border-l-slate-400',
    text: 'text-slate-800',
    icon: <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />,
    title: 'Note',
    titleColor: 'text-slate-600',
  };

  if (normalizedType === 'TIP') {
    styles = {
      bg: 'bg-emerald-50/40',
      border: 'border-emerald-200/50 border-l-emerald-500',
      text: 'text-emerald-950',
      icon: <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
      title: 'Tip',
      titleColor: 'text-emerald-800',
    };
  } else if (normalizedType === 'IMPORTANT') {
    styles = {
      bg: 'bg-indigo-50/40',
      border: 'border-indigo-200/50 border-l-indigo-500',
      text: 'text-indigo-950',
      icon: <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />,
      title: 'Important',
      titleColor: 'text-indigo-800',
    };
  } else if (normalizedType === 'WARNING') {
    styles = {
      bg: 'bg-amber-50/50',
      border: 'border-amber-200/60 border-l-amber-500',
      text: 'text-amber-950',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
      title: 'Warning',
      titleColor: 'text-amber-800',
    };
  } else if (normalizedType === 'CAUTION') {
    styles = {
      bg: 'bg-rose-50/40',
      border: 'border-rose-200/50 border-l-rose-500',
      text: 'text-rose-950',
      icon: <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
      title: 'Caution',
      titleColor: 'text-rose-800',
    };
  }

  return (
    <div className={`p-4 rounded-[8px] border-l-[4px] border ${styles.bg} ${styles.border} my-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] flex gap-3 items-start`}>
      {styles.icon}
      <div className="flex-1 min-w-0 text-[12.5px] leading-relaxed">
        <div className={`font-bold text-[11px] uppercase tracking-wide mb-0.5 ${styles.titleColor}`}>
          {styles.title}
        </div>
        <div className={styles.text}>{children}</div>
      </div>
    </div>
  );
};
