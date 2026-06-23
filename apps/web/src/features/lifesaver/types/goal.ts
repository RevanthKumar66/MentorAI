export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string;
  status: 'active' | 'completed' | 'paused';
  category?: string | null;
  hours_per_day?: string | null;
  experience_level?: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateGoalInput = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateGoalInput = Partial<CreateGoalInput> & { status?: Goal['status'] };
