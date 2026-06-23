'use client';

import React, { useState } from 'react';
import { Calendar, Check, X, ArrowRight, Loader2 } from 'lucide-react';
import { RescheduleSuggestion } from '../types/execution';

interface RescheduleCardProps {
  suggestions: RescheduleSuggestion[];
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export const RescheduleCard: React.FC<RescheduleCardProps> = ({
  suggestions,
  onAccept,
  onReject,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeSuggestions = suggestions.filter((s) => s.status === 'suggested');

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    setLoadingId(id);
    try {
      if (action === 'accept') {
        await onAccept(id);
      } else {
        await onReject(id);
      }
    } catch (err) {
      console.error(`Reschedule action ${action} failed:`, err);
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (activeSuggestions.length === 0) {
    return (
      <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 text-center space-y-2">
        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
          <Check className="w-4 h-4" />
        </div>
        <h4 className="text-[12px] font-semibold text-slate-900">All Caught Up!</h4>
        <p className="text-[10px] text-slate-700 max-w-[280px] mx-auto">
          No past-due tasks requiring autonomous rescheduling suggestions at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-[8px] bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-[12px] font-semibold text-slate-900 tracking-tight">Autonomous Rescheduling</h4>
          <p className="text-[9.5px] text-slate-700">
            AI detected {activeSuggestions.length} missed tasks. Postpone or shift timelines below.
          </p>
        </div>
      </div>

      {/* Suggested Reschedules List */}
      <div className="space-y-3">
        {activeSuggestions.map((s) => (
          <div
            key={s.id}
            className="p-3 bg-slate-50/50 border border-slate-200/50 rounded-[8px] space-y-2 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-900 block truncate">
                  {s.lifesaver_tasks?.title || 'Untitled Task'}
                </span>
                <span className="text-[9.5px] text-slate-700 italic block mt-0.5">
                  Reason: {s.reason}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200/50 px-2 py-0.5 rounded-[4px] text-[9px] font-semibold text-slate-700">
                <span>{formatDate(s.old_due_date)}</span>
                <ArrowRight className="w-2.5 h-2.5 text-slate-700" />
                <span className="text-emerald-700">{formatDate(s.new_due_date)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100/50">
              <button
                disabled={loadingId !== null}
                onClick={() => handleAction(s.id, 'reject')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-slate-200/60 text-[9.5px] font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3 text-slate-700" />
                Reject
              </button>
              <button
                disabled={loadingId !== null}
                onClick={() => handleAction(s.id, 'accept')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-slate-950 text-white text-[9.5px] font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50"
              >
                {loadingId === s.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RescheduleCard;
