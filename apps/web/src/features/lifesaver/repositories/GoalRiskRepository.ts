import { supabase } from '@/lib/supabase';
import { GoalRisk } from '../types/risk';

export class GoalRiskRepository {
  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error('User is not authenticated');
    return session.user.id;
  }

  /** Upsert an array of goal risks. */
  async saveGoalRisks(risks: GoalRisk[]): Promise<void> {
    const userId = await this.getUserId();
    if (risks.length === 0) return;

    const rows = risks.map((r) => ({
      goal_id: r.goal_id,
      user_id: userId,
      risk_score: r.risk_score,
      risk_level: r.risk_level,
      completion_probability: r.completion_probability,
      forecast_summary: r.forecast_summary,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('lifesaver_goal_risk')
      .upsert(rows, { onConflict: 'goal_id,user_id' });

    if (error) throw error;
  }

  /** Fetch all risks for the current user, keyed by goal_id. */
  async getRisksForUser(): Promise<Record<string, GoalRisk>> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_goal_risk')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const map: Record<string, GoalRisk> = {};
    (data || []).forEach((row: GoalRisk) => {
      map[row.goal_id] = row;
    });
    return map;
  }

  /** Fetch risk for a single goal. */
  async getRiskForGoal(goalId: string): Promise<GoalRisk | null> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_goal_risk')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export const goalRiskRepository = new GoalRiskRepository();
