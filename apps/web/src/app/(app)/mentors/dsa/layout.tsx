'use client';

import React from 'react';
import { GitFork } from 'lucide-react';
import { MentorWorkspaceLayout, SidebarFolder } from '@/components/MentorWorkspaceLayout';

const DSA_FOLDERS: SidebarFolder[] = [
  {
    id: 'visuals',
    name: 'Algorithm Visualizers',
    items: [
      { id: 'sort', name: 'Bubble Sort Visualizer', href: '/mentors/dsa?tab=visualizer&algo=bubble' },
      { id: 'search', name: 'Binary Search Visualizer', href: '/mentors/dsa?tab=visualizer&algo=binary' }
    ]
  },
  {
    id: 'problems',
    name: 'DSA Problem Sets',
    items: [
      { id: 'twosum', name: 'Two Sum (Arrays)', href: '/mentors/dsa?tab=problems&id=twosum' },
      { id: 'reverse', name: 'Reverse Linked List', href: '/mentors/dsa?tab=problems&id=reverse' },
      { id: 'valid', name: 'Valid Parentheses (Stack)', href: '/mentors/dsa?tab=problems&id=valid' }
    ]
  }
];

const ONBOARDING_QUESTIONS = [
  {
    id: 'language',
    question: 'Which programming language do you use for algorithm coding?',
    options: ['Java', 'C++', 'Python', 'Go / Rust', 'JavaScript / TypeScript']
  },
  {
    id: 'experience',
    question: 'How comfortable are you with computational complexity analyses?',
    options: ['Unfamiliar with Big-O', 'Basic understanding (Linear, Quadratic)', 'Comfortable calculating space/time bounds']
  }
];

export default function DSALayout({ children }: { children: React.ReactNode }) {
  return (
    <MentorWorkspaceLayout
      mentorKey="dsa"
      title="DSA Coach"
      icon={<GitFork className="w-5 h-5 text-indigo-650" />}
      themeColor="indigo"
      sidebarFolders={DSA_FOLDERS}
      onboardingQuestions={ONBOARDING_QUESTIONS}
      contextText="DSA Coach workspace. Features interactive sorting and search visualizers, step-by-step algorithms dry run consoles, and complexity calculators."
    >
      {children}
    </MentorWorkspaceLayout>
  );
}
