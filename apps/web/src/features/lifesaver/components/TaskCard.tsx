import React from 'react';
import { Task } from '../types/task';
import { Goal } from '../types/goal';
import { Calendar, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
import { getPriorityScoreLabel } from '../types/focus';

interface TaskCardProps {
  task: Task;
  goals?: Goal[];
  onToggleStatus: (id: string, currentStatus: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  priorityScore?: number; // Optional AI score 0-100
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  goals = [],
  onToggleStatus,
  onEdit,
  onDelete,
  priorityScore,
}) => {
  const isCompleted = task.status === 'completed';
  const linkedGoal = goals.find((g) => g.id === task.goal_id);

  const priorityColors = {
    low: 'bg-slate-50 text-slate-700 border-slate-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-250',
    high: 'bg-rose-50 text-rose-700 border-rose-250',
  };

  const formattedDate = new Date(task.due_date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`p-4 bg-white border border-slate-200/60 rounded-[12px] flex items-start gap-3 transition-all ${
      isCompleted ? 'bg-slate-50/50 border-slate-200/40 opacity-80' : ''
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggleStatus(task.id, task.status)}
        className="mt-0.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
      >
        {isCompleted ? (
          <CheckCircle2 className="w-4.5 h-4.5 text-slate-900 fill-slate-900/10" />
        ) : (
          <Circle className="w-4.5 h-4.5 text-slate-450 hover:text-slate-800" />
        )}
      </button>

      {/* Task Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className={`text-xs font-semibold text-slate-900 leading-snug truncate ${
            isCompleted ? 'line-through text-slate-500 font-medium' : ''
          }`} title={task.title}>
            {task.title}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`px-1.5 py-0.2 text-[8px] font-semibold rounded-[4px] border ${priorityColors[task.priority]} capitalize`}>
              {task.priority}
            </span>
            {priorityScore !== undefined && (
              <span className={`px-1.5 py-0.2 text-[8px] font-semibold rounded-[4px] border ${
                priorityScore >= 80 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                priorityScore >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {priorityScore.toFixed(0)} · {getPriorityScoreLabel(priorityScore)}
              </span>
            )}
          </div>
        </div>

        <p className={`text-[10px] text-slate-700 leading-relaxed mb-2.5 ${
          isCompleted ? 'text-slate-500' : ''
        } line-clamp-2`} title={task.description || ''}>
          {task.description || <span className="text-slate-500 italic">No description</span>}
        </p>

        {/* Footer info: Goal & Date */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[9px] font-semibold text-slate-750">
          <div className="flex items-center gap-1.5 min-w-0">
            {linkedGoal ? (
              <span className="bg-[#f4f3f0] border border-slate-200 px-1.5 py-0.5 rounded-[4px] truncate max-w-[120px]" title={`Goal: ${linkedGoal.title}`}>
                Goal: {linkedGoal.title}
              </span>
            ) : (
              <span className="text-slate-500 italic">General Task</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3 text-slate-600" />
            <span className={new Date(task.due_date) < new Date() && !isCompleted ? 'text-rose-700 font-extrabold' : ''}>
              Due: {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Edit & Delete Actions */}
      <div className="flex flex-col gap-1 items-center justify-center shrink-0 self-center">
        <button
          onClick={() => onEdit(task)}
          className="p-1 rounded-[6px] hover:bg-slate-100 border border-transparent text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
          title="Edit Task"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => { if (confirm('Are you sure you want to delete this task?')) { onDelete(task.id); } }}
          className="p-1 rounded-[6px] hover:bg-red-50 border border-transparent text-slate-650 hover:text-red-755 cursor-pointer transition-colors"
          title="Delete Task"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
export default TaskCard;
