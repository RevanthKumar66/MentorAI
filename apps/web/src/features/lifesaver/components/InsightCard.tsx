'use client';

import React from 'react';
import { Brain, Award } from 'lucide-react';
import { ProductivityInsight } from '../types/execution';

interface InsightCardProps {
  insights: ProductivityInsight[];
}

interface SeverityStyle {
  label: string;
  badge: string;
  dot: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insights }) => {
  const getSeverityStyle = (score: number): SeverityStyle => {
    if (score >= 90) {
      return {
        label: 'Critical',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: '🔴',
      };
    }
    if (score >= 80) {
      return {
        label: 'High',
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: '🟠',
      };
    }
    if (score >= 70) {
      return {
        label: 'Medium',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: '🟡',
      };
    }
    return {
      label: 'Low',
      badge: 'bg-slate-50 text-slate-700 border-slate-200',
      dot: '⚪',
    };
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 text-center space-y-2 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <Brain className="w-4 h-4" />
        </div>
        <h4 className="text-[12px] font-semibold text-slate-900">No Insights Yet</h4>
        <p className="text-[10px] text-slate-700 max-w-[280px] mx-auto">
          Run your first execution analysis to discover behavioral and productivity patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-[8px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
          <Brain className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-[12px] font-semibold text-slate-900 tracking-tight">Execution Insights</h4>
          <p className="text-[9.5px] text-slate-700">
            AI-detected behavioral patterns and productivity trends.
          </p>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((item) => {
          const severity = getSeverityStyle(item.confidence_score);
          return (
            <div
              key={item.id}
              className="p-3 bg-slate-50/30 border border-slate-100 rounded-[8px] space-y-2 relative overflow-hidden group hover:border-slate-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11.5px] font-medium leading-relaxed text-slate-900">
                  {item.insight}
                </span>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  {/* Severity Badge */}
                  <span className={`px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-bold border flex items-center gap-1 ${severity.badge}`}>
                    <span>{severity.dot}</span>
                    <span>{severity.label}</span>
                  </span>
                  
                  {/* Confidence rating */}
                  <span className="text-[8px] text-slate-700 font-semibold uppercase tracking-wider block">
                    Confidence {item.confidence_score}%
                  </span>
                </div>
              </div>

              {/* Subtle Progress Bar of Confidence */}
              <div className="w-full bg-slate-100/70 h-0.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${item.confidence_score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightCard;
