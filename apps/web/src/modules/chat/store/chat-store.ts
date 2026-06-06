import { create } from 'zustand';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  model_name: string;
  system_prompt: string | null;
  temperature: number;
  is_archived: boolean;
  last_message_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_name: string | null;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  created_at: string;
}

interface ChatState {
  sidebarOpen: boolean;
  activeSessionId: string | null;
  sessions: ChatSession[];
  
  setSidebarOpen: (open: boolean) => void;
  setActiveSessionId: (id: string | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sidebarOpen: true,
  activeSessionId: null,
  sessions: [],
  
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ 
    sessions: [session, ...state.sessions] 
  })),
  removeSession: (id) => set((state) => ({ 
    sessions: state.sessions.filter((s) => s.id !== id),
    activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
  })),
  updateSession: (id, updates) => set((state) => ({
    sessions: state.sessions.map((s) => 
      s.id === id ? { ...s, ...updates } : s
    ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
  })),
}));
