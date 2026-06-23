export interface WeeklyPlanItem {
  week_number: number;
  topics: string[];
}

export interface AIPlanTaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  week_number: number;
}

export interface AIGoalPlanResponse {
  goal: string;
  summary: string;
  estimatedDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedCompletionProbability: string; // e.g. "85%"
  milestones: {
    week_number: number;
    title: string;
    description: string;
  }[];
  weeklyPlan: WeeklyPlanItem[];
  recommendedTasks: AIPlanTaskSuggestion[];
  risks: string[];
  recommendations: {
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }[];
}

export interface GoalPlan {
  id: string;
  goal_id: string;
  user_id: string;
  summary: string | null;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  completion_probability: string | null;
  raw_ai_response: AIGoalPlanResponse | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description: string | null;
  week_number: number;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  goal_id: string;
  user_id: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}
