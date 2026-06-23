import { supabase } from '@/lib/supabase';
import { GoalHealth } from '../types/focus';

export class GoalHealthRepository {
  /** Persist goal health evaluations back to lifesaver_goals. */
  async saveGoalHealthBatch(healthList: GoalHealth[]): Promise<void> {
    if (healthList.length === 0) return;

    const updates = healthList.map((h) => ({
      id: h.goal_id,
      goal_health: h.health,
      risk_score: h.risk_score,
      last_evaluated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('lifesaver_goals')
        .update({
          goal_health: update.goal_health,
          risk_score: update.risk_score,
          last_evaluated_at: update.last_evaluated_at,
        })
        .eq('id', update.id);

      if (error) throw error;
    }
  }

  /** Fetch goal health fields for a single goal. */
  async getGoalHealth(goalId: string): Promise<{
    goal_health: string;
    risk_score: number;
    last_evaluated_at: string | null;
  } | null> {
    const { data, error } = await supabase
      .from('lifesaver_goals')
      .select('goal_health, risk_score, last_evaluated_at')
      .eq('id', goalId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export const goalHealthRepository = new GoalHealthRepository();
