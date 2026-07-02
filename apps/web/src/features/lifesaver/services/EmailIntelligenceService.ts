import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export interface EmailThread {
  id: string;
  thread_id: string;
  subject: string;
  sender: string;
  snippet: string;
  body: string;
  category: string;
  priority_score: number;
  urgency_reason: string;
  is_read: boolean;
  last_message_date: string;
}

export interface ActionQueueItem {
  id: string;
  thread_id: string;
  subject: string;
  sender: string;
  snippet: string;
  body: string;
  category: string;
  priority_score: number;
  urgency_reason: string;
  last_message_date: string;
  opportunity?: {
    id: string;
    opportunity_type: string;
    suggested_action: string;
    goal_id: string | null;
  } | null;
  deadline?: {
    id: string;
    title: string;
    deadline_date: string;
    task_id: string | null;
  } | null;
}

export interface EmailDraft {
  id: string;
  email_thread_id: string;
  subject: string;
  recipient: string;
  draft_body: string;
  status: 'pending' | 'sent' | 'saved' | 'rejected';
  created_at: string;
}

export interface TriageRule {
  id: string;
  rule_name: string;
  category_filter: string;
  action: 'auto_archive' | 'auto_delete' | 'auto_label' | 'auto_star' | 'mark_read';
  is_active: boolean;
}

export interface EmailOverview {
  health_score: number;
  unread_important: number;
  pending_opportunities: number;
  pending_drafts: number;
  missed_deadlines: number;
  action_queue_count: number;
  cleansed_count: number;
  category_distribution: Record<string, number>;
  activities: Array<{
    id: string;
    action_type: string;
    description: string;
    created_at: string;
  }>;
}

export class EmailIntelligenceService {
  private async getHeaders() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  async syncEmails(): Promise<{ success: boolean; synced: boolean; actions: any[] }> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/sync`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to sync emails');
    const body = await res.json();
    return body.data;
  }

  async fetchOverview(): Promise<EmailOverview> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/overview`, {
      method: 'GET',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch overview metrics');
    const body = await res.json();
    return body.data;
  }

  async fetchThreads(category?: string): Promise<EmailThread[]> {
    const headers = await this.getHeaders();
    const url = category 
      ? `${API_BASE_URL}/lifesaver/email/threads?category=${encodeURIComponent(category)}`
      : `${API_BASE_URL}/lifesaver/email/threads`;
    const res = await fetch(url, {
      method: 'GET',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch threads');
    const body = await res.json();
    return body.data || [];
  }

  async fetchActionQueue(): Promise<ActionQueueItem[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/action-queue`, {
      method: 'GET',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch action queue');
    const body = await res.json();
    return body.data || [];
  }

  async fetchDrafts(): Promise<EmailDraft[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/drafts`, {
      method: 'GET',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch drafts');
    const body = await res.json();
    return body.data || [];
  }

  async manualCreateDraft(threadUuid: string): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/drafts/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ thread_uuid: threadUuid })
    });
    if (!res.ok) throw new Error('Failed to generate draft');
    const body = await res.json();
    return body.data;
  }

  async executeDraftAction(
    draftId: string,
    action: 'approve_send' | 'save' | 'reject',
    editedBody?: string
  ): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/drafts/action`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        draft_id: draftId,
        action,
        ...(editedBody ? { edited_body: editedBody } : {})
      })
    });
    if (!res.ok) throw new Error('Failed to execute draft action');
    const body = await res.json();
    return body.data;
  }

  async fetchTriageRules(): Promise<TriageRule[]> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/rules`, {
      method: 'GET',
      headers
    });
    if (!res.ok) throw new Error('Failed to fetch triage rules');
    const body = await res.json();
    return body.data || [];
  }

  async createTriageRule(
    ruleName: string,
    categoryFilter: string,
    action: string,
    isActive: boolean = true
  ): Promise<TriageRule> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/rules`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        rule_name: ruleName,
        category_filter: categoryFilter,
        action,
        is_active: isActive
      })
    });
    if (!res.ok) throw new Error('Failed to create triage rule');
    const body = await res.json();
    return body.data;
  }

  async toggleTriageRule(ruleId: string): Promise<any> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/rules/${ruleId}/toggle`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to toggle triage rule');
    const body = await res.json();
    return body.data;
  }

  async deleteTriageRule(ruleId: string): Promise<boolean> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE_URL}/lifesaver/email/rules/${ruleId}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete triage rule');
    const body = await res.json();
    return body.success;
  }
}

export const emailIntelligenceService = new EmailIntelligenceService();
