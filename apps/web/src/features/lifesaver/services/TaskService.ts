import { taskRepository } from '../repositories/TaskRepository';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

export class TaskService {
  async getTasks(goalId?: string): Promise<Task[]> {
    return taskRepository.listTasks(goalId);
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    if (!input.title || !input.title.trim()) {
      throw new Error('Task title is required');
    }
    return taskRepository.createTask(input);
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    return taskRepository.updateTask(id, input);
  }

  async deleteTask(id: string): Promise<void> {
    return taskRepository.deleteTask(id);
  }
}
export const taskService = new TaskService();
