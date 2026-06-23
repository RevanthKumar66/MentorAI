import { supabase } from '@/lib/supabase';
import { FocusAIResponse, ScoredTask, TaskScoreMap } from '../types/focus';
import { Task } from '../types/task';
import { Goal } from '../types/goal';
import { Milestone } from '../types/planner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** Resolve the user's display name from their auth metadata. */
export function resolveUserName(user: {
  user_metadata?: { full_name?: string; name?: string };
  email?: string;
} | null): string {
  if (!user) return 'there';
  const meta = user.user_metadata;
  if (meta?.full_name?.trim()) return meta.full_name.trim().split(' ')[0];
  if (meta?.name?.trim()) return meta.name.trim().split(' ')[0];
  if (user.email) return user.email.split('@')[0];
  return 'there';
}

export class MissionGenerationService {
  private async getHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async getUserName(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    return resolveUserName(user);
  }

  /**
   * Full pipeline: calls /focus/generate with all context data.
   * The backend computes goal health, focus score, and generates Gemini mission.
   */
  async generateMission(
    goals: Goal[],
    tasks: Task[],
    milestones: Milestone[],
    scoreMap: TaskScoreMap
  ): Promise<FocusAIResponse> {
    const [headers, userName] = await Promise.all([
      this.getHeaders(),
      this.getUserName(),
    ]);

    // Build goal map for title lookup
    const goalMap: Record<string, Goal> = {};
    goals.forEach((g) => { goalMap[g.id] = g; });

    // Build top scored tasks for the request
    const scoredTasks: ScoredTask[] = Object.values(scoreMap)
      .sort((a, b) => b.priority_score - a.priority_score);

    const scoredTasksForApi = scoredTasks.slice(0, 10).map((s) => {
      const task = tasks.find((t) => t.id === s.task_id);
      const goal = s.goal_id ? goalMap[s.goal_id] : null;
      return {
        task_id: s.task_id,
        task_title: task?.title ?? 'Unknown Task',
        priority_score: s.priority_score,
        urgency_score: s.urgency_score,
        due_date: task?.due_date ?? null,
        goal_title: goal?.title ?? null,
      };
    });

    const response = await fetch(`${API_BASE_URL}/lifesaver/focus/generate`, {
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
        scored_tasks: scoredTasksForApi,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Focus generation failed');
    }

    const json = await response.json();
    return json.data as FocusAIResponse;
  }
}

export const missionGenerationService = new MissionGenerationService();
