import React from 'react';
import { useChat } from '../hooks/use-chat';
import { ChatSidebar } from './chat-sidebar';
import { ChatWindow } from './chat-window';
import { ChatInput } from './chat-input';

export const ChatLayout: React.FC = () => {
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
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        loading={loadingSessions}
        onSelectSession={setActiveSessionId}
        onCreateSession={() => createSession()}
        onDeleteSession={handleDelete}
      />
      
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50/40">
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
        />
        
        {activeSessionId && (
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isStreaming}
            modelName={activeModel}
          />
        )}
      </div>
    </div>
  );
};
