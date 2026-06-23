export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: string;
  calendar_id: string;
  access_token: string;
  refresh_token?: string;
  email: string;
  connected_at: string;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  provider: string;
  external_event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleSuggestion {
  id: string;
  user_id: string;
  goal_id: string;
  task_id: string;
  task_title?: string;
  suggested_start: string;
  suggested_end: string;
  reason: string;
  confidence_score: number;
  status: 'suggested' | 'accepted' | 'rejected' | 'applied';
  created_at: string;
  updated_at: string;
}

export interface RecoverySchedule {
  id: string;
  goal_id: string;
  user_id: string;
  current_probability: number;
  predicted_probability: number;
  generated_plan: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityBlock {
  start: string;
  end: string;
  label: string;
  is_deep_work: boolean;
}

export interface CalendarConflict {
  task_id: string;
  task_title: string;
  event_title: string;
  overlap_time: string;
  suggested_alternative_start: string;
  suggested_alternative_end: string;
  reason: string;
}

export interface MissedSession {
  task_id: string;
  task_title: string;
  missed_time: string;
  status: 'missed';
}

export interface SchedulingAnalysisResponse {
  availability: AvailabilityBlock[];
  conflicts: CalendarConflict[];
  suggestions: ScheduleSuggestion[];
  missedSessions: MissedSession[];
  recoveryPlan: {
    goal_id: string;
    goal_title: string;
    current_probability: number;
    predicted_probability: number;
    generated_plan: string;
    recovery_tasks: {
      title: string;
      description: string;
      start_time: string;
      end_time: string;
    }[];
  } | null;
  reminders: string[];
}

export interface VoiceAssistantResponse {
  goal: {
    title: string;
    category: string;
    target_date: string;
    hours_per_day: string;
    experience_level: string;
  } | null;
  tasks: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    days_offset: number;
  }[];
  milestones: {
    week_number: number;
    title: string;
    description: string;
  }[];
  events: {
    title: string;
    description: string;
    hours_offset: number;
    duration_hours: number;
  }[];
  coachingMessage: string;
}
