export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  role: 'user' | 'admin';
  preferences?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  agentType: 'general' | 'learning' | 'coding' | 'dsa' | 'dataset' | 'career' | 'research' | 'document';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata?: Record<string, any>;
}

export interface Dataset {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  storagePath: string;
  rowCount?: number;
  columnCount?: number;
  summary?: Record<string, any>;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface DatasetReport {
  id: string;
  datasetId: string;
  reportType: 'eda' | 'cleaning' | 'modeling';
  content: string;
  createdAt: string;
}

export interface LearningRoadmap {
  id: string;
  userId: string;
  topic: string;
  roadmapData: Record<string, any>;
  createdAt: string;
}

export interface RoadmapProgress {
  id: string;
  roadmapId: string;
  topicId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  lastReviewedAt?: string;
}

export interface DsaProgress {
  id: string;
  userId: string;
  topic: string;
  problemName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'solved' | 'attempted';
  notes?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  userId: string;
  front: string;
  back: string;
  box: number;
  nextReviewAt: string;
}

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}
