import { supabase } from '@/lib/supabase';
import { TaskScore, ScoredTask } from '../types/focus';

export class TaskScoreRepository {
  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error('User is not authenticated');
    return session.user.id;
  }

  /** Upsert an array of scored tasks into the DB. */
  async saveScores(scores: ScoredTask[]): Promise<void> {
    const userId = await this.getUserId();
    if (scores.length === 0) return;

    const rows = scores.map((s) => ({
      task_id: s.task_id,
      goal_id: s.goal_id ?? null,
      user_id: userId,
      priority_score: s.priority_score,
      urgency_score: s.urgency_score,
      impact_score: s.impact_score,
      goal_alignment_score: s.goal_alignment_score,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('lifesaver_task_scores')
      .upsert(rows, { onConflict: 'task_id,user_id' });

    if (error) throw error;
  }

  /** Fetch all scores for the current user as a map keyed by task_id. */
  async getScoresForUser(): Promise<Record<string, TaskScore>> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_task_scores')
      .select('*')
      .eq('user_id', userId)
      .order('priority_score', { ascending: false });

    if (error) throw error;

    const map: Record<string, TaskScore> = {};
    (data || []).forEach((row: TaskScore) => {
      map[row.task_id] = row;
    });
    return map;
  }

  /** Fetch a single task's score. */
  async getScoreForTask(taskId: string): Promise<TaskScore | null> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_task_scores')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /** Delete all scores for the current user (use before a full rescore). */
  async clearScores(): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('lifesaver_task_scores')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
}

export const taskScoreRepository = new TaskScoreRepository();
