import React from 'react';
import { Recommendation } from '../types/planner';
import { Lightbulb } from 'lucide-react';

interface RecommendationCardProps {
  recommendations: Recommendation[];
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 text-center text-xs text-slate-700 font-medium">
        No Recommendations Found For This Goal Plan.
      </div>
    );
  }

  // Helper to prioritize sorting
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
  });

  const getPriorityStyle = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/60';
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">AI Strategist Recommendations</h3>
      </div>
      
      <div className="space-y-3">
        {sortedRecommendations.map((r) => (
          <div 
            key={r.id} 
            className="p-3 bg-[#fcfbf9] border border-slate-200/60 rounded-[8px] flex flex-col gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`px-2 py-0.5 text-[8.5px] font-semibold rounded-[4px] border ${getPriorityStyle(r.priority)} uppercase tracking-wider`}>
                {r.priority} Priority
              </span>
            </div>
            <p className="text-[10px] text-slate-800 font-medium leading-relaxed">
              {r.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default RecommendationCard;
