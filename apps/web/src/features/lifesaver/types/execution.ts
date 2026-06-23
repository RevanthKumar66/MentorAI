export interface RescheduleSuggestion {
  id: string;
  task_id: string;
  user_id: string;
  old_due_date: string;
  new_due_date: string;
  reason: string;
  status: 'suggested' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  // Included relations optionally
  lifesaver_tasks?: {
    title: string;
    priority: string;
    status: string;
  };
}

export interface CoachingLog {
  id: string;
  user_id: string;
  coach_message: string;
  focus_score: number | null;
  productivity_score: number | null;
  created_at: string;
}

export interface ProductivityInsight {
  id: string;
  user_id: string;
  insight: string;
  confidence_score: number;
  created_at: string;
}

export interface AIRescheduleSuggestion {
  task_id: string;
  task_title: string;
  old_due_date: string;
  days_offset: number;
  reason: string;
}

export interface AIProductivityInsight {
  insight: string;
  confidence_score: number;
}

export interface AIRecoveryAction {
  goal_id: string;
  goal_title: string;
  immediate_recovery_action: string;
  priority_recovery_tasks: string[];
  expected_improvement: string;
}

export interface ExecutionAnalysisResponse {
  coachMessage: string;
  rescheduleSuggestions: AIRescheduleSuggestion[];
  productivityInsights: AIProductivityInsight[];
  optimizationSuggestions: string[];
  recoveryActions: AIRecoveryAction[];
}
