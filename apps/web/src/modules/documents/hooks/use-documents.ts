import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDocumentStore } from '../store/document-store';
import { documentApi } from '../services/document-api';

export function useDocuments() {
  const queryClient = useQueryClient();
  const {
    documents,
    total,
    page,
    limit,
    searchQuery,
    selectedCategory,
    uploadQueue,
    setDocuments,
    setPage,
    setSearchQuery,
    setSelectedCategory,
    addToQueue,
    updateQueueProgress,
    removeFromQueue,
    clearQueue,
  } = useDocumentStore();

  // 1. Query documents
  const { data: remoteData, isLoading, isError, error } = useQuery({
    queryKey: ['documents', page, limit, selectedCategory, searchQuery],
    queryFn: () =>
      documentApi.listDocuments({
        page,
        limit,
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      }),
  });

  // Sync state to Zustand
  useEffect(() => {
    if (remoteData) {
      setDocuments(remoteData.items, remoteData.total);
    }
  }, [remoteData, setDocuments]);

  // 2. Process upload queue sequentially in background
  useEffect(() => {
    const pendingItem = uploadQueue.find((item) => item.status === 'pending');
    if (!pendingItem) return;

    const { id, file } = pendingItem;

    const runUpload = async () => {
      updateQueueProgress(id, 0, 'uploading');
      try {
        await documentApi.uploadFile(file, (progress) => {
          updateQueueProgress(id, progress, 'uploading');
        });
        updateQueueProgress(id, 100, 'completed');
        
        // Refresh listing cache
        queryClient.invalidateQueries({ queryKey: ['documents'] });

        // Auto remove completed item from queue visual list after 1.5 seconds
        setTimeout(() => {
          removeFromQueue(id);
        }, 1500);
      } catch (err: any) {
        updateQueueProgress(id, 0, 'failed', err.message || 'Upload failed');
      }
    };

    runUpload();
  }, [uploadQueue, updateQueueProgress, removeFromQueue, queryClient]);

  // 3. Delete Document mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // 4. Helper to download a file (resolves signed URL and opens in browser)
  const downloadDocument = async (id: string, fileName: string) => {
    try {
      const url = await documentApi.getDownloadUrl(id);
      // Trigger browser download link
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      link.setAttribute('target', '_blank');
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Error: Could not retrieve secure download link.');
    }
  };

  return {
    documents,
    total,
    page,
    limit,
    searchQuery,
    selectedCategory,
    uploadQueue,
    isLoading,
    isError,
    error,
    setPage,
    setSearchQuery,
    setSelectedCategory,
    uploadFiles: addToQueue,
    deleteDocument: (id: string) => deleteMutation.mutate(id),
    downloadDocument,
    isDeleting: deleteMutation.isPending,
    clearQueue,
    removeFromQueue,
  };
}
