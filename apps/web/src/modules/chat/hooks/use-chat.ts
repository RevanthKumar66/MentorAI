import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatStore, ChatMessage } from '../store/chat-store';
import { chatApi } from '../services/chat-api';
import { streamChatResponse } from '../services/chat-stream';

export function useChat() {
  const queryClient = useQueryClient();
  const { 
    activeSessionId, 
    setActiveSessionId, 
    sessions, 
    setSessions, 
    addSession, 
    removeSession, 
    updateSession 
  } = useChatStore();

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');

  // 1. Fetch sessions
  const { data: remoteSessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatApi.listSessions(),
  });

  // Keep Zustand sessions synced with React Query cache
  useEffect(() => {
    if (remoteSessions) {
      setSessions(remoteSessions);
      // Auto-select first session if none active and sessions exist
      if (!activeSessionId && remoteSessions.length > 0) {
        setActiveSessionId(remoteSessions[0].id);
      }
    }
  }, [remoteSessions, setSessions, activeSessionId, setActiveSessionId]);

  // 2. Fetch active session messages
  const { data: sessionDetails, isLoading: loadingMessages } = useQuery({
    queryKey: ['chat-session-details', activeSessionId],
    queryFn: () => chatApi.getSessionDetails(activeSessionId!),
    enabled: !!activeSessionId,
  });

  // Keep local messages synced with fetched messages
  useEffect(() => {
    if (sessionDetails) {
      setLocalMessages(sessionDetails.messages);
    } else {
      setLocalMessages([]);
    }
  }, [sessionDetails]);

  // 3. Create Session Mutation
  const createSessionMutation = useMutation({
    mutationFn: (payload?: { model_name?: string }) => chatApi.createSession(payload),
    onSuccess: (newSession) => {
      addSession(newSession);
      setActiveSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  // 4. Delete Session Mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteSession(id),
    onSuccess: (_, deletedId) => {
      removeSession(deletedId);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  // 5. Send Message (Streams content using SSE)
  const sendMessage = async (content: string) => {
    if (!activeSessionId || !content.trim() || isStreaming) return;

    setStreamError(null);
    setIsStreaming(true);
    setStreamingContent('');

    const userMessageTemp: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      session_id: activeSessionId,
      role: 'user',
      content,
      model_name: null,
      input_tokens: 0,
      output_tokens: 0,
      latency_ms: 0,
      created_at: new Date().toISOString(),
    };

    // Optimistically add user message
    setLocalMessages((prev) => [...prev, userMessageTemp]);

    // Update last message timestamp in session
    updateSession(activeSessionId, { last_message_at: new Date().toISOString() });

    let finalAssistantText = '';

    try {
      await streamChatResponse(activeSessionId, content, {
        onChunk: (chunkText) => {
          finalAssistantText += chunkText;
          setStreamingContent(finalAssistantText);
        },
        onTitle: (generatedTitle) => {
          updateSession(activeSessionId, { title: generatedTitle });
        },
        onError: (err) => {
          setStreamError(err);
        },
      });

      // Stream successfully completed, sync database state
      queryClient.invalidateQueries({ queryKey: ['chat-session-details', activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });

    } catch (error: any) {
      console.error('Error during streaming:', error);
      setStreamError(error.message || 'Failed to stream response');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const retry = async () => {
    if (isStreaming) return;

    // Find the last user message
    const userMessages = localMessages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) return;

    const lastUserMessage = userMessages[userMessages.length - 1];

    // Remove the last message from localMessages if it's a temporary user message
    setLocalMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.id.startsWith('temp-user-')) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    await sendMessage(lastUserMessage.content);
  };

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages: localMessages,
    isStreaming,
    streamError,
    streamingContent,
    loadingSessions,
    loadingMessages,
    sendMessage,
    retry,
    createSession: (model_name?: string) => createSessionMutation.mutate({ model_name }),
    deleteSession: (id: string) => deleteSessionMutation.mutate(id),
  };
}
