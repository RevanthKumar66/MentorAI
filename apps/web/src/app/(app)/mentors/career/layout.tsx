'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';
import { MentorWorkspaceLayout, SidebarFolder } from '@/components/MentorWorkspaceLayout';

const CAREER_FOLDERS: SidebarFolder[] = [
  {
    id: 'planning',
    name: 'Career Planning',
    items: [
      { id: 'plan', name: 'Action Plan Timeline', href: '/mentors/career?tab=plan' },
      { id: 'audit', name: 'Skills Matrix Audit', href: '/mentors/career?tab=audit' }
    ]
  },
  {
    id: 'matching',
    name: 'Job Matching',
    items: [
      { id: 'jobfit', name: 'Job Fit Analyst', href: '/mentors/career?tab=jobfit' }
    ]
  }
];

const ONBOARDING_QUESTIONS = [
  {
    id: 'current_role',
    question: 'What is your current professional role or job title?',
    placeholder: 'e.g. Junior Frontend Dev, Computer Science Student'
  },
  {
    id: 'target_role',
    question: 'What target position or career advancement are you planning for?',
    placeholder: 'e.g. Technical Architect, Engineering Manager'
  }
];

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return (
    <MentorWorkspaceLayout
      mentorKey="career"
      title="Career Advisor"
      icon={<Briefcase className="w-5 h-5 text-violet-600" />}
      themeColor="violet"
      sidebarFolders={CAREER_FOLDERS}
      onboardingQuestions={ONBOARDING_QUESTIONS}
      contextText="Career Advisor workspace. Features action plan checklists, interactive skills matrices, and job alignment gap analyzers."
    >
      {children}
    </MentorWorkspaceLayout>
  );
}
