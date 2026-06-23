import { goalHealthRepository } from '../repositories/GoalHealthRepository';
import { GoalHealth, GoalHealthStatus } from '../types/focus';
import { Goal } from '../types/goal';
import { Milestone } from '../types/planner';
import { Task } from '../types/task';

export class GoalHealthService {
  /**
   * Evaluate health status for all active goals using local deterministic logic.
   * Persists results to lifesaver_goals and returns the list.
   */
  async evaluateAndPersist(
    goals: Goal[],
    tasks: Task[],
    milestones: Milestone[]
  ): Promise<GoalHealth[]> {
    const activeGoals = goals.filter((g) => g.status === 'active');
    const healthList = this.computeHealthList(activeGoals, tasks, milestones);

    // Persist to DB
    await goalHealthRepository.saveGoalHealthBatch(healthList);
    return healthList;
  }

  /**
   * Pure computation — no side effects. Useful when you already have data
   * and just need the health evaluation rendered locally.
   */
  computeHealthList(
    goals: Goal[],
    tasks: Task[],
    milestones: Milestone[]
  ): GoalHealth[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return goals
      .filter((g) => g.status === 'active')
      .map((goal) => {
        const goalMilestones = milestones.filter((m) => m.goal_id === goal.id);
        const totalMs = goalMilestones.length;
        const completedMs = goalMilestones.filter((m) => m.status === 'completed').length;

        const goalTasks = tasks.filter((t) => t.goal_id === goal.id);
        const pendingTasks = goalTasks.filter((t) => t.status !== 'completed').length;

        let daysLeft = 999;
        if (goal.target_date) {
          const target = new Date(goal.target_date);
          target.setHours(0, 0, 0, 0);
          daysLeft = Math.floor((target.getTime() - now.getTime()) / 86_400_000);
        }

        const msRatio = totalMs > 0 ? completedMs / totalMs : 1;

        let health: GoalHealthStatus;
        let risk: number;

        if (daysLeft <= 0) {
          health = 'CRITICAL';
          risk = 100;
        } else if (daysLeft <= 3) {
          health = 'CRITICAL';
          risk = 90;
        } else if (daysLeft <= 7 && msRatio < 0.5) {
          health = 'CRITICAL';
          risk = 80;
        } else if (daysLeft <= 14 && msRatio < 0.5) {
          health = 'AT_RISK';
          risk = 65;
        } else if (daysLeft <= 30 && msRatio < 0.4 && pendingTasks > 5) {
          health = 'AT_RISK';
          risk = 50;
        } else if (msRatio < 0.3 && daysLeft < 60) {
          health = 'AT_RISK';
          risk = 40;
        } else {
          health = 'ON_TRACK';
          risk = 20;
        }

        return {
          goal_id: goal.id,
          goal_title: goal.title,
          health,
          risk_score: risk,
          days_remaining: Math.max(0, daysLeft),
          milestones_completed: completedMs,
          milestones_total: totalMs,
        };
      });
  }
}

export const goalHealthService = new GoalHealthService();
