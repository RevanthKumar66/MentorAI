import { supabase } from '@/lib/supabase';
import { schedulingRepository } from '../repositories/SchedulingRepository';
import { goalService } from './GoalService';
import { taskService } from './TaskService';
import { riskPredictionService } from './RiskPredictionService';
import { SchedulingAnalysisResponse } from '../types/scheduling';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export class AvailabilityEngineService {
  private async getHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async runScheduleAnalysis(): Promise<SchedulingAnalysisResponse> {
    const headers = await this.getHeaders();
    
    // 1. Load active context data
    const goals = await goalService.getGoals();
    const tasks = await taskService.getTasks();
    
    // Load milestones from DB
    const activeGoalIds = goals.filter(g => g.status === 'active').map(g => g.id);
    let milestones: any[] = [];
    if (activeGoalIds.length > 0) {
      const { data: msData } = await supabase
        .from('lifesaver_milestones')
        .select('*')
        .in('goal_id', activeGoalIds);
      milestones = msData || [];
    }
    
    // Load risks
    const risksMap = await riskPredictionService.loadGoalRisks();
    const goalRisks = Object.values(risksMap);

    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    // 2. Call backend analyze
    const res = await fetch(`${API_BASE_URL}/lifesaver/scheduling/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_name: userName,
        goals: goals.map(g => ({
          id: g.id,
          title: g.title,
          status: g.status,
          target_date: g.target_date,
          category: g.category
        })),
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          due_date: t.due_date,
          goal_id: t.goal_id
        })),
        milestones: milestones.map(m => ({
          id: m.id,
          goal_id: m.goal_id,
          week_number: m.week_number,
          title: m.title,
          description: m.description,
          status: m.status
        })),
        goal_risks: goalRisks.map(r => ({
          goal_id: r.goal_id,
          risk_score: r.risk_score,
          risk_level: r.risk_level,
          completion_probability: r.completion_probability
        }))
      })
    });

    if (!res.ok) throw new Error('Failed to run schedule analysis');
    const body = await res.json();
    const analysis: SchedulingAnalysisResponse = body.data;

    // 3. Save AI recommendations & recovery plans to database for persistence
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      await schedulingRepository.saveSuggestions(
        analysis.suggestions.map(s => ({
          goal_id: s.goal_id,
          task_id: s.task_id,
          suggested_start: s.suggested_start,
          suggested_end: s.suggested_end,
          reason: s.reason,
          confidence_score: s.confidence_score
        }))
      );
    }

    if (analysis.recoveryPlan) {
      await schedulingRepository.saveRecoverySchedule({
        goal_id: analysis.recoveryPlan.goal_id,
        current_probability: analysis.recoveryPlan.current_probability,
        predicted_probability: analysis.recoveryPlan.predicted_probability,
        generated_plan: analysis.recoveryPlan.generated_plan
      });
    }

    return analysis;
  }

  async acceptSuggestion(id: string, taskId: string, startTime: string): Promise<void> {
    // 1. Update suggestion status to accepted
    await schedulingRepository.updateSuggestionStatus(id, 'accepted');
    
    // 2. Update task due date to match the suggested start time
    await taskService.updateTask(taskId, {
      due_date: startTime,
    });
  }

  async rejectSuggestion(id: string): Promise<void> {
    await schedulingRepository.updateSuggestionStatus(id, 'rejected');
  }

  async triggerVoiceCommand(prompt: string): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/scheduling/voice`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error('Voice command processing failed');
    const body = await res.json();
    const result = body.data;

    // Execute the database creations on success
    if (result.goal) {
      const createdGoal = await goalService.createGoal({
        title: result.goal.title,
        description: 'Goal created autonomously via Voice Scheduling Assistant.',
        category: result.goal.category,
        target_date: result.goal.target_date,
        hours_per_day: result.goal.hours_per_day,
        experience_level: result.goal.experience_level,
        status: 'active'
      });

      // Create weekly milestones
      if (result.milestones && result.milestones.length > 0) {
        for (const ms of result.milestones) {
          await supabase.from('lifesaver_milestones').insert({
            goal_id: createdGoal.id,
            week_number: ms.week_number,
            title: ms.title,
            description: ms.description,
            status: 'not_started'
          });
        }
      }

      // Create tasks
      if (result.tasks && result.tasks.length > 0) {
        for (const t of result.tasks) {
          const due = new Date();
          due.setDate(due.getDate() + (t.days_offset || 1));
          await taskService.createTask({
            title: t.title,
            description: t.description,
            priority: t.priority,
            goal_id: createdGoal.id,
            due_date: due.toISOString(),
            status: 'pending'
          });
        }
      }

      // Create calendar events
      if (result.events && result.events.length > 0) {
        for (const ev of result.events) {
          const start = new Date();
          start.setHours(start.getHours() + (ev.hours_offset || 0));
          const end = new Date(start.getTime() + (ev.duration_hours || 1) * 60 * 60 * 1000);
          await schedulingRepository.createEvent({
            provider: 'google',
            external_event_id: `voice_ev_${Date.now()}_${Math.random()}`,
            title: ev.title,
            description: ev.description,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            status: 'confirmed',
            last_synced_at: new Date().toISOString()
          });
        }
      }
    }

    return result;
  }
}

export const availabilityEngineService = new AvailabilityEngineService();
