import { supabase } from '@/lib/supabase';
import { Goal, CreateGoalInput, UpdateGoalInput } from '../types/goal';

export class GoalRepository {
  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User is not authenticated');
    }
    return session.user.id;
  }

  async listGoals(): Promise<Goal[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createGoal(input: CreateGoalInput): Promise<Goal> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_goals')
      .insert({
        ...input,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_goals')
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

  async deleteGoal(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('lifesaver_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
export const goalRepository = new GoalRepository();
