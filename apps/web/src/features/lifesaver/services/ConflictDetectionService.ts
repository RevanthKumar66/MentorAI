import { schedulingRepository } from '../repositories/SchedulingRepository';
import { taskService } from './TaskService';
import { CalendarConflict } from '../types/scheduling';

export class ConflictDetectionService {
  async resolveConflict(conflict: CalendarConflict, action: 'reschedule' | 'keep'): Promise<void> {
    if (action === 'reschedule') {
      // Shift task due date to suggested alternative start time
      await taskService.updateTask(conflict.task_id, {
        due_date: conflict.suggested_alternative_start,
      });
    }
  }
}

export const conflictDetectionService = new ConflictDetectionService();
