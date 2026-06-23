import { goalRepository } from '../repositories/GoalRepository';
import { Goal, CreateGoalInput, UpdateGoalInput } from '../types/goal';

export class GoalService {
  async getGoals(): Promise<Goal[]> {
    return goalRepository.listGoals();
  }

  async createGoal(input: CreateGoalInput): Promise<Goal> {
    if (!input.title || !input.title.trim()) {
      throw new Error('Goal title is required');
    }
    return goalRepository.createGoal(input);
  }

  async updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
    return goalRepository.updateGoal(id, input);
  }

  async deleteGoal(id: string): Promise<void> {
    return goalRepository.deleteGoal(id);
  }
}
export const goalService = new GoalService();
