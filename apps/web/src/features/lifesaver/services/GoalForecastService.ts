import { Goal } from '../types/goal';
import { Task } from '../types/task';

export class GoalForecastService {
  /**
   * Predicts future goal completion probability based on local telemetry.
   */
  forecastGoalProgress(
    goal: Goal,
    tasks: Task[]
  ): { expectedCompletionProbability: number; forecastText: string } {
    const goalTasks = tasks.filter((t) => t.goal_id === goal.id);
    const total = goalTasks.length;
    const completed = goalTasks.filter((t) => t.status === 'completed').length;

    if (total === 0) {
      return {
        expectedCompletionProbability: 100,
        forecastText: 'No tasks added yet. Create subtasks to enable pace projection.',
      };
    }

    const now = new Date();
    const target = new Date(goal.target_date);
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const daysLeft = Math.floor((target.getTime() - now.getTime()) / 86_400_000);
    const ratio = completed / total;

    if (daysLeft <= 0) {
      const pct = Math.round(ratio * 100);
      return {
        expectedCompletionProbability: pct,
        forecastText: `Deadline reached. Final completion pace: ${pct}%.`,
      };
    }

    // Project probability based on completion pace and time remaining
    const multiplier = daysLeft >= 30 ? 1.15 : daysLeft >= 14 ? 1.05 : 0.85;
    const predicted = Math.min(99, Math.max(5, Math.round(ratio * 100 * multiplier + (daysLeft > 20 ? 10 : 2))));

    return {
      expectedCompletionProbability: predicted,
      forecastText: `Expected completion at the current pace is ${predicted}%.`,
    };
  }
}

export const goalForecastService = new GoalForecastService();
