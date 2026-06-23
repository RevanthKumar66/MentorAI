import { supabase } from '@/lib/supabase';
import { RecoveryPlan, RecoveryTask } from '../types/risk';

export class RecoveryPlannerRepository {
  private async getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error('User is not authenticated');
    return session.user.id;
  }

  /** Fetch recovery plan and all associated recovery tasks for a goal. */
  async getRecoveryPlanForGoal(goalId: string): Promise<RecoveryPlan | null> {
    const userId = await this.getUserId();
    
    // Fetch plan
    const { data: plan, error: planError } = await supabase
      .from('lifesaver_recovery_plans')
      .select('*')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .maybeSingle();

    if (planError) throw planError;
    if (!plan) return null;

    // Fetch tasks linked to plan
    const { data: tasks, error: tasksError } = await supabase
      .from('lifesaver_recovery_tasks')
      .select('*')
      .eq('recovery_plan_id', plan.id)
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (tasksError) throw tasksError;

    return {
      ...plan,
      recovery_tasks: tasks || [],
    };
  }

  /** Save a recovery plan and its associated recovery tasks (replacing older tasks). */
  async saveRecoveryPlan(
    goalId: string,
    currentProb: number,
    predictedProb: number,
    planSummary: string,
    recoveryTasks: Omit<RecoveryTask, 'id' | 'recovery_plan_id' | 'user_id'>[]
  ): Promise<RecoveryPlan> {
    const userId = await this.getUserId();

    // Upsert plan
    const { data: plan, error: planError } = await supabase
      .from('lifesaver_recovery_plans')
      .upsert(
        {
          goal_id: goalId,
          user_id: userId,
          current_probability: currentProb,
          predicted_probability: predictedProb,
          plan_summary: planSummary,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'goal_id,user_id' }
      )
      .select()
      .single();

    if (planError) throw planError;

    // Delete existing recovery tasks for this plan
    const { error: deleteError } = await supabase
      .from('lifesaver_recovery_tasks')
      .delete()
      .eq('recovery_plan_id', plan.id)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Insert new recovery tasks
    if (recoveryTasks.length > 0) {
      const taskRows = recoveryTasks.map((t) => ({
        recovery_plan_id: plan.id,
        user_id: userId,
        title: t.title,
        description: t.description || null,
        priority: t.priority,
        estimated_time: t.estimated_time || null,
        due_date: t.due_date,
        status: t.status || 'pending',
      }));

      const { data: insertedTasks, error: insertError } = await supabase
        .from('lifesaver_recovery_tasks')
        .insert(taskRows)
        .select();

      if (insertError) throw insertError;
      plan.recovery_tasks = insertedTasks || [];
    } else {
      plan.recovery_tasks = [];
    }

    return plan;
  }

  /** Get all recovery tasks for the current user. */
  async getRecoveryTasksForUser(): Promise<RecoveryTask[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lifesaver_recovery_tasks')
      .select('*, lifesaver_recovery_plans(goal_id)')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => {
      const typedRow = row as unknown as RecoveryTask & {
        lifesaver_recovery_plans: { goal_id: string } | null;
      };
      return {
        ...typedRow,
        goal_id: typedRow.lifesaver_recovery_plans?.goal_id || undefined,
      };
    });
  }

  /** Toggle recovery task status between pending and completed. */
  async updateRecoveryTaskStatus(taskId: string, status: 'pending' | 'completed'): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('lifesaver_recovery_tasks')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const recoveryPlannerRepository = new RecoveryPlannerRepository();
