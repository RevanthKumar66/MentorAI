import { supabase } from '@/lib/supabase';
import { goalRiskRepository } from '../repositories/GoalRiskRepository';
import { recoveryPlannerRepository } from '../repositories/RecoveryPlannerRepository';
import { GoalRisk, RiskAnalysisResponse } from '../types/risk';
import { Goal } from '../types/goal';
import { Task } from '../types/task';
import { Milestone } from '../types/planner';
import { resolveUserName } from './MissionGenerationService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class RiskPredictionService {
  private async getHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /** Load saved risks from local DB. */
  async loadGoalRisks(): Promise<Record<string, GoalRisk>> {
    return goalRiskRepository.getRisksForUser();
  }

  /** Runs backend forecasting/risk calculator and stores both risks and recovery plans to the DB. */
  async runRiskAnalysis(
    goals: Goal[],
    tasks: Task[],
    milestones: Milestone[]
  ): Promise<{ risks: Record<string, GoalRisk>; raw: RiskAnalysisResponse }> {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = resolveUserName(user);
    const headers = await this.getHeaders();

    const response = await fetch(`${API_BASE_URL}/lifesaver/risk/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_name: userName,
        goals: goals.map((g) => ({
          id: g.id,
          title: g.title,
          status: g.status,
          target_date: g.target_date || null,
          category: g.category || null,
        })),
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          due_date: t.due_date || null,
          goal_id: t.goal_id || null,
        })),
        milestones: milestones.map((m) => ({
          id: m.id,
          goal_id: m.goal_id,
          week_number: m.week_number,
          status: m.status,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Risk analysis failed');
    }

    const json = await response.json();
    const data: RiskAnalysisResponse = json.data as RiskAnalysisResponse;

    const risksToSave: GoalRisk[] = [];

    // Save each goal risk and its AI recovery plan/tasks
    for (const r of data.goals) {
      risksToSave.push({
        goal_id: r.goal_id,
        risk_score: r.risk_score,
        risk_level: r.risk_level,
        completion_probability: r.completion_probability,
        forecast_summary: r.forecast_summary,
      });

      if (r.recovery_plan) {
        // Translate days_offset into absolute date string
        const tasksWithDates = r.recovery_plan.recovery_tasks.map((task) => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + task.days_offset);
          dueDate.setHours(23, 59, 59, 999); // end of day
          return {
            title: task.title,
            description: task.description || null,
            priority: task.priority,
            estimated_time: task.estimated_time || null,
            due_date: dueDate.toISOString(),
            status: 'pending' as const,
          };
        });

        await recoveryPlannerRepository.saveRecoveryPlan(
          r.goal_id,
          r.recovery_plan.current_probability,
          r.recovery_plan.predicted_probability,
          r.recovery_plan.plan_summary,
          tasksWithDates
        );
      }
    }

    // Save risk scores
    await goalRiskRepository.saveGoalRisks(risksToSave);
    const risksMap = await goalRiskRepository.getRisksForUser();

    return {
      risks: risksMap,
      raw: data,
    };
  }
}

export const riskPredictionService = new RiskPredictionService();
