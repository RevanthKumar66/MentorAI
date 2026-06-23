export interface AgentOverview {
  focus_score: number;
  confidence_score: number;
  goals_monitored: number;
  tasks_monitored: number;
  calendar_connected: boolean;
  active_signals_count: number;
  timestamp: string;
}

export interface AgentSignal {
  id: string;
  signal_type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AgentNotification {
  id: string;
  category: string;
  title: string;
  body: string;
  channels: string[];
  status: string;
  sent_at: string;
  email_sent_at?: string;
}

export interface MentorMessage {
  id: string;
  message: string;
  category: string;
  created_at: string;
}

export interface DailyBriefing {
  briefing_data: {
    mission?: string;
    priority_tasks?: string[];
    warnings?: string[];
    reflection?: string;
    completed_count?: number;
    missed_tasks?: string[];
    tomorrow_recommendations?: string[];
  };
  briefing_text: string;
  created_at: string;
}

export interface WeeklyReview {
  id: string;
  week_start_date: string;
  week_end_date: string;
  focus_score: number;
  goal_progress: Array<{ goal: string; progress: number }>;
  task_completion_rate: number;
  risk_trends: Array<{ day: string; risk: number }>;
  recovery_success_rate: number;
  calendar_utilization: number;
  deep_work_hours: number;
  report_text: string;
  created_at: string;
}

export interface AgentActivityLog {
  id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface KnowledgeSource {
  id: string;
  title: string;
  source_type: string;
  created_at: string;
  document_id: string;
  processing_status: string;
  is_processed: boolean;
}
