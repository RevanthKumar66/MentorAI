import { supabase } from '@/lib/supabase';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

export class TaskRepository {
  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User is not authenticated');
    }
    return session.user.id;
  }

  async listTasks(goalId?: string): Promise<Task[]> {
    const userId = await this.getUserId();
    let query = supabase
      .from('lifesaver_tasks')
      .select('*')
      .eq('user_id', userId);

    if (goalId) {
      query = query.eq('goal_id', goalId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_tasks')
      .insert({
        ...input,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_tasks')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('lifesaver_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
export const taskRepository = new TaskRepository();
