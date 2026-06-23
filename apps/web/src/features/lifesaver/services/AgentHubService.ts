import { supabase } from '@/lib/supabase';
import {
  AgentOverview,
  AgentSignal,
  AgentNotification,
  MentorMessage,
  DailyBriefing,
  WeeklyReview,
  AgentActivityLog,
  KnowledgeSource
} from '../types/agent';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export class AgentHubService {
  private async getHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getOverview(): Promise<AgentOverview> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/overview`, { headers });
    if (!res.ok) throw new Error('Failed to fetch overview');
    const json = await res.json();
    return json.data;
  }

  async getSignals(): Promise<AgentSignal[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/signals`, { headers });
    if (!res.ok) throw new Error('Failed to fetch signals');
    const json = await res.json();
    return json.data;
  }

  async triggerEvaluation(): Promise<unknown> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/signals/evaluate`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to trigger evaluation');
    const json = await res.json();
    return json.data;
  }

  async getNotifications(): Promise<AgentNotification[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/notifications`, { headers });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const json = await res.json();
    return json.data;
  }

  async markNotificationsRead(): Promise<void> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/notifications/mark-read`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to mark notifications read');
  }

  async getMentorMessages(): Promise<MentorMessage[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/mentor/messages`, { headers });
    if (!res.ok) throw new Error('Failed to fetch mentor messages');
    const json = await res.json();
    return json.data;
  }

  async triggerMentorCoaching(): Promise<MentorMessage> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/mentor/coaching`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to generate mentor coaching');
    const json = await res.json();
    return json.data;
  }

  async getDailyBriefing(type: 'morning' | 'evening'): Promise<DailyBriefing> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/briefing?briefing_type=${type}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch briefing');
    const json = await res.json();
    return json.data;
  }

  async regenerateDailyBriefing(type: 'morning' | 'evening'): Promise<DailyBriefing> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/briefing/generate?briefing_type=${type}`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to regenerate briefing');
    const json = await res.json();
    return json.data;
  }

  async getWeeklyReviews(): Promise<WeeklyReview[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/reviews`, { headers });
    if (!res.ok) throw new Error('Failed to fetch reviews');
    const json = await res.json();
    return json.data;
  }

  async regenerateWeeklyReview(): Promise<WeeklyReview> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/reviews/generate`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to regenerate weekly review');
    const json = await res.json();
    return json.data;
  }

  async getActivityFeed(): Promise<AgentActivityLog[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/activity`, { headers });
    if (!res.ok) throw new Error('Failed to fetch activity logs');
    const json = await res.json();
    return json.data;
  }

  async getKnowledgeSources(): Promise<KnowledgeSource[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/knowledge`, { headers });
    if (!res.ok) throw new Error('Failed to fetch knowledge sources');
    const json = await res.json();
    return json.data;
  }

  async uploadKnowledge(file: File, sourceType: string): Promise<unknown> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);

    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/knowledge/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload knowledge');
    const json = await res.json();
    return json.data;
  }

  async queryKnowledge(query: string): Promise<{ answer: string; chunks: Array<{ file_name: string; content: string; score: number }> }> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/knowledge/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Failed to query knowledge');
    const json = await res.json();
    return json.data;
  }

  async sendDeadlineReminders(): Promise<{ message: string; reminders_sent: number }> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/agent/deadline-reminders`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      // Try to surface the actual backend error message
      let detail = 'Failed to send deadline reminders';
      try {
        const errJson = await res.json();
        detail = errJson?.error?.message || errJson?.message || errJson?.detail || detail;
      } catch { /* ignore parse errors */ }
      throw new Error(detail);
    }
    const json = await res.json();
    return json.data;
  }
}

export const agentHubService = new AgentHubService();
