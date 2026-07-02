'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { MentorWorkspaceLayout, SidebarFolder } from '@/components/MentorWorkspaceLayout';

const DOC_FOLDERS: SidebarFolder[] = [
  {
    id: 'collections',
    name: 'Knowledge Collections',
    items: [
      { id: 'all', name: 'All Workspace Files', href: '/mentors/documents?collection=all' },
      { id: 'tech', name: 'Engineering Project Docs', href: '/mentors/documents?collection=tech' }
    ]
  }
];

const ONBOARDING_QUESTIONS = [
  {
    id: 'doc_type',
    question: 'What types of documents will you analyze most frequently?',
    options: ['Software Codebases & Configs', 'Research PDFs & Papers', 'Product Requirements (PRDs)', 'General Business Notes']
  }
];

export default function DocumentAssistantLayout({ children }: { children: React.ReactNode }) {
  return (
    <MentorWorkspaceLayout
      mentorKey="document"
      title="Document Assistant"
      icon={<FileText className="w-5 h-5 text-rose-600" />}
      themeColor="rose"
      sidebarFolders={DOC_FOLDERS}
      onboardingQuestions={ONBOARDING_QUESTIONS}
      contextText="Document Assistant workspace. Features RAG file explorers, collections indexes, and strict contextual document questioning interfaces."
    >
      {children}
    </MentorWorkspaceLayout>
  );
}
