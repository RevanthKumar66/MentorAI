'use client';

import React from 'react';
import { Lightbulb, ChevronRight } from 'lucide-react';

interface Recommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

interface RecommendationFeedProps {
  recommendations: Recommendation[];
}

const priorityBadge: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-50 text-slate-600 border-slate-200',
};

const priorityLabel: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const RecommendationFeed: React.FC<RecommendationFeedProps> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return (
      <div className="p-5 bg-white border border-slate-200/60 rounded-[12px] text-center">
        <p className="text-[10px] text-slate-600 font-medium">No recommendations available right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] divide-y divide-slate-100">
      <div className="px-5 py-3.5 flex items-center gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-slate-600" />
        <h3 className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
          AI Recommendations
        </h3>
      </div>
      {recommendations.map((rec, idx) => (
        <div key={idx} className="flex items-start gap-3 px-5 py-3.5">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="flex-1 text-[11px] text-slate-800 font-medium leading-relaxed">
            {rec.text}
          </p>
          <span
            className={`px-1.5 py-0.5 rounded-[4px] text-[8.5px] font-semibold border shrink-0 ${
              priorityBadge[rec.priority]
            }`}
          >
            {priorityLabel[rec.priority]}
          </span>
        </div>
      ))}
    </div>
  );
};
