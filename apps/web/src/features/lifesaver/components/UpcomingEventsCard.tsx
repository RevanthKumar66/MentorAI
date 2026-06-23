import React from 'react';
import { CalendarEvent } from '../types/scheduling';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface Props {
  events: CalendarEvent[];
}

export function UpcomingEventsCard({ events }: Props) {
  const formatEventTime = (isoStart: string, isoEnd: string) => {
    try {
      const start = new Date(isoStart);
      const end = new Date(isoEnd);
      const day = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
        ' - ' + 
        end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${day} (${timeStr})`;
    } catch {
      return 'Time details unavailable';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-4 shadow-xs">
      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Calendar className="w-4 h-4 text-slate-500" />
        Synced Calendar Events
      </h3>

      {events.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-[11px]">
          No synced events found. Connect calendar or sync to load.
        </div>
      ) : (
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {events.map((ev) => (
            <div 
              key={ev.id} 
              className="p-3 border border-slate-100 bg-slate-50/20 hover:bg-slate-50/50 rounded-[8px] transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 leading-tight">{ev.title}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded capitalize ${
                  ev.status === 'completed' 
                    ? 'bg-slate-100 border border-slate-300 text-slate-550' 
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                }`}>
                  {ev.status}
                </span>
              </div>

              {ev.description && (
                <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal">{ev.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {formatEventTime(ev.start_time, ev.end_time)}
                </span>
                {ev.location && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {ev.location}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
