import React from 'react';
import { Milestone } from '../types/planner';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface MilestoneCardProps {
  milestones: Milestone[];
  onStatusChange?: (milestoneId: string, newStatus: Milestone['status']) => void;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestones, onStatusChange }) => {
  if (!milestones || milestones.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 text-center text-xs text-slate-700 font-medium">
        No Milestones Found For This Goal Plan.
      </div>
    );
  }

  // Sort milestones by week number
  const sortedMilestones = [...milestones].sort((a, b) => a.week_number - b.week_number);

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const getStatusStyle = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50/50 text-emerald-800 border-emerald-100';
      case 'in_progress':
        return 'bg-amber-50/50 text-amber-800 border-amber-100';
      default:
        return 'bg-slate-50/50 text-slate-800 border-slate-100';
    }
  };

  const toggleStatus = (milestone: Milestone) => {
    if (!onStatusChange) return;
    
    let nextStatus: Milestone['status'] = 'not_started';
    if (milestone.status === 'not_started') {
      nextStatus = 'in_progress';
    } else if (milestone.status === 'in_progress') {
      nextStatus = 'completed';
    } else {
      nextStatus = 'not_started';
    }
    
    onStatusChange(milestone.id, nextStatus);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Weekly Milestones</h3>
      
      <div className="space-y-3">
        {sortedMilestones.map((m) => (
          <div 
            key={m.id} 
            className="flex items-start gap-3 p-3 bg-[#fcfbf9] border border-slate-200/60 rounded-[8px] transition-all hover:bg-slate-50/50"
          >
            <button 
              onClick={() => toggleStatus(m)}
              disabled={!onStatusChange}
              className={`mt-0.5 focus:outline-none ${onStatusChange ? 'cursor-pointer' : 'cursor-default'}`}
              title={onStatusChange ? "Click To Change Status" : undefined}
            >
              {getStatusIcon(m.status)}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[9.5px] font-bold text-slate-800 uppercase tracking-wider">
                  Week {m.week_number}
                </span>
                <span className={`px-1.5 py-0.5 text-[8.5px] font-bold rounded-[4px] border ${getStatusStyle(m.status)} capitalize`}>
                  {m.status.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-950 mb-0.5 leading-normal">{m.title}</h4>
              {m.description && (
                <p className="text-[10px] text-slate-700 font-medium leading-relaxed">
                  {m.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default MilestoneCard;
