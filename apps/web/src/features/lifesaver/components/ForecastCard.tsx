import React from 'react';
import { TrendingUp, Compass } from 'lucide-react';

interface ForecastCardProps {
  goalTitle: string;
  currentProgress: number; // e.g. 35
  predictedProgress: number; // e.g. 52
  forecastText: string;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({
  goalTitle,
  currentProgress,
  predictedProgress,
  forecastText,
}) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-[12px] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Compass className="w-4 h-4 text-slate-900 shrink-0" />
        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
          Trajectory & Forecast
        </h4>
      </div>

      <p className="text-[11px] font-bold text-slate-950 leading-tight">
        {goalTitle}
      </p>

      <div className="space-y-3.5">
        {/* Current Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px] font-semibold">
            <span className="text-slate-700 uppercase tracking-wider">Current Completed Progress</span>
            <span className="text-slate-900">{currentProgress}%</span>
          </div>
          <div className="h-2 bg-slate-50 border border-slate-200/40 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 rounded-full" style={{ width: `${currentProgress}%` }} />
          </div>
        </div>

        {/* Predicted Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px] font-semibold">
            <span className="text-slate-700 uppercase tracking-wider">Predicted Pace Completion</span>
            <span className="text-slate-900">{predictedProgress}%</span>
          </div>
          <div className="h-2 bg-slate-50 border border-slate-200/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                predictedProgress < 50
                  ? 'bg-rose-450 text-rose-800'
                  : predictedProgress < 80
                  ? 'bg-amber-450 text-amber-800'
                  : 'bg-emerald-450 text-emerald-800'
              }`}
              style={{ width: `${predictedProgress}%` }}
            />
          </div>
        </div>

        {/* Target Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9.5px] font-semibold">
            <span className="text-slate-700 uppercase tracking-wider">Target Required Progress</span>
            <span className="text-slate-900">100%</span>
          </div>
          <div className="h-2 bg-slate-50 border border-slate-200/40 rounded-full overflow-hidden">
            <div className="h-full bg-slate-200 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#fcfbf9] border border-slate-200/60 rounded-[8px] flex items-start gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-700 font-semibold leading-relaxed">
          {forecastText}
        </p>
      </div>
    </div>
  );
};
export default ForecastCard;
