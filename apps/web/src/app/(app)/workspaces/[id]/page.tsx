'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionApi, Collection, Note, WorkspaceInsights, WorkspaceSettings } from '@/modules/documents/services/collection-api';
import { chatApi } from '@/modules/chat/services/chat-api';
import { documentApi } from '@/modules/documents/services/document-api';
import { useWorkspaceStore } from '@/modules/documents/store/workspace-store';
import { useChatStore } from '@/modules/chat/store/chat-store';
import { MermaidRenderer } from '@/modules/chat/components/mermaid-renderer';
import { 
  Folder, FileText, FileUp, Settings, BarChart2, MessageSquare, 
  Trash2, Plus, Edit2, Play, Check, AlertCircle, RefreshCw, Eye,
  LayoutDashboard, BookOpen, Trash, CheckSquare, Workflow
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type TabType = 'overview' | 'documents' | 'notes' | 'diagrams' | 'chats' | 'insights' | 'settings';

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { setActiveWorkspaceId } = useWorkspaceStore();
  const { setActiveSessionId } = useChatStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);

  // Set as active workspace globally
  useEffect(() => {
    if (id) {
      setActiveWorkspaceId(id);
    }
  }, [id, setActiveWorkspaceId]);

  // 1. Queries
  const { data: collection, isLoading: loadingCol } = useQuery({
    queryKey: ['workspace-details', id],
    queryFn: () => collectionApi.getCollection(id),
    enabled: !!id,
  });

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ['workspace-notes', id],
    queryFn: () => collectionApi.listNotes(id),
    enabled: !!id,
  });

  const { data: globalSessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatApi.listSessions(),
  });

  const { data: insights, refetch: refetchInsights, isFetching: loadingInsights } = useQuery({
    queryKey: ['workspace-insights', id],
    queryFn: () => collectionApi.getInsights(id),
    enabled: !!id,
  });

  const { data: settings } = useQuery({
    queryKey: ['workspace-settings'],
    queryFn: () => collectionApi.getWorkspaceSettings(),
  });

  // Filter chats belonging to this collection
  const linkedChats = collection?.chats || [];

  // Filter documents in collection
  const documents = collection?.documents || [];

  // Fetch and extract Mermaid diagrams from linked chats automatically
  useEffect(() => {
    let active = true;
    if (linkedChats.length > 0) {
      const fetchDiagrams = async () => {
        setLoadingDiagrams(true);
        try {
          const allDiagrams: any[] = [];
          
          // Fetch all linked chats' detail histories in parallel
          const sessionsDetails = await Promise.all(
            linkedChats.map(chat => chatApi.getSessionDetails(chat.id).catch(() => null))
          );

          if (!active) return;

          for (const session of sessionsDetails) {
            if (!session || !session.messages) continue;
            
            // Extract all assistant messages with Mermaid code blocks
            for (const msg of session.messages) {
              if (msg.role !== 'assistant') continue;
              
              const mermaidRegex = /```mermaid\s*([\s\S]*?)```/g;
              let match;
              while ((match = mermaidRegex.exec(msg.content)) !== null) {
                const code = match[1].trim();
                allDiagrams.push({
                  id: `${msg.id}-${allDiagrams.length}`,
                  code,
                  timestamp: msg.created_at,
                  chatTitle: session.title || 'Untitled Discussion',
                  chatId: session.id
                });
              }
            }
          }

          // Sort by timestamp newest first
          allDiagrams.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          if (active) {
            setDiagrams(allDiagrams);
          }
        } catch (err) {
          console.error("Failed to load diagrams:", err);
        } finally {
          if (active) {
            setLoadingDiagrams(false);
          }
        }
      };

      fetchDiagrams();
    } else {
      setDiagrams([]);
    }

    return () => {
      active = false;
    };
  }, [linkedChats]);

  const handleRefreshDiagrams = () => {
    queryClient.invalidateQueries({ queryKey: ['workspace-details', id] });
  };

  // 2. Mutations
  const updateCollectionMutation = useMutation({
    mutationFn: (payload: { name?: string; description?: string }) => collectionApi.updateCollection(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-details', id] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });

  const createNoteMutation = useMutation({
    mutationFn: (payload: { title: string; content?: string }) => collectionApi.createNote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-notes', id] });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => collectionApi.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-notes', id] });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<WorkspaceSettings>) => collectionApi.updateWorkspaceSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-settings'] });
    }
  });

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadProgress(0);
    setUploadError(null);

    try {
      // 1. Upload to storage
      const uploadedDoc = await documentApi.uploadFile(file, (p) => setUploadProgress(p));
      // 2. Attach to collection
      await collectionApi.attachDocument(id, [uploadedDoc.id]);
      
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ['workspace-details', id] });
      refetchInsights();
    } catch (err: any) {
      setUploadProgress(null);
      setUploadError(err.message || 'File upload failed');
    }
  };

  const handleDetachDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to detach this document from this workspace?')) return;
    try {
      await collectionApi.detachDocument(id, docId);
      queryClient.invalidateQueries({ queryKey: ['workspace-details', id] });
      refetchInsights();
    } catch (err) {
      alert('Failed to detach document');
    }
  };

  const handleCreateChat = async () => {
    try {
      // Create session
      const newSession = await chatApi.createSession({
        title: `Discussion - ${collection?.name || 'Workspace'}`
      });
      // Link chat to workspace
      await collectionApi.attachChat(id, newSession.id);
      
      setActiveSessionId(newSession.id);
      router.push('/chat');
    } catch (err) {
      alert('Failed to create workspace discussion');
    }
  };

  const handleSelectChat = (sessionId: string) => {
    setActiveSessionId(sessionId);
    router.push('/chat');
  };

  if (loadingCol) {
    return (
      <div className="flex h-screen w-full justify-center items-center bg-[#fcfbf9] text-slate-800">
        <div className="flex flex-col items-center gap-2">
          <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-slate-500 text-xs mt-2 font-medium">Loading workspace dashboard...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex h-screen w-full flex-col justify-center items-center bg-[#fcfbf9] text-slate-850 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mb-2" />
        <h2 className="text-sm font-bold text-slate-900">Workspace not found</h2>
        <p className="text-xs text-slate-600 mt-1">This workspace might have been deleted or you do not have permission to view it.</p>
        <button onClick={() => router.push('/chat')} className="mt-4 px-4 py-1.5 bg-slate-900 text-white rounded-[6px] text-xs font-semibold hover:bg-black transition-colors">
          Go Home
        </button>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Compute stats
  const totalDocSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);

  return (
    <div className="flex flex-col h-full bg-[#f9f9f8] text-[#111111]">
      {/* Header bar */}
      <header className="h-14 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] border border-slate-200 flex items-center justify-center shrink-0" style={{ backgroundColor: `${collection.color}15` }}>
            <Folder className="w-4 h-4" style={{ color: collection.color || '#64748B' }} />
          </div>
          <div>
            <h1 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              {collection.name}
            </h1>
            <p className="text-[10px] text-slate-700 truncate max-w-lg mt-0.5">
              {collection.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Discuss Workspace
          </button>
        </div>
      </header>

      {/* Tabs list */}
      <div className="px-6 bg-white border-b border-[#E5E7EB] flex gap-4 shrink-0">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'documents', label: 'Documents', icon: FileUp },
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'diagrams', label: 'Diagrams', icon: Workflow },
          { id: 'chats', label: 'Chats', icon: MessageSquare },
          { id: 'insights', label: 'Insights', icon: BarChart2 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 py-3.5 px-1 border-b-2 text-xs font-bold transition-all select-none cursor-pointer ${
                isActive 
                  ? 'border-slate-900 text-slate-900' 
                  : 'border-transparent text-slate-700 hover:text-slate-950'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Workspace Body Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-transparent">
        <div className="max-w-4xl mx-auto w-full h-full">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 shadow-sm">
                  <span className="text-xs font-semibold text-slate-900">Knowledge Files</span>
                  <div className="text-2xl font-extrabold mt-1.5">{documents.length}</div>
                  <p className="text-[10px] text-slate-700 mt-1 font-mono">{formatBytes(totalDocSize)} indexed</p>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 shadow-sm">
                  <span className="text-xs font-semibold text-slate-900">Scribbled Notes</span>
                  <div className="text-2xl font-extrabold mt-1.5">{notes?.length || 0}</div>
                  <p className="text-[10px] text-slate-700 mt-1 font-mono">Markdown notes</p>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 shadow-sm">
                  <span className="text-xs font-semibold text-slate-900">Workflow Diagrams</span>
                  <div className="text-2xl font-extrabold mt-1.5">{diagrams.length}</div>
                  <p className="text-[10px] text-slate-700 mt-1 font-mono">Auto-extracted flows</p>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-5 shadow-sm">
                  <span className="text-xs font-semibold text-slate-900">Discussions</span>
                  <div className="text-2xl font-extrabold mt-1.5">{linkedChats.length}</div>
                  <p className="text-[10px] text-slate-700 mt-1 font-mono">AI learning sessions</p>
                </div>
              </div>

              {/* Workspace details editing */}
              <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Workspace Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Workspace Name</label>
                    <input 
                      type="text" 
                      defaultValue={collection.name}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value.trim() !== collection.name) {
                          updateCollectionMutation.mutate({ name: e.target.value.trim() });
                        }
                      }}
                      className="w-full mt-1 px-3 py-1.5 bg-[#F7F7F7] border border-slate-300 rounded-[6px] text-xs font-medium focus:outline-none focus:border-slate-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700">Description / Study Goal</label>
                    <textarea 
                      defaultValue={collection.description || ''}
                      onBlur={(e) => {
                        if (e.target.value.trim() !== (collection.description || '')) {
                          updateCollectionMutation.mutate({ description: e.target.value.trim() });
                        }
                      }}
                      rows={3}
                      className="w-full mt-1 px-3 py-1.5 bg-[#F7F7F7] border border-slate-300 rounded-[6px] text-xs font-medium focus:outline-none focus:border-slate-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Knowledge Documents</h3>
                  <p className="text-[10px] text-slate-700 mt-0.5">Upload textbook PDFs, source code scripts, worksheets, and datasets.</p>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold transition-colors shadow-sm cursor-pointer select-none">
                  <FileUp className="w-3.5 h-3.5 text-slate-700" />
                  Upload Document
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Uploading progress status */}
              {uploadProgress !== null && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] text-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Uploading and Indexing File...</span>
                    <span className="font-mono text-slate-900 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-[6px] text-xs font-medium text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </div>
              )}

              {/* Document List */}
              {documents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-[6px]">
                  <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                  <p className="text-xs font-bold text-slate-900">No documents linked</p>
                  <p className="text-[10px] text-slate-700 mt-0.5">Attach documents to enable isolated RAG vector searches.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <div key={doc.id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-[4px] bg-[#f4f3f0] border border-slate-200 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-slate-800" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate max-w-md">{doc.original_file_name}</h4>
                          <div className="flex items-center gap-2 text-[9px] text-slate-700 font-mono mt-0.5">
                            <span>{formatBytes(doc.file_size)}</span>
                            <span>•</span>
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold ${
                              doc.is_processed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {doc.is_processed ? 'Ready' : 'Processing'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => router.push(`/documents/${doc.id}`)}
                          className="p-1.5 rounded-[6px] hover:bg-[#F7F7F7] text-slate-850 hover:text-slate-950 transition-colors"
                          title="Preview Chunks"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDetachDocument(doc.id)}
                          className="p-1.5 rounded-[6px] hover:bg-red-50 text-red-650 hover:text-red-700 transition-colors"
                          title="Remove from Workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <NotesSplitPanel 
              notes={notes || []} 
              onCreateNote={(title) => createNoteMutation.mutate({ title })}
              onDeleteNote={(noteId) => deleteNoteMutation.mutate(noteId)}
              workspaceId={id}
            />
          )}

          {/* DIAGRAMS TAB */}
          {activeTab === 'diagrams' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Workspace Diagrams</h3>
                    <p className="text-[10px] text-slate-700 mt-0.5">
                      Visual flowcharts, sequence diagrams, and block architecture automatically extracted from your workspace conversations.
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshDiagrams}
                    disabled={loadingDiagrams}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:border-slate-400 bg-white rounded-[6px] text-xs font-bold text-slate-800 transition-colors cursor-pointer select-none"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${loadingDiagrams ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {loadingDiagrams ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-700">
                    <span className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
                    <p className="text-[10px] font-semibold text-slate-800 mt-2.5">Extracting diagrams from chat history...</p>
                  </div>
                ) : diagrams.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-[6px]">
                    <Workflow className="w-9 h-9 text-slate-700 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-900">No diagrams found</p>
                    <p className="text-[10px] text-slate-700 mt-1 max-w-sm mx-auto leading-normal">
                      Diagrams generated by the AI assistant in any linked discussions will automatically show up here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {diagrams.map((diagram) => (
                      <div key={diagram.id} className="bg-slate-50/20 border border-slate-200 rounded-[12px] p-4 flex flex-col shadow-sm">
                        {/* Diagram Header / Context */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-semibold text-slate-800">Origin Chat</span>
                            <h4 className="text-[11.5px] font-extrabold text-slate-900 truncate">{diagram.chatTitle}</h4>
                          </div>
                          <button
                            onClick={() => handleSelectChat(diagram.chatId)}
                            className="ml-2 flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-[6px] text-[10px] font-bold text-slate-800 transition-colors shadow-sm cursor-pointer shrink-0"
                          >
                            Open Discussion
                          </button>
                        </div>

                        {/* Rendered Diagram */}
                        <div className="flex-grow bg-white rounded-[8px] border border-slate-200/60 overflow-hidden flex flex-col justify-center min-h-[160px] p-2">
                          <MermaidRenderer code={diagram.code} />
                        </div>

                        {/* Diagram Footer */}
                        <div className="mt-3 text-right">
                          <span className="text-[9px] font-mono text-slate-700">
                            {new Date(diagram.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHATS TAB */}
          {activeTab === 'chats' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Workspace Conversations</h3>
                  <p className="text-[10px] text-slate-700 mt-0.5">Chats and sessions restricted strictly to this workspace context.</p>
                </div>
                <button
                  onClick={handleCreateChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm shadow-slate-950/10 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Discussion
                </button>
              </div>

              {linkedChats.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-[6px]">
                  <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                  <p className="text-xs font-bold text-slate-900">No discussions started</p>
                  <p className="text-[10px] text-slate-700 mt-0.5">Launch a workspace-specific chat to converse with these files.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {linkedChats.map((chat) => (
                    <div key={chat.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-[6px] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <MessageSquare className="w-4 h-4 text-slate-700 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate max-w-md">{chat.title || 'Untitled Session'}</h4>
                          <span className="text-[9px] text-slate-700 font-mono mt-0.5 block">
                            Last message: {new Date(chat.last_message_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectChat(chat.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-[#f4f3f0] hover:bg-[#ecebea] border border-slate-300 rounded-[6px] text-[10px] font-bold text-slate-800 transition-colors shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-slate-800" />
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">AI Workspace Insights</h3>
                  <p className="text-[10px] text-slate-700 mt-0.5">Semantic topics, terms, and summaries parsed by Gemini.</p>
                </div>
                <button
                  onClick={() => refetchInsights()}
                  disabled={loadingInsights}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-[6px] text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${loadingInsights ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-700">
                  <span className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
                  <p className="text-[10px] font-semibold text-slate-800 mt-2">Analyzing files and note corpus...</p>
                </div>
              ) : !insights || insights.document_count === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-[6px]">
                  <BarChart2 className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                  <p className="text-xs font-bold text-slate-900">Insights unavailable</p>
                  <p className="text-[10px] text-slate-700 mt-0.5">Please upload processing documents to analyze topics.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="p-4 bg-[#F7F7F7] border border-slate-200 rounded-[8px]">
                    <span className="text-xs font-semibold text-slate-800">Knowledge Base Summary</span>
                    <p className="text-xs text-slate-850 mt-1 leading-relaxed">{insights.summary}</p>
                  </div>

                  {/* Topics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-slate-800 block">Primary Subject Topics</span>
                      <div className="flex flex-wrap gap-2">
                        {insights.topics.map((t, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-slate-100 border border-slate-250 text-xs font-bold text-slate-900 rounded-[6px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-slate-800 block">Mentioned Concepts</span>
                      <div className="flex flex-wrap gap-2">
                        {insights.concepts.map((c, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-blue-50/50 border border-blue-200 text-xs font-bold text-blue-900 rounded-[6px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Keywords Tag list */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-800 block">Frequently Mentioned Terms</span>
                    <div className="flex flex-wrap gap-1.5">
                      {insights.keywords.map((kw, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-[#F7F7F7] text-[10px] font-bold text-slate-800 rounded-full border border-slate-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && settings && (
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-semibold text-slate-900 pb-4 border-b border-slate-100">
                Workspace Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Auto RAG Retrieval</h4>
                    <p className="text-[10px] text-slate-700">Retrieve relevant chunks automatically for every chat query.</p>
                  </div>
                  <button 
                    onClick={() => updateSettingsMutation.mutate({ auto_rag_enabled: !settings.auto_rag_enabled })}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      settings.auto_rag_enabled ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${
                      settings.auto_rag_enabled ? 'right-[3px]' : 'left-[3px]'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Sources Citations</h4>
                    <p className="text-[10px] text-slate-700">Display cited PDF/Text sources at the end of AI responses.</p>
                  </div>
                  <button 
                    onClick={() => updateSettingsMutation.mutate({ citation_enabled: !settings.citation_enabled })}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      settings.citation_enabled ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${
                      settings.citation_enabled ? 'right-[3px]' : 'left-[3px]'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Workspace Memory</h4>
                    <p className="text-[10px] text-slate-700">Let the assistant memorize workflow and concepts inside this collection.</p>
                  </div>
                  <button 
                    onClick={() => updateSettingsMutation.mutate({ workspace_memory_enabled: !settings.workspace_memory_enabled })}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      settings.workspace_memory_enabled ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${
                      settings.workspace_memory_enabled ? 'right-[3px]' : 'left-[3px]'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// NOTES SPLIT PANEL EDITOR
// ─────────────────────────────────────────────────────────────────────
interface NotesSplitPanelProps {
  notes: Note[];
  onCreateNote: (title: string) => void;
  onDeleteNote: (noteId: string) => void;
  workspaceId: string;
}

function NotesSplitPanel({ notes, onCreateNote, onDeleteNote, workspaceId }: NotesSplitPanelProps) {
  const queryClient = useQueryClient();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');

  const activeNote = notes.find(n => n.id === selectedNoteId);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [activeNote]);

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedNoteId) return;
    setSaving(true);
    setSaved(false);
    try {
      await collectionApi.updateNote(selectedNoteId, { title, content });
      queryClient.invalidateQueries({ queryKey: ['workspace-notes', workspaceId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    const titleVal = prompt('Enter note title:', 'Untitled Note');
    if (titleVal === null) return;
    onCreateNote(titleVal.trim() || 'Untitled Note');
  };

  const handleDelete = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this note?')) return;
    onDeleteNote(noteId);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[8px] shadow-sm flex h-[600px] overflow-hidden min-h-0">
      
      {/* Left List Pane */}
      <div className="w-64 border-r border-[#E5E7EB] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-slate-900">Notes ({notes.length})</span>
          <button 
            onClick={handleCreate}
            className="p-1 rounded-[4px] border border-slate-300 hover:bg-[#ecebea]/50 cursor-pointer"
            title="Create Note"
          >
            <Plus className="w-3.5 h-3.5 text-slate-700" />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-2 border-b border-slate-100 shrink-0">
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 bg-[#F7F7F7] border border-slate-300 rounded-[6px] text-xs font-semibold focus:outline-none focus:border-slate-500 transition-colors"
          />
        </div>

        {/* Note list items */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-slate-800">
              No notes found.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = note.id === selectedNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-[6px] cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-slate-900 text-white font-bold' 
                      : 'text-slate-800 hover:bg-[#ecebea]/40'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <h4 className="text-[11.5px] truncate font-semibold leading-snug">{note.title}</h4>
                    <span className="text-[8.5px] font-mono opacity-80 block truncate mt-0.5">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(note.id, e)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-100/20 rounded-[4px] cursor-pointer shrink-0 border-none bg-transparent ${
                      isSelected ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Editing Pane */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F7F7F7]/20">
        {activeNote ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Note toolbar */}
            <div className="h-11 border-b border-[#E5E7EB] px-4 flex items-center justify-between bg-white shrink-0">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold text-slate-900 focus:outline-none focus:ring-0 truncate max-w-sm py-1 font-sans"
                placeholder="Note Title"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-black text-white text-[10px] font-bold rounded-[6px] transition-colors cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
                  {saving ? 'Saving...' : saved ? 'Saved' : 'Save Note'}
                </button>
              </div>
            </div>

            {/* Split Markdown Editor Pane */}
            <div className="flex-1 flex min-h-0">
              {/* Text Edit Block */}
              <div className="flex-1 border-r border-[#E5E7EB] bg-white p-3 min-w-0 h-full">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full resize-none border-0 focus:ring-0 text-[12.5px] text-slate-900 font-mono leading-relaxed focus:outline-none select-text p-1"
                  placeholder="Start writing markdown content..."
                />
              </div>

              {/* Render Preview Block */}
              <div className="flex-1 p-5 overflow-y-auto bg-[#F7F7F7]/30 min-w-0 h-full prose prose-slate max-w-none select-text">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-3.5 last:mb-0 text-[12.5px] leading-relaxed text-[#1f1f1f]">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3.5 space-y-1 text-slate-800 text-[12px]">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3.5 space-y-1 text-slate-800 text-[12px]">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-850 text-[12px]">{children}</li>,
                    h1: ({ children }) => <h1 className="text-sm font-bold text-slate-900 mb-2 mt-4 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xs font-bold text-slate-900 mb-2 mt-4 first:mt-0">{children}</h2>,
                    code: ({ children }) => <code className="bg-slate-100 text-rose-600 px-1 py-0.5 rounded-[4px] text-[11px] font-mono">{children}</code>,
                    pre: ({ children }) => <pre className="bg-[#0f1424] text-slate-300 p-3 rounded-[6px] overflow-auto my-3 text-[10.5px] font-mono leading-relaxed">{children}</pre>,
                    table: ({ children }) => <table className="w-full text-left border-collapse border border-slate-200 my-3 rounded-[6px] overflow-hidden shadow-sm">{children}</table>,
                    th: ({ children }) => <th className="bg-[#f4f3f0] p-2 font-bold text-[11px] border border-slate-200 text-slate-800">{children}</th>,
                    td: ({ children }) => <td className="p-2 text-[11px] border border-slate-200 text-slate-700 bg-white">{children}</td>,
                  }}
                >
                  {content || '*No content written yet.*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-700 p-8 text-center select-none">
            <FileText className="w-10 h-10 text-slate-700 mb-3" />
            <h3 className="text-xs font-bold text-slate-900">No note selected</h3>
            <p className="text-[10px] text-slate-700 mt-1 max-w-xs leading-normal">
              Select an existing note from the list, or click the plus icon to create a new markdown file.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
