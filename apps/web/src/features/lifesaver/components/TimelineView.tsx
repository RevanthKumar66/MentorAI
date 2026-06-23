import React, { useState } from 'react';
import { WeeklyPlanItem } from '../types/planner';
import { ChevronDown, ChevronRight, CalendarDays, Sparkles } from 'lucide-react';

interface TimelineViewProps {
  weeklyPlan: WeeklyPlanItem[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ weeklyPlan }) => {
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({
    1: true, // Expand week 1 by default
  });

  if (!weeklyPlan || weeklyPlan.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 text-center text-xs text-slate-700 font-medium">
        No Roadmap Details Available.
      </div>
    );
  }

  // Sort weekly plan by week number
  const sortedPlan = [...weeklyPlan].sort((a, b) => a.week_number - b.week_number);

  const toggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }));
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-slate-900 shrink-0" />
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Weekly Roadmap Timeline</h3>
      </div>

      <div className="relative pl-4 border-l border-slate-200/60 ml-2 space-y-6 py-2">
        {sortedPlan.map((item, index) => {
          const isExpanded = expandedWeeks[item.week_number];
          const hasTopics = item.topics && item.topics.length > 0;

          return (
            <div key={item.week_number} className="relative">
              {/* Timeline Indicator Node */}
              <span 
                onClick={() => toggleWeek(item.week_number)}
                className={`absolute -left-[22.5px] top-1 w-[12px] h-[12px] rounded-full border-2 bg-white transition-all cursor-pointer flex items-center justify-center ${
                  isExpanded ? 'border-slate-950 scale-110' : 'border-slate-300'
                }`}
              />

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleWeek(item.week_number)}
                  className="flex items-center gap-1.5 focus:outline-none cursor-pointer group text-left w-full"
                >
                  <span className="text-xs font-bold text-slate-950 uppercase tracking-wider group-hover:text-slate-700">
                    Week {item.week_number}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-3.5 bg-[#fcfbf9] border border-slate-200/60 rounded-[8px] space-y-2 transition-all">
                    {hasTopics ? (
                      <div className="space-y-1.5">
                        <span className="text-[9.5px] font-semibold text-slate-700 uppercase tracking-wider block">
                          Topics To Focus On
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.topics.map((topic, tIdx) => (
                            <span 
                              key={tIdx} 
                              className="px-2 py-0.5 bg-white border border-slate-200/60 text-[9.5px] font-medium text-slate-800 rounded-[4px] inline-flex items-center gap-1"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-750 font-medium italic">
                        No specific topics defined. Follow milestones and general objectives.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TimelineView;
