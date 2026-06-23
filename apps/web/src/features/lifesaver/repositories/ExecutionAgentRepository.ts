import { supabase } from '@/lib/supabase';
import { RescheduleSuggestion, CoachingLog, ProductivityInsight } from '../types/execution';

export class ExecutionAgentRepository {
  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User is not authenticated');
    }
    return session.user.id;
  }

  async listRescheduleSuggestions(): Promise<RescheduleSuggestion[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_reschedules')
      .select('*, lifesaver_tasks(title, priority, status)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveRescheduleSuggestions(
    suggestions: Omit<RescheduleSuggestion, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    const userId = await this.getUserId();

    // 1. Clear previous suggested reschedules for this user to avoid conflicts
    const { error: deleteError } = await supabase
      .from('lifesaver_reschedules')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'suggested');

    if (deleteError) throw deleteError;

    // 2. Insert new suggestions
    if (suggestions.length === 0) return;

    const { error: insertError } = await supabase
      .from('lifesaver_reschedules')
      .insert(
        suggestions.map((s) => ({
          task_id: s.task_id,
          user_id: userId,
          old_due_date: s.old_due_date,
          new_due_date: s.new_due_date,
          reason: s.reason,
          status: 'suggested',
        }))
      );

    if (insertError) throw insertError;
  }

  async updateRescheduleStatus(id: string, status: 'accepted' | 'rejected'): Promise<RescheduleSuggestion> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_reschedules')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, lifesaver_tasks(title, priority, status)')
      .single();

    if (error) throw error;
    return data;
  }

  async listCoachingLogs(): Promise<CoachingLog[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_coaching_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveCoachingLog(
    coachMessage: string,
    focusScore: number | null,
    productivityScore: number | null
  ): Promise<CoachingLog> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_coaching_logs')
      .insert({
        user_id: userId,
        coach_message: coachMessage,
        focus_score: focusScore,
        productivity_score: productivityScore,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listProductivityInsights(): Promise<ProductivityInsight[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_productivity_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveProductivityInsights(
    insights: { insight: string; confidence_score: number }[]
  ): Promise<void> {
    const userId = await this.getUserId();

    // Clear older insights
    const { error: deleteError } = await supabase
      .from('lifesaver_productivity_insights')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    if (insights.length === 0) return;

    const { error: insertError } = await supabase
      .from('lifesaver_productivity_insights')
      .insert(
        insights.map((i) => ({
          user_id: userId,
          insight: i.insight,
          confidence_score: i.confidence_score,
        }))
      );

    if (insertError) throw insertError;
  }
}

export const executionAgentRepository = new ExecutionAgentRepository();
