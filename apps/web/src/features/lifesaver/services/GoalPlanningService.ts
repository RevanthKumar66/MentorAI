import { supabase } from '@/lib/supabase';
import { goalPlanningRepository } from '../repositories/GoalPlanningRepository';
import { AIGoalPlanResponse, GoalPlan, Milestone, Recommendation } from '../types/planner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class GoalPlanningService {
  private async getHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User is not authenticated');
    }
    return session.user.id;
  }

  async generatePlan(payload: {
    title: string;
    category?: string | null;
    target_date?: string | null;
    hours_per_day?: string | null;
    experience_level?: string | null;
  }): Promise<AIGoalPlanResponse> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/planner/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || 'Failed to generate AI execution plan');
    }

    const body = await res.json();
    return body.data;
  }

  async saveGoalPlan(goalId: string, plan: AIGoalPlanResponse): Promise<void> {
    const userId = await this.getUserId();

    // 1. Save main goal plan metadata
    await goalPlanningRepository.savePlan(goalId, {
      summary: plan.summary,
      difficulty: plan.estimatedDifficulty,
      completion_probability: plan.estimatedCompletionProbability,
      raw_ai_response: plan,
    });

    // 2. Save Milestones
    const milestonesPayload = plan.milestones.map((m) => ({
      title: m.title,
      description: m.description,
      week_number: m.week_number,
    }));
    await goalPlanningRepository.saveMilestones(goalId, milestonesPayload);

    // 3. Save Recommendations
    const recommendationsPayload = plan.recommendations.map((r) => ({
      recommendation: r.recommendation,
      priority: r.priority,
    }));
    await goalPlanningRepository.saveRecommendations(goalId, recommendationsPayload);

    // 4. Save Suggested Tasks as real checkable tasks in lifesaver_tasks
    // First, delete existing tasks linked to this goal to keep it in sync
    await supabase
      .from('lifesaver_tasks')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    if (plan.recommendedTasks && plan.recommendedTasks.length > 0) {
      const tasksRows = plan.recommendedTasks.map((t) => {
        // Calculate due date based on week number
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + t.week_number * 7);
        
        return {
          goal_id: goalId,
          user_id: userId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: 'pending' as const,
          due_date: dueDate.toISOString(),
        };
      });

      const { error: tasksError } = await supabase
        .from('lifesaver_tasks')
        .insert(tasksRows);

      if (tasksError) {
        console.error('Failed to auto-insert recommended tasks:', tasksError);
      }
    }
  }

  async getGoalPlanDetails(goalId: string): Promise<{
    plan: GoalPlan | null;
    milestones: Milestone[];
    recommendations: Recommendation[];
  }> {
    const [plan, milestones, recommendations] = await Promise.all([
      goalPlanningRepository.getPlanForGoal(goalId),
      goalPlanningRepository.getMilestonesForGoal(goalId),
      goalPlanningRepository.getRecommendationsForGoal(goalId),
    ]);

    return {
      plan,
      milestones,
      recommendations,
    };
  }
}
export const goalPlanningService = new GoalPlanningService();
