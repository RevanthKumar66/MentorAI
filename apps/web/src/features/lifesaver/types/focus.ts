// ─── Task Score (persisted in lifesaver_task_scores) ────────────────────────
export interface TaskScore {
  id: string;
  task_id: string;
  goal_id: string | null;
  user_id: string;
  priority_score: number; // 0-100
  urgency_score: number;
  impact_score: number;
  goal_alignment_score: number;
  generated_at: string;
  updated_at: string;
}

export type TaskScoreMap = Record<string, TaskScore>; // keyed by task_id

// ─── Goal Health ─────────────────────────────────────────────────────────────
export type GoalHealthStatus = 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';

export interface GoalHealth {
  goal_id: string;
  goal_title: string;
  health: GoalHealthStatus;
  risk_score: number; // 0-100
  days_remaining: number;
  milestones_completed: number;
  milestones_total: number;
}

// ─── AI Mission (returned from /focus/generate) ───────────────────────────────
export interface AIMission {
  greeting: string;
  mission_summary: string;
  estimated_time: string;
  impact_level: 'High' | 'Medium' | 'Low';
  progress_boost: string; // e.g. "+12%"
  recommendations: {
    text: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  warning: string | null;
}

// ─── Scored Task (returned from /priority/score) ──────────────────────────────
export interface ScoredTask {
  task_id: string;
  goal_id: string | null;
  priority_score: number;
  urgency_score: number;
  impact_score: number;
  goal_alignment_score: number;
}

// ─── Top Task (returned inside focus/generate response) ──────────────────────
export interface FocusTopTask {
  task_id: string;
  task_title: string;
  priority_score: number;
  urgency_score: number;
  due_date: string | null;
  goal_title: string | null;
}

// ─── Full Focus AI Response from backend ─────────────────────────────────────
export interface FocusAIResponse {
  focus_score: number; // 0-100
  focus_label: 'Excellent Focus' | 'Good Progress' | 'Needs Attention' | 'Critical';
  top_tasks: FocusTopTask[];
  goal_health: GoalHealth[];
  mission: AIMission;
}

// ─── Score label helpers ─────────────────────────────────────────────────────
export function getPriorityScoreLabel(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export function getHealthLabel(health: GoalHealthStatus): string {
  switch (health) {
    case 'ON_TRACK': return 'On Track';
    case 'AT_RISK': return 'At Risk';
    case 'CRITICAL': return 'Critical';
  }
}
