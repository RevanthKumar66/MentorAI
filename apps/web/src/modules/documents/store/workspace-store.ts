import { create } from 'zustand';
import { Collection } from '../services/collection-api';

interface WorkspaceState {
  activeWorkspaceId: string | null;
  collections: Collection[];
  setActiveWorkspaceId: (id: string | null) => void;
  setCollections: (collections: Collection[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  collections: [],
  setActiveWorkspaceId: (activeWorkspaceId) => set({ activeWorkspaceId }),
  setCollections: (collections) => set({ collections }),
}));
