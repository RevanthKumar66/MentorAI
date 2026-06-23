export interface Task {
  id: string;
  goal_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  created_at: string;
  updated_at: string;
}

export type CreateTaskInput = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateTaskInput = Partial<CreateTaskInput> & { status?: Task['status']; priority?: Task['priority'] };
