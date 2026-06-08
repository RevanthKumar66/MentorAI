import React, { useState } from 'react';
import { useChat } from '../hooks/use-chat';
import { ChatWindow } from './chat-window';
import { ChatInput } from './chat-input';

export const ChatLayout: React.FC = () => {
  const [inputDraft, setInputDraft] = useState('');
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    isStreaming,
    streamError,
    streamingContent,
    loadingSessions,
    loadingMessages,
    sendMessage,
    createSession,
    deleteSession,
    retry,
    updateSessionMeta,
  } = useChat();

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeTitle = activeSession ? activeSession.title : 'No Conversation Selected';
  const activeModel = activeSession ? activeSession.model_name : 'gemini-2.5-flash';

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteSession(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50">
      <ChatWindow
        sessionTitle={activeTitle}
        modelName={activeModel}
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        streamError={streamError}
        loading={loadingMessages && sessions.length > 0}
        onSendMessage={sendMessage}
        onRetry={retry}
        onPrefillInput={setInputDraft}
        activeSessionId={activeSessionId || undefined}
      />
      
      {activeSessionId && (
        <ChatInput
          onSendMessage={sendMessage}
          disabled={isStreaming}
          modelName={activeModel}
          activeSessionId={activeSessionId}
          currentRole={activeSession?.role || 'general'}
          onUpdateRole={(role) => updateSessionMeta(activeSessionId, { role })}
          onUpdateModel={(model) => updateSessionMeta(activeSessionId, { model_name: model })}
          inputDraft={inputDraft}
          onClearDraft={() => setInputDraft('')}
        />
      )}
    </div>
  );
};
