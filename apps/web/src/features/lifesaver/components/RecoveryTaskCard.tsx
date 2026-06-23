import React from 'react';
import { RecoveryTask } from '../types/risk';
import { CheckSquare, Square, Clock } from 'lucide-react';

interface RecoveryTaskCardProps {
  task: RecoveryTask;
  onToggleStatus?: (id: string, currentStatus: 'pending' | 'completed') => void;
}

export const RecoveryTaskCard: React.FC<RecoveryTaskCardProps> = ({ task, onToggleStatus }) => {
  const isCompleted = task.status === 'completed';
  const Icon = isCompleted ? CheckSquare : Square;

  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={`p-3 rounded-[8px] bg-white border border-slate-200/60 flex items-start justify-between gap-3 transition-colors ${
        isCompleted ? 'bg-slate-50/50' : 'hover:bg-[#fcfbf9]'
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <button
          onClick={() => task.id && onToggleStatus?.(task.id, task.status)}
          className="text-slate-600 hover:text-slate-900 mt-0.5 cursor-pointer shrink-0"
        >
          <Icon className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-bold text-slate-900 leading-tight ${
              isCompleted ? 'line-through text-slate-400' : ''
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p
              className={`text-[9.5px] text-slate-700 mt-1 leading-normal ${
                isCompleted ? 'text-slate-400' : ''
              }`}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold border uppercase tracking-wider ${
                task.priority === 'high'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : task.priority === 'medium'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {task.priority} Priority
            </span>
            {task.estimated_time && (
              <span className="flex items-center gap-0.5 text-[8.5px] text-slate-700 font-semibold">
                <Clock className="w-3 h-3 text-slate-400" />
                {task.estimated_time}
              </span>
            )}
            {formattedDate && (
              <span className="text-[8.5px] text-slate-700 font-semibold">
                Due: {formattedDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default RecoveryTaskCard;
