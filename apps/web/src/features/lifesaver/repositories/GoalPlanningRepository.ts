import { supabase } from '@/lib/supabase';
import { GoalPlan, Milestone, Recommendation } from '../types/planner';

export class GoalPlanningRepository {
  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User is not authenticated');
    }
    return session.user.id;
  }

  async getPlanForGoal(goalId: string): Promise<GoalPlan | null> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_goal_plans')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async savePlan(goalId: string, payload: {
    summary: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    completion_probability: string;
    raw_ai_response: any;
  }): Promise<GoalPlan> {
    const userId = await this.getUserId();
    
    // Check if plan already exists for this goal
    const existing = await this.getPlanForGoal(goalId);
    
    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('lifesaver_goal_plans')
        .update({
          summary: payload.summary,
          difficulty: payload.difficulty,
          completion_probability: payload.completion_probability,
          raw_ai_response: payload.raw_ai_response,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('lifesaver_goal_plans')
        .insert({
          goal_id: goalId,
          user_id: userId,
          summary: payload.summary,
          difficulty: payload.difficulty,
          completion_probability: payload.completion_probability,
          raw_ai_response: payload.raw_ai_response,
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }
    return result;
  }

  async getMilestonesForGoal(goalId: string): Promise<Milestone[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_milestones')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .order('week_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async saveMilestones(goalId: string, milestones: {
    title: string;
    description: string | null;
    week_number: number;
  }[]): Promise<Milestone[]> {
    const userId = await this.getUserId();
    
    // Delete existing milestones for this goal
    const { error: deleteError } = await supabase
      .from('lifesaver_milestones')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
    
    if (milestones.length === 0) return [];
    
    const rows = milestones.map((m) => ({
      goal_id: goalId,
      user_id: userId,
      title: m.title,
      description: m.description,
      week_number: m.week_number,
      status: 'not_started' as const,
    }));
    
    const { data, error } = await supabase
      .from('lifesaver_milestones')
      .insert(rows)
      .select();
      
    if (error) throw error;
    return data || [];
  }

  async getRecommendationsForGoal(goalId: string): Promise<Recommendation[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_recommendations')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async saveRecommendations(goalId: string, recommendations: {
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }[]): Promise<Recommendation[]> {
    const userId = await this.getUserId();
    
    // Delete existing recommendations
    const { error: deleteError } = await supabase
      .from('lifesaver_recommendations')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId);
      
    if (deleteError) throw deleteError;
    
    if (recommendations.length === 0) return [];
    
    const rows = recommendations.map((r) => ({
      goal_id: goalId,
      user_id: userId,
      recommendation: r.recommendation,
      priority: r.priority,
    }));
    
    const { data, error } = await supabase
      .from('lifesaver_recommendations')
      .insert(rows)
      .select();
      
    if (error) throw error;
    return data || [];
  }

  async deletePlanForGoal(goalId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('lifesaver_goal_plans')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
export const goalPlanningRepository = new GoalPlanningRepository();
