import { supabase } from '@/lib/supabase';
import { ChatSession, ChatMessage } from '../store/chat-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export interface UserPreferences {
  default_role: string;
  default_persona: string;
  experience_level: string;
  learning_style: string;
  career_goal: string;
  preferred_language: string;
}

export interface RoleAnalytics {
  role: string;
  messages_count: number;
  tokens_used: number;
  sessions_count: number;
  last_used_at: string | null;
}

export interface UserAnalytics {
  total_messages: number;
  total_tokens: number;
  total_documents: number;
  roles_breakdown: RoleAnalytics[];
  weekly_activity: { date: string; count: number }[];
}

export interface AIPromptItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
  avatar_emoji?: string;
}

export const chatApi = {
  async listSessions(): Promise<ChatSession[]> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      throw new Error('Failed to fetch chat sessions');
    }
    const body = await res.json();
    return body.data || [];
  },

  async getSessionDetails(sessionId: string): Promise<ChatSession & { messages: ChatMessage[] }> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      throw new Error('Failed to fetch chat session details');
    }
    const body = await res.json();
    return body.data;
  },

  async createSession(payload?: {
    title?: string;
    model_name?: string;
    system_prompt?: string | null;
    temperature?: number;
    role?: string;
    role_type?: string;
    persona_type?: string;
    workspace_id?: string | null;
  }): Promise<ChatSession> {

    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      throw new Error('Failed to create chat session');
    }
    const body = await res.json();
    return body.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      throw new Error('Failed to delete chat session');
    }
  },

  async updateSession(sessionId: string, payload: {
    title?: string;
    role?: string;
    role_type?: string;
    persona_type?: string;
    temperature?: number;
    is_archived?: boolean;
    model_name?: string;
  }): Promise<ChatSession> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error('Failed to update chat session');
    }
    const body = await res.json();
    return body.data;
  },

  async getRoles(): Promise<AIPromptItem[]> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/roles`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch roles');
    const body = await res.json();
    return body.data || [];
  },

  async getPersonas(): Promise<AIPromptItem[]> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/personas`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch personas');
    const body = await res.json();
    return body.data || [];
  },

  async getPreferences(): Promise<UserPreferences> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/preferences`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch preferences');
    const body = await res.json();
    return body.data;
  },

  async updatePreferences(payload: Partial<UserPreferences>): Promise<UserPreferences> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    const body = await res.json();
    return body.data;
  },

  async getAnalytics(): Promise<UserAnalytics> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/analytics`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const body = await res.json();
    return body.data;
  },

  async moveSession(sessionId: string, workspaceId: string | null): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/workspace`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ workspace_id: workspaceId }),
    });
    if (!res.ok) {
      throw new Error('Failed to move chat session');
    }
  },
};
