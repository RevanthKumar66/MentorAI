import { supabase } from '@/lib/supabase';

import { getApiBaseUrl } from '@/lib/api-config';

const API_BASE_URL = getApiBaseUrl();

async function getHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  document_count?: number;
  created_at: string;
  updated_at: string;
}


export interface Note {
  id: string;
  collection_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSettings {
  user_id: string;
  default_collection?: string | null;
  auto_rag_enabled: boolean;
  citation_enabled: boolean;
  workspace_memory_enabled: boolean;
}

export interface WorkspaceInsights {
  summary: string;
  topics: string[];
  keywords: string[];
  concepts: string[];
  document_count: number;
}

export const collectionApi = {
  async listCollections(): Promise<Collection[]> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to list collections');
    const body = await res.json();
    return body.data || [];
  },

  async getCollection(id: string): Promise<Collection & { documents: any[]; chats: any[] }> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to fetch collection details');
    const body = await res.json();
    return body.data;
  },

  async createCollection(payload: { name: string; description?: string; color?: string; icon?: string }): Promise<Collection> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create collection');
    const body = await res.json();
    return body.data;
  },

  async updateCollection(id: string, payload: { name?: string; description?: string; color?: string; icon?: string }): Promise<Collection> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update collection');
    const body = await res.json();
    return body.data;
  },

  async deleteCollection(id: string): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete collection');
  },

  async attachDocument(collectionId: string, documentIds: string[]): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/documents`, {
      method: 'POST',
      headers,
      body: JSON.stringify(documentIds),
    });
    if (!res.ok) throw new Error('Failed to attach documents');
  },

  async detachDocument(collectionId: string, documentId: string): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/documents/${documentId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to detach document');
  },

  async attachChat(collectionId: string, chatSessionId: string): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/chats`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ chat_session_id: chatSessionId }),
    });
    if (!res.ok) throw new Error('Failed to link chat session');
  },

  async detachChat(collectionId: string, chatSessionId: string): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/chats/${chatSessionId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to unlink chat session');
  },

  async listNotes(collectionId: string): Promise<Note[]> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/notes`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to list notes');
    const body = await res.json();
    return body.data || [];
  },

  async createNote(collectionId: string, payload: { title: string; content?: string }): Promise<Note> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create note');
    const body = await res.json();
    return body.data;
  },

  async updateNote(noteId: string, payload: { title?: string; content?: string }): Promise<Note> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update note');
    const body = await res.json();
    return body.data;
  },

  async deleteNote(noteId: string): Promise<void> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to delete note');
  },

  async getInsights(collectionId: string): Promise<WorkspaceInsights> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/insights`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to retrieve workspace insights');
    const body = await res.json();
    return body.data;
  },

  async getWorkspaceSettings(): Promise<WorkspaceSettings> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/settings/workspace`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Failed to retrieve workspace settings');
    const body = await res.json();
    return body.data;
  },

  async updateWorkspaceSettings(payload: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/settings/workspace`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update workspace settings');
    const body = await res.json();
    return body.data;
  }
};
