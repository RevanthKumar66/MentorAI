import { recoveryPlannerRepository } from '../repositories/RecoveryPlannerRepository';
import { RecoveryPlan, RecoveryTask } from '../types/risk';

export class RecoveryPlanningService {
  /** Loads the recovery plan and tasks generated for a goal. */
  async getPlanForGoal(goalId: string): Promise<RecoveryPlan | null> {
    return recoveryPlannerRepository.getRecoveryPlanForGoal(goalId);
  }

  /** Gets all recovery tasks for the current user across all active plans. */
  async getRecoveryTasks(): Promise<RecoveryTask[]> {
    return recoveryPlannerRepository.getRecoveryTasksForUser();
  }

  /** Toggles recovery task completed/pending status. */
  async toggleTaskStatus(taskId: string, currentStatus: 'pending' | 'completed'): Promise<void> {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    return recoveryPlannerRepository.updateRecoveryTaskStatus(taskId, nextStatus);
  }
}

export const recoveryPlanningService = new RecoveryPlanningService();
