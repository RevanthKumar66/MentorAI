'use client';

import React from 'react';
import { Code2 } from 'lucide-react';
import { MentorWorkspaceLayout, SidebarFolder } from '@/components/MentorWorkspaceLayout';

const CODING_FOLDERS: SidebarFolder[] = [
  {
    id: 'sandbox',
    name: 'Code Editor',
    items: [
      { id: 'editor', name: 'Interactive Sandbox', href: '/mentors/coding?tool=editor' },
      { id: 'refactor', name: 'Refactor Suggest', href: '/mentors/coding?tool=refactor' }
    ]
  },
  {
    id: 'challenges',
    name: 'Practice Library',
    items: [
      { id: 'ch1', name: 'Async Event Queue', href: '/mentors/coding?tool=editor&challenge=async' },
      { id: 'ch2', name: 'In-Memory Cache Store', href: '/mentors/coding?tool=editor&challenge=cache' },
      { id: 'ch3', name: 'Thread-Safe Queue', href: '/mentors/coding?tool=editor&challenge=threadsafe' }
    ]
  }
];

const ONBOARDING_QUESTIONS = [
  {
    id: 'language',
    question: 'What is your primary programming language of choice?',
    options: ['TypeScript / JavaScript', 'Python', 'Go', 'Rust', 'C++ / Java']
  },
  {
    id: 'target_level',
    question: 'What coding level are you targeting?',
    options: ['Production-Ready Software', 'Algorithms & Core Syntax', 'Systems Programming', 'Cloud Native APIs']
  }
];

export default function CodingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MentorWorkspaceLayout
      mentorKey="coding"
      title="Coding Assistant"
      icon={<Code2 className="w-5 h-5 text-blue-600" />}
      themeColor="blue"
      sidebarFolders={CODING_FOLDERS}
      onboardingQuestions={ONBOARDING_QUESTIONS}
      contextText="Interactive Code Sandbox and visual test log workspace. Allows writing code, running mock test suites, and requesting line-by-line refactoring reviews."
    >
      {children}
    </MentorWorkspaceLayout>
  );
}
