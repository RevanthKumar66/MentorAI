import React, { useState } from 'react';
import { CalendarConflict } from '../types/scheduling';
import { conflictDetectionService } from '../services/ConflictDetectionService';
import { AlertTriangle, Clock, ArrowRight, Check, CheckCircle2 } from 'lucide-react';

interface Props {
  conflicts: CalendarConflict[];
  onResolve: () => void;
}

export function ConflictCard({ conflicts, onResolve }: Props) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (conflict: CalendarConflict) => {
    setResolvingId(conflict.task_id);
    try {
      await conflictDetectionService.resolveConflict(conflict, 'reschedule');
      onResolve();
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        Scheduling Conflicts
      </h3>

      {conflicts.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-[11px] flex flex-col items-center justify-center gap-1.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-slate-800">No conflicts detected!</span>
          <span className="text-[10px] text-slate-500">Your scheduled tasks are fully aligned with your calendar.</span>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
          {conflicts.map((conflict, idx) => (
            <div 
              key={idx} 
              className="p-4 border border-rose-200 bg-rose-50/10 rounded-[8px] space-y-3 relative flex flex-col gap-2"
            >
              <div>
                <span className="block text-xs font-semibold text-rose-800">
                  Overlap Warning
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                  Task "{conflict.task_title}" conflicts with "{conflict.event_title}"
                </h4>
                <p className="text-[10px] text-slate-600 font-medium mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Scheduled overlap around {conflict.overlap_time}</span>
                </p>
              </div>

              {/* AI suggestion */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-[6px] p-2.5 space-y-1.5">
                <span className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">AI Proposed Alternative</span>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <span className="font-mono text-slate-650">{formatDate(conflict.suggested_alternative_start)}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="bg-white px-2 py-0.5 border border-slate-200 rounded font-mono text-slate-850">
                    {formatTime(conflict.suggested_alternative_start)} - {formatTime(conflict.suggested_alternative_end)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 leading-normal">{conflict.reason}</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleResolve(conflict)}
                  disabled={resolvingId === conflict.task_id}
                  className="px-3 py-1 bg-slate-950 hover:bg-black text-white rounded-[6px] text-[10.5px] font-semibold transition-colors cursor-pointer disabled:opacity-55 flex items-center gap-1"
                >
                  {resolvingId === conflict.task_id ? (
                    'Applying...'
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Apply Alternative
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
