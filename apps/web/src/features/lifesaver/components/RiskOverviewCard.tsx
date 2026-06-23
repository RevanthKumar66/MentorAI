import React from 'react';
import { StatsCard } from './StatsCard';
import { ShieldAlert, AlertTriangle, Activity, CheckSquare } from 'lucide-react';

interface RiskOverviewCardProps {
  atRiskCount: number;
  criticalCount: number;
  avgProbability: number;
  recoveryOpportunities: number;
}

export const RiskOverviewCard: React.FC<RiskOverviewCardProps> = ({
  atRiskCount,
  criticalCount,
  avgProbability,
  recoveryOpportunities,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        label="Goals At Risk"
        value={atRiskCount}
        icon={AlertTriangle}
        description="Moderate to High risk status"
        gradientFrom="from-amber-50/50"
        gradientTo="to-orange-50/30"
        iconColorClass="text-amber-600"
      />
      <StatsCard
        label="Critical Goals"
        value={criticalCount}
        icon={ShieldAlert}
        description="Immediate action required"
        gradientFrom="from-rose-50/50"
        gradientTo="to-red-50/30"
        iconColorClass="text-rose-600"
      />
      <StatsCard
        label="Average Probability"
        value={`${avgProbability}%`}
        icon={Activity}
        description="Goal success likelihood"
        gradientFrom="from-blue-50/50"
        gradientTo="to-indigo-50/30"
        iconColorClass="text-blue-600"
      />
      <StatsCard
        label="Recovery Paths"
        value={recoveryOpportunities}
        icon={CheckSquare}
        description="AI Recovery plans available"
        gradientFrom="from-emerald-50/50"
        gradientTo="to-teal-50/30"
        iconColorClass="text-emerald-600"
      />
    </div>
  );
};
export default RiskOverviewCard;
