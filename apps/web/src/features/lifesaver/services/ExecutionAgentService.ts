import { supabase } from '@/lib/supabase';
import { executionAgentRepository } from '../repositories/ExecutionAgentRepository';
import { taskRepository } from '../repositories/TaskRepository';
import { Goal } from '../types/goal';
import { Task } from '../types/task';
import { Milestone } from '../types/planner';
import { GoalRisk } from '../types/risk';
import { ExecutionAnalysisResponse, RescheduleSuggestion } from '../types/execution';
import { resolveUserName } from './MissionGenerationService';
import { getApiBaseUrl } from '@/lib/api-config';

const API_BASE_URL = getApiBaseUrl();

export class ExecutionAgentService {
  private async getHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async loadRescheduleSuggestions(): Promise<RescheduleSuggestion[]> {
    return executionAgentRepository.listRescheduleSuggestions();
  }

  async loadCoachingLogs() {
    return executionAgentRepository.listCoachingLogs();
  }

  async loadProductivityInsights() {
    return executionAgentRepository.listProductivityInsights();
  }

  async runExecutionAnalysis(
    goals: Goal[],
    tasks: Task[],
    milestones: Milestone[],
    focusScore: number | null,
    goalRisks: GoalRisk[]
  ): Promise<ExecutionAnalysisResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = resolveUserName(user);
    const headers = await this.getHeaders();

    // Calculate completions for productivity score
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const response = await fetch(`${API_BASE_URL}/lifesaver/execution/analyze`, {
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
        focus_score: focusScore,
        goal_risks: goalRisks.map((gr) => ({
          goal_id: gr.goal_id,
          risk_score: gr.risk_score,
          risk_level: gr.risk_level,
          completion_probability: gr.completion_probability,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Execution analysis failed');
    }

    const json = await response.json();
    const data: ExecutionAnalysisResponse = json.data as ExecutionAnalysisResponse;

    // 1. Save coaching log
    await executionAgentRepository.saveCoachingLog(
      data.coachMessage,
      focusScore,
      completionRate
    );

    // 2. Save productivity insights
    await executionAgentRepository.saveProductivityInsights(data.productivityInsights);

    // 3. Save rescheduling suggestions (translate offset to date)
    const reschedulesToSave = data.rescheduleSuggestions.map((s) => {
      const newDue = new Date();
      newDue.setDate(newDue.getDate() + s.days_offset);
      // set to 23:59:59 local/UTC as end of day
      newDue.setHours(23, 59, 59, 999);

      return {
        task_id: s.task_id,
        old_due_date: s.old_due_date || new Date().toISOString(),
        new_due_date: newDue.toISOString(),
        reason: s.reason,
      };
    });

    await executionAgentRepository.saveRescheduleSuggestions(reschedulesToSave);

    return data;
  }

  async acceptReschedule(suggestionId: string): Promise<RescheduleSuggestion> {
    // 1. Update reschedule suggestion to 'accepted'
    const updatedSuggestion = await executionAgentRepository.updateRescheduleStatus(
      suggestionId,
      'accepted'
    );

    // 2. Update the actual task's due date in database
    await taskRepository.updateTask(updatedSuggestion.task_id, {
      due_date: updatedSuggestion.new_due_date,
    });

    return updatedSuggestion;
  }

  async rejectReschedule(suggestionId: string): Promise<RescheduleSuggestion> {
    // 1. Update reschedule suggestion to 'rejected'
    return executionAgentRepository.updateRescheduleStatus(suggestionId, 'rejected');
  }
}

export const executionAgentService = new ExecutionAgentService();
