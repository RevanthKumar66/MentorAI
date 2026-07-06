import { supabase } from '@/lib/supabase';
import { taskScoreRepository } from '../repositories/TaskScoreRepository';
import { ScoredTask, TaskScoreMap } from '../types/focus';
import { Task } from '../types/task';
import { Goal } from '../types/goal';
import { Milestone } from '../types/planner';
import { getApiBaseUrl } from '@/lib/api-config';

const API_BASE_URL = getApiBaseUrl();

export class PriorityEngineService {
  private async getHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Calls the backend priority scoring endpoint, persists results to
   * lifesaver_task_scores, and returns the full score map keyed by task_id.
   */
  async generateAndPersistScores(
    tasks: Task[],
    goals: Goal[],
    milestones: Milestone[]
  ): Promise<TaskScoreMap> {
    const headers = await this.getHeaders();

    const response = await fetch(`${API_BASE_URL}/lifesaver/priority/score`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          due_date: t.due_date || null,
          goal_id: t.goal_id || null,
        })),
        goals: goals.map((g) => ({
          id: g.id,
          title: g.title,
          status: g.status,
          target_date: g.target_date || null,
          category: g.category || null,
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
      throw new Error((err as { message?: string }).message || 'Priority scoring failed');
    }

    const json = await response.json();
    const scores: ScoredTask[] = (json.data?.scores ?? []) as ScoredTask[];

    // Persist to Supabase
    await taskScoreRepository.saveScores(scores);

    // Return as map for O(1) access
    const map: TaskScoreMap = {};
    for (const score of scores) {
      const full = await taskScoreRepository.getScoreForTask(score.task_id);
      if (full) map[score.task_id] = full;
    }
    return map;
  }

  /**
   * Reads persisted scores from Supabase (no backend call).
   * Use this on pages that just need to display scores.
   */
  async loadPersistedScores(): Promise<TaskScoreMap> {
    return taskScoreRepository.getScoresForUser();
  }
}

export const priorityEngineService = new PriorityEngineService();
