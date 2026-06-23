import React from 'react';
import { AlertCircle, AlertOctagon } from 'lucide-react';

interface WarningFeedProps {
  warnings: string[];
}

export const WarningFeed: React.FC<WarningFeedProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-[#fdf4f5] border border-rose-200 rounded-[12px] p-5 space-y-3">
      <div className="flex items-center gap-2">
        <AlertOctagon className="w-4 h-4 text-rose-700 shrink-0" />
        <h4 className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
          AI Risk Warnings & Critical Signals
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-[10.5px] text-rose-800 font-semibold leading-relaxed"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-550 shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default WarningFeed;
