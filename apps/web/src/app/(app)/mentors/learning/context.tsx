'use client';

import React, { createContext, useContext, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export type LanguageType =
  | 'Simple English'
  | 'Professional English'
  | 'Beginner English'
  | 'Interview English'
  | 'Technical English'
  | 'Telugu'
  | 'Telugu + English Mixed'
  | 'Tamil'
  | 'Hindi'
  | 'Kannada'
  | 'Malayalam'
  | 'Marathi'
  | 'Bengali'
  | 'Gujarati'
  | 'Punjabi';

export type LearningStyleType =
  | 'Theory & Explanations'
  | 'Code & Practical Examples Heavy'
  | 'Interview Prep & Leetcode Focus'
  | 'Project-Based Building'
  | 'Visual Learning';

export interface AccessibilitySettings {
  focusMode: boolean;
  highContrast: boolean;
  readingMode: boolean;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
}

export interface OnboardingForm {
  education: string;
  profession: string;
  experience: string;
  careerGoal: string;
  targetCompanies: string[];
  targetRole: string;
  programmingLanguages: string[];
  interestedSubjects: string[];
  learningStyle: LearningStyleType;
  preferredLanguage: LanguageType;
  dailyTime: string;
  weeklyDays: string;
  motivation: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  details: string;
}

export interface RoadmapPhase {
  name: string;
  items: RoadmapItem[];
}

export interface LearningRoadmap {
  title: string;
  createdAt: string;
  phases: RoadmapPhase[];
}

interface LearningContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  learningStyle: LearningStyleType;
  setLearningStyle: (style: LearningStyleType) => void;
  accessibility: AccessibilitySettings;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  activeLessonId: string;
  setActiveLessonId: (id: string) => void;
  onboardingData: OnboardingForm | null;
  setOnboardingData: (data: OnboardingForm | null) => void;
  roadmap: LearningRoadmap | null;
  setRoadmap: (roadmap: LearningRoadmap | null) => void;
  bookmarks: string[];
  toggleBookmark: (lessonId: string) => void;
  completedLessons: string[];
  toggleComplete: (lessonId: string) => void;
  notes: Record<string, string>;
  saveNote: (lessonId: string, noteContent: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isNotesPanelOpen: boolean;
  setIsNotesPanelOpen: (open: boolean) => void;
  isAiMentorOpen: boolean;
  setIsAiMentorOpen: (open: boolean) => void;
  resetOnboarding: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Lesson is driven directly by the URL param, eliminating state syncing effects
  const activeLessonId = searchParams.get('lesson') || '';

  const setActiveLessonId = (id: string) => {
    if (id) {
      router.push(`/mentors/learning?lesson=${id}`);
    } else {
      router.push('/mentors/learning');
    }
  };

  // Lazy state initializers to avoid setState inside useEffect during mount
  const [language, setLanguage] = useState<LanguageType>(() => {
    if (typeof window !== 'undefined') {
      const onboardedRaw = localStorage.getItem('learning_mentor_onboarding');
      if (onboardedRaw) {
        const parsed = JSON.parse(onboardedRaw);
        if (parsed.preferredLanguage) return parsed.preferredLanguage;
      }
    }
    return 'Simple English';
  });

  const [learningStyle, setLearningStyle] = useState<LearningStyleType>(() => {
    if (typeof window !== 'undefined') {
      const onboardedRaw = localStorage.getItem('learning_mentor_onboarding');
      if (onboardedRaw) {
        const parsed = JSON.parse(onboardedRaw);
        if (parsed.learningStyle) return parsed.learningStyle;
      }
    }
    return 'Theory & Explanations';
  });

  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      const accessRaw = localStorage.getItem('learning_mentor_accessibility');
      if (accessRaw) return JSON.parse(accessRaw);
    }
    return {
      focusMode: false,
      highContrast: false,
      readingMode: false,
      fontSize: 'md',
    };
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingForm | null>(() => {
    if (typeof window !== 'undefined') {
      const onboardedRaw = localStorage.getItem('learning_mentor_onboarding');
      if (onboardedRaw) return JSON.parse(onboardedRaw);
    }
    return null;
  });

  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(() => {
    if (typeof window !== 'undefined') {
      const roadmapRaw = localStorage.getItem('learning_mentor_roadmap');
      if (roadmapRaw) return JSON.parse(roadmapRaw);
    }
    return null;
  });

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const bookmarksRaw = localStorage.getItem('learning_mentor_bookmarks');
      return bookmarksRaw ? JSON.parse(bookmarksRaw) : [];
    }
    return [];
  });

  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const completedRaw = localStorage.getItem('learning_mentor_completed');
      return completedRaw ? JSON.parse(completedRaw) : [];
    }
    return [];
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const notesRaw = localStorage.getItem('learning_mentor_notes');
      return notesRaw ? JSON.parse(notesRaw) : {};
    }
    return {};
  });

  // Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [isAiMentorOpen, setIsAiMentorOpen] = useState(false);

  // Save changes helpers
  const toggleBookmark = (lessonId: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      localStorage.setItem('learning_mentor_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const toggleComplete = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];
      localStorage.setItem('learning_mentor_completed', JSON.stringify(next));
      return next;
    });
  };

  const saveNote = (lessonId: string, noteContent: string) => {
    setNotes((prev) => {
      const next = { ...prev, [lessonId]: noteContent };
      localStorage.setItem('learning_mentor_notes', JSON.stringify(next));
      return next;
    });
  };

  const updateAccessibility = (settings: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => {
      const next = { ...prev, ...settings };
      localStorage.setItem('learning_mentor_accessibility', JSON.stringify(next));
      return next;
    });
  };

  const resetOnboarding = () => {
    localStorage.removeItem('learning_mentor_onboarding');
    localStorage.removeItem('learning_mentor_roadmap');
    setOnboardingData(null);
    setRoadmap(null);
  };

  return (
    <LearningContext.Provider
      value={{
        language,
        setLanguage,
        learningStyle,
        setLearningStyle,
        accessibility,
        updateAccessibility,
        activeLessonId,
        setActiveLessonId,
        onboardingData,
        setOnboardingData: (data) => {
          setOnboardingData(data);
          if (data) {
            localStorage.setItem('learning_mentor_onboarding', JSON.stringify(data));
          } else {
            localStorage.removeItem('learning_mentor_onboarding');
          }
        },
        roadmap,
        setRoadmap: (map) => {
          setRoadmap(map);
          if (map) {
            localStorage.setItem('learning_mentor_roadmap', JSON.stringify(map));
          } else {
            localStorage.removeItem('learning_mentor_roadmap');
          }
        },
        bookmarks,
        toggleBookmark,
        completedLessons,
        toggleComplete,
        notes,
        saveNote,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        searchQuery,
        setSearchQuery,
        isNotesPanelOpen,
        setIsNotesPanelOpen,
        isAiMentorOpen,
        setIsAiMentorOpen,
        resetOnboarding,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}
