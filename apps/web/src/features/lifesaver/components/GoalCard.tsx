import React from 'react';
import Link from 'next/link';
import { Goal } from '../types/goal';
import { Calendar, MoreHorizontal, Edit2, Trash2, CheckCircle2, Play, PauseCircle } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  taskStats?: { completed: number; total: number };
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Goal['status']) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  taskStats = { completed: 0, total: 0 },
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const progress = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
  
  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-250',
    completed: 'bg-blue-50 text-blue-700 border-blue-250',
    paused: 'bg-amber-50 text-amber-700 border-amber-250',
  };

  const formattedDate = new Date(goal.target_date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-4 relative flex flex-col justify-between min-h-[160px] transition-all hover:bg-slate-50/40">
      {/* Top row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-[4px] border ${statusColors[goal.status]} capitalize`}>
            {goal.status}
          </span>
          <div className="relative z-10" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1 rounded-[6px] hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-slate-250 rounded-[8px] shadow-md py-1 z-10 text-[11px] font-semibold text-slate-800">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(goal); setMenuOpen(false); }}
                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
                >
                  <Edit2 className="w-3 h-3 text-slate-700" /> Edit Goal
                </button>
                {goal.status !== 'completed' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(goal.id, 'completed'); setMenuOpen(false); }}
                    className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
                  >
                    <CheckCircle2 className="w-3 h-3 text-blue-600" /> Mark Completed
                  </button>
                )}
                {goal.status !== 'active' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(goal.id, 'active'); setMenuOpen(false); }}
                    className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
                  >
                    <Play className="w-3 h-3 text-emerald-600" /> Resume Goal
                  </button>
                )}
                {goal.status !== 'paused' && goal.status !== 'completed' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(goal.id, 'paused'); setMenuOpen(false); }}
                    className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
                  >
                    <PauseCircle className="w-3 h-3 text-amber-600" /> Pause Goal
                  </button>
                )}
                <div className="border-t border-slate-200 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to delete this goal? All linked tasks will be deleted.')) { onDelete(goal.id); } setMenuOpen(false); }}
                  className="w-full px-3 py-1.5 hover:bg-red-50 text-red-650 flex items-center gap-2 cursor-pointer text-left"
                >
                  <Trash2 className="w-3 h-3 text-red-650" /> Delete Goal
                </button>
              </div>
            )}
          </div>
        </div>

        <Link href={`/lifesaver/goals/${goal.id}`} className="block group">
          <h4 className="text-xs font-semibold text-slate-900 leading-snug tracking-tight mb-1 truncate group-hover:text-slate-700 transition-colors" title={goal.title}>
            {goal.title}
          </h4>
          <p className="text-[10px] text-slate-700 leading-relaxed mb-3 line-clamp-2" title={goal.description || ''}>
            {goal.description || <span className="text-slate-500 italic">No description</span>}
          </p>
        </Link>
      </div>

      {/* Progress & Bottom Row */}
      <Link href={`/lifesaver/goals/${goal.id}`} className="space-y-3 block">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-semibold text-slate-800">
            <span>Progress</span>
            <span>{progress}% ({taskStats.completed}/{taskStats.total} Tasks)</span>
          </div>
          <div className="w-full bg-[#f4f3f0] h-1.5 rounded-full overflow-hidden border border-slate-150">
            <div
              className="bg-slate-900 h-full rounded-full transition-all duration-350"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-700 border-t border-slate-100 pt-2 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <span>Deadline: {formattedDate}</span>
        </div>
      </Link>
    </div>
  );
};
export default GoalCard;
