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
};
