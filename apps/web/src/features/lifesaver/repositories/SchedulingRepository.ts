import { supabase } from '@/lib/supabase';
import { CalendarConnection, CalendarEvent, ScheduleSuggestion, RecoverySchedule } from '../types/scheduling';

export class SchedulingRepository {
  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User is not authenticated');
    }
    return session.user.id;
  }

  async getConnection(): Promise<CalendarConnection | null> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async deleteConnection(): Promise<void> {
    const userId = await this.getUserId();
    const { error: errorEvents } = await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', userId);
    if (errorEvents) throw errorEvents;

    const { error: errorConn } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('user_id', userId);
    if (errorConn) throw errorConn;
  }

  async listEvents(): Promise<CalendarEvent[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createEvent(event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...event,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listSuggestions(): Promise<ScheduleSuggestion[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('schedule_suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('suggested_start', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async saveSuggestions(suggestions: Omit<ScheduleSuggestion, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>[]): Promise<ScheduleSuggestion[]> {
    const userId = await this.getUserId();
    
    // Purge existing suggested ones first to avoid duplicates
    const { error: purgeError } = await supabase
      .from('schedule_suggestions')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'suggested');
    if (purgeError) throw purgeError;

    if (suggestions.length === 0) return [];

    const { data, error } = await supabase
      .from('schedule_suggestions')
      .insert(
        suggestions.map(s => ({
          ...s,
          user_id: userId,
          status: 'suggested'
        }))
      )
      .select();

    if (error) throw error;
    return data || [];
  }

  async updateSuggestionStatus(id: string, status: ScheduleSuggestion['status']): Promise<ScheduleSuggestion> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('schedule_suggestions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRecoverySchedules(): Promise<RecoverySchedule[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('recovery_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveRecoverySchedule(plan: Omit<RecoverySchedule, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<RecoverySchedule> {
    const userId = await this.getUserId();
    
    // Delete older plan for this goal
    await supabase
      .from('recovery_schedules')
      .delete()
      .eq('user_id', userId)
      .eq('goal_id', plan.goal_id);

    const { data, error } = await supabase
      .from('recovery_schedules')
      .insert({
        ...plan,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const schedulingRepository = new SchedulingRepository();
