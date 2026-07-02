'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { MentorWorkspaceLayout, SidebarFolder } from '@/components/MentorWorkspaceLayout';

const RESEARCH_FOLDERS: SidebarFolder[] = [
  {
    id: 'search',
    name: 'Research Engine',
    items: [
      { id: 'query', name: 'Literature Search', href: '/mentors/research?view=search' },
      { id: 'citations', name: 'Citation Builder', href: '/mentors/research?view=citations' }
    ]
  },
  {
    id: 'library',
    name: 'Scientific Papers',
    items: [
      { id: 'p1', name: 'Attention Is All You Need', href: '/mentors/research?view=paper&id=attention' },
      { id: 'p2', name: 'RoBERTa: Robustly Optimized BERT', href: '/mentors/research?view=paper&id=roberta' }
    ]
  }
];

const ONBOARDING_QUESTIONS = [
  {
    id: 'focus',
    question: 'What is your primary research focus domain?',
    options: ['Computer Science & AI', 'Bioinformatics & Genetics', 'Quantitative Finance', 'Economics & Social Policy', 'General Literature Review']
  },
  {
    id: 'citation_style',
    question: 'What is your preferred citation style for bibliography entries?',
    options: ['APA 7th Edition', 'IEEE Standard', 'MLA 9th Edition', 'Chicago Manual of Style']
  }
];

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <MentorWorkspaceLayout
      mentorKey="research"
      title="Research Analyst"
      icon={<Search className="w-5 h-5 text-amber-600" />}
      themeColor="amber"
      sidebarFolders={RESEARCH_FOLDERS}
      onboardingQuestions={ONBOARDING_QUESTIONS}
      contextText="Research Analyst workspace. Features literature search query terminals, reference citation generators, and parsed PDF summary viewers."
    >
      {children}
    </MentorWorkspaceLayout>
  );
}
