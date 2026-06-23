import { SchedulingAnalysisResponse } from '../types/scheduling';

export class ContextReminderService {
  generateReminders(analysis: SchedulingAnalysisResponse): string[] {
    // Falls back to some defaults if analysis fails or is empty
    if (!analysis.reminders || analysis.reminders.length === 0) {
      return [
        "Welcome to Momentum AI Scheduling. Connect your calendar to scan for conflicts and sync deadlines.",
        "Maintain focus by targeting high-priority milestones early in the day."
      ];
    }
    return analysis.reminders;
  }
}

export const contextReminderService = new ContextReminderService();
