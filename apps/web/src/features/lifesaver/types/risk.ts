export interface GoalRisk {
  id?: string;
  goal_id: string;
  user_id?: string;
  risk_score: number; // 0-100
  risk_level: 'On Track' | 'Moderate Risk' | 'High Risk' | 'Critical';
  completion_probability: number; // 0-100
  forecast_summary: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RecoveryPlan {
  id?: string;
  goal_id: string;
  user_id?: string;
  current_probability: number;
  predicted_probability: number;
  plan_summary: string;
  created_at?: string;
  updated_at?: string;
  recovery_tasks?: RecoveryTask[];
}

export interface RecoveryTask {
  id?: string;
  recovery_plan_id: string;
  user_id?: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  estimated_time: string | null;
  due_date: string | null;
  status: 'pending' | 'completed';
  created_at?: string;
  updated_at?: string;
  goal_id?: string;
}

export interface RiskAnalysisResponseGoal {
  goal_id: string;
  risk_score: number;
  risk_level: 'On Track' | 'Moderate Risk' | 'High Risk' | 'Critical';
  completion_probability: number;
  forecast_summary: string;
  warnings: string[];
  recovery_plan: {
    current_probability: number;
    predicted_probability: number;
    plan_summary: string;
    recovery_tasks: {
      title: string;
      description?: string;
      priority: 'high' | 'medium' | 'low';
      estimated_time?: string;
      days_offset: number;
    }[];
  } | null;
}

export interface RiskAnalysisResponse {
  goals: RiskAnalysisResponseGoal[];
}

export function getRiskLevelStyles(level: GoalRisk['risk_level']): {
  badge: string;
  dot: string;
  bar: string;
  text: string;
} {
  switch (level) {
    case 'On Track':
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-250',
        dot: 'bg-emerald-500',
        bar: 'bg-emerald-400',
        text: 'text-emerald-700',
      };
    case 'Moderate Risk':
      return {
        badge: 'bg-[#fef9c3]/50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        bar: 'bg-amber-400',
        text: 'text-amber-800',
      };
    case 'High Risk':
      return {
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
        bar: 'bg-orange-400',
        text: 'text-orange-700',
      };
    case 'Critical':
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        bar: 'bg-rose-400',
        text: 'text-rose-700',
      };
  }
}
