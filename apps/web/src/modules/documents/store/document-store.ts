import { create } from 'zustand';

export interface Document {
  id: string;
  user_id: string;
  file_name: string;
  original_file_name: string;
  file_extension: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  storage_provider: string;
  checksum: string;
  category: string;
  status: string;
  document_metadata?: Record<string, any> | null;
  version: number;
  parent_document_id?: string | null;
  is_processed: boolean;
  processing_status: string;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface DocumentState {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  searchQuery: string;
  selectedCategory: string;
  uploadQueue: UploadItem[];
  
  // Actions
  setDocuments: (documents: Document[], total: number) => void;
  setPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  addToQueue: (files: File[]) => void;
  updateQueueProgress: (
    id: string, 
    progress: number, 
    status: UploadItem['status'], 
    error?: string
  ) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  total: 0,
  page: 1,
  limit: 10,
  searchQuery: '',
  selectedCategory: '',
  uploadQueue: [],

  setDocuments: (documents, total) => set({ documents, total }),
  setPage: (page) => set({ page }),
  setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory, page: 1 }),
  
  addToQueue: (files) => set((state) => {
    const newItems: UploadItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
    }));
    return { uploadQueue: [...state.uploadQueue, ...newItems] };
  }),

  updateQueueProgress: (id, progress, status, error) => set((state) => ({
    uploadQueue: state.uploadQueue.map((item) =>
      item.id === id ? { ...item, progress, status, error } : item
    ),
  })),

  removeFromQueue: (id) => set((state) => ({
    uploadQueue: state.uploadQueue.filter((item) => item.id !== id),
  })),

  clearQueue: () => set({ uploadQueue: [] }),
}));
