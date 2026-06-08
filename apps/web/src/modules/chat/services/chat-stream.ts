import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onTitle?: (title: string) => void;
  onError?: (error: string) => void;
  onCitations?: (citations: any[]) => void;
}

export async function streamChatResponse(
  sessionId: string,
  content: string,
  callbacks: StreamCallbacks,
  isRetry?: boolean
): Promise<void> {
  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;

  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content, is_retry: isRetry }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to initialize chat stream';
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.detail || errorJson.message || errorMsg;
    } catch {
      // Ignore fallback to default
    }
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported on response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

      for (const line of lines) {
        const cleanedLine = line.trim();
        if (!cleanedLine) continue;
        
        if (cleanedLine.startsWith('data: ')) {
          const dataStr = cleanedLine.substring(6).trim();
          if (dataStr === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              callbacks.onError?.(parsed.error);
            } else if (parsed.chunk !== undefined) {
              callbacks.onChunk(parsed.chunk);
            } else if (parsed.title !== undefined) {
              callbacks.onTitle?.(parsed.title);
            } else if (parsed.citations !== undefined) {
              callbacks.onCitations?.(parsed.citations);
            }
          } catch (e) {
            console.error('Error parsing SSE line:', cleanedLine, e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

