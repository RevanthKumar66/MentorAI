import React, { useState } from 'react';
import { ScheduleSuggestion } from '../types/scheduling';
import { availabilityEngineService } from '../services/AvailabilityEngineService';
import { Sparkles, Calendar, Check, X, Clock, HelpCircle } from 'lucide-react';

interface Props {
  suggestions: ScheduleSuggestion[];
  onUpdate: () => void;
}

export function ScheduleSuggestionCard({ suggestions, onUpdate }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter only suggested ones
  const activeSuggestions = suggestions.filter(s => s.status === 'suggested');

  const handleAccept = async (s: ScheduleSuggestion) => {
    setProcessingId(s.id);
    try {
      await availabilityEngineService.acceptSuggestion(s.id, s.task_id, s.suggested_start);
      onUpdate();
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (s: ScheduleSuggestion) => {
    setProcessingId(s.id);
    try {
      await availabilityEngineService.rejectSuggestion(s.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to reject suggestion:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateString = (isoStart: string, isoEnd: string) => {
    try {
      const start = new Date(isoStart);
      const end = new Date(isoEnd);
      const date = start.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' });
      const times = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
        ' - ' + 
        end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${date} (${times})`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          AI Schedule Suggestions
        </h3>
        <span className="text-[10px] text-slate-500 font-semibold">{activeSuggestions.length} Available</span>
      </div>

      {activeSuggestions.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-[11px] flex flex-col items-center justify-center gap-1">
          <Calendar className="w-5 h-5 text-slate-400" />
          <span>No active schedule suggestions.</span>
          <span className="text-[10px] text-slate-400">Run a schedule sync/analysis to generate suggestions.</span>
        </div>
      ) : (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {activeSuggestions.map((s) => (
            <div 
              key={s.id} 
              className="p-4 border border-slate-150 bg-slate-50/10 hover:bg-slate-55/20 rounded-[8px] transition-all flex flex-col gap-2 relative"
            >
              {/* Header stats info */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="text-[10.5px] font-bold text-slate-800 line-clamp-1 flex-1">
                  {s.task_title}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                  s.confidence_score >= 80 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}>
                  {s.confidence_score}% Match
                </span>
              </div>

              {/* Slot suggestion details */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-900 leading-none">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateString(s.suggested_start, s.suggested_end)}</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-normal">{s.reason}</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100/50">
                <button
                  type="button"
                  onClick={() => handleReject(s)}
                  disabled={processingId === s.id}
                  className="p-1 px-2.5 rounded-[6px] border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Dismiss"
                >
                  <X className="w-3 h-3 inline mr-1" />
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => handleAccept(s)}
                  disabled={processingId === s.id}
                  className="p-1 px-3 rounded-[6px] bg-slate-950 hover:bg-black text-white text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  title="Accept and book"
                >
                  {processingId === s.id ? (
                    'Booking...'
                  ) : (
                    <>
                      <Check className="w-3 h-3" />
                      Accept & Book
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
