import React from 'react';
import { CalendarEvent, AvailabilityBlock } from '../types/scheduling';
import { Task } from '../types/task';
import { Clock, Calendar, CheckSquare, MapPin } from 'lucide-react';

interface TimelineItem {
  type: 'event' | 'task' | 'free';
  time: Date;
  endTime?: Date;
  title: string;
  subtitle?: string;
  isDeepWork?: boolean;
  status?: string;
}

interface Props {
  events: CalendarEvent[];
  tasks: Task[];
  availability: AvailabilityBlock[];
}

export function AvailabilityTimeline({ events, tasks, availability }: Props) {
  // We'll combine and sort timeline items for Today and Tomorrow
  const getTimelineItems = (targetDate: Date) => {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const items: TimelineItem[] = [];

    // Add Events
    events.forEach(e => {
      const eStart = new Date(e.start_time);
      if (eStart >= startOfDay && eStart <= endOfDay) {
        items.push({
          type: 'event',
          time: eStart,
          endTime: new Date(e.end_time),
          title: e.title,
          subtitle: e.location || 'Meeting',
          status: e.status
        });
      }
    });

    // Add Tasks
    tasks.forEach(t => {
      if (t.due_date) {
        const tDue = new Date(t.due_date);
        if (tDue >= startOfDay && tDue <= endOfDay) {
          items.push({
            type: 'task',
            time: tDue,
            title: t.title,
            subtitle: `Priority: ${t.priority}`,
            status: t.status
          });
        }
      }
    });

    // Add Free Slots
    availability.forEach(a => {
      const aStart = new Date(a.start);
      if (aStart >= startOfDay && aStart <= endOfDay) {
        items.push({
          type: 'free',
          time: aStart,
          endTime: new Date(a.end),
          title: a.label,
          isDeepWork: a.is_deep_work
        });
      }
    });

    // Sort items chronologically
    return items.sort((a, b) => a.time.getTime() - b.time.getTime());
  };

  const formatHour = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  const todayItems = getTimelineItems(today);
  const tomorrowItems = getTimelineItems(tomorrow);
  const dayAfterItems = getTimelineItems(dayAfter);

  const formatDayLabel = (d: Date) => {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const renderTimelineSection = (title: string, items: TimelineItem[]) => {
    return (
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {title}
        </h4>
        {items.length === 0 ? (
          <p className="text-[10px] text-slate-500 py-3 text-center bg-slate-50/20 border border-dashed border-slate-200 rounded-[8px]">
            No commitments or availability windows calculated.
          </p>
        ) : (
          <div className="relative border-l-2 border-slate-150 pl-4 ml-2 space-y-4">
            {items.map((item, idx) => {
              let bgClass = 'bg-white border-slate-200';
              
              if (item.type === 'event') {
                bgClass = 'bg-indigo-50/15 border-indigo-250';
              } else if (item.type === 'task') {
                bgClass = item.status === 'completed' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-slate-50/20 border-slate-250';
              } else if (item.type === 'free') {
                bgClass = item.isDeepWork ? 'bg-amber-50/15 border-amber-250' : 'bg-emerald-50/10 border-emerald-250';
              }

              return (
                <div key={idx} className="relative group">
                  {/* Circle Indicator on vertical line */}
                  <div className={`absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border-2 bg-white ${
                    item.type === 'event' ? 'border-indigo-600' :
                    item.type === 'task' ? 'border-slate-500' :
                    item.isDeepWork ? 'border-amber-600' : 'border-emerald-600'
                  }`} />
                  
                  {/* Card content */}
                  <div className={`p-3 border rounded-[8px] flex items-center justify-between gap-3 shadow-xs ${bgClass}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {item.title}
                        </span>
                        {item.type === 'free' && item.isDeepWork && (
                          <span className="text-[8.5px] font-bold px-1.5 py-0.2 bg-amber-50 border border-amber-250 text-amber-700 rounded flex items-center">
                            Deep Focus
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatHour(item.time)}
                          {item.endTime && ` - ${formatHour(item.endTime)}`}
                        </span>
                        {item.subtitle && (
                          <span className="flex items-center gap-0.5">
                            {item.type === 'event' ? (
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] p-6 space-y-6 shadow-xs">
      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Clock className="w-4 h-4 text-slate-500" />
        Schedule & Timeline Overview
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderTimelineSection("Today", todayItems)}
        {renderTimelineSection("Tomorrow", tomorrowItems)}
        {renderTimelineSection(formatDayLabel(dayAfter), dayAfterItems)}
      </div>
    </div>
  );
}
