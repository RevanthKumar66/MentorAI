'use client';

import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { MentorWorkspaceLayout, SidebarFolder } from '@/components/MentorWorkspaceLayout';

const RESUME_FOLDERS: SidebarFolder[] = [
  {
    id: 'builder',
    name: 'Resume Builder',
    items: [
      { id: 'contact', name: 'Contact Info', href: '/mentors/resume?section=contact' },
      { id: 'experience', name: 'Work Experience', href: '/mentors/resume?section=experience' },
      { id: 'education', name: 'Education', href: '/mentors/resume?section=education' },
      { id: 'projects', name: 'Projects & Highlights', href: '/mentors/resume?section=projects' }
    ]
  },
  {
    id: 'optimizer',
    name: 'Optimization Tools',
    items: [
      { id: 'ats', name: 'ATS Keyword Scan', href: '/mentors/resume?section=ats' },
      { id: 'cover', name: 'Cover Letter Generator', href: '/mentors/resume?section=cover' },
      { id: 'linkedin', name: 'LinkedIn Profiler', href: '/mentors/resume?section=linkedin' }
    ]
  },
  {
    id: 'simulation',
    name: 'Simulation Views',
    items: [
      { id: 'recruiter', name: 'Recruiter Heat Map', href: '/mentors/resume?section=recruiter' }
    ]
  }
];

const ONBOARDING_QUESTIONS = [
  {
    id: 'target_role',
    question: 'What target job title or role are you preparing this resume for?',
    placeholder: 'e.g. Senior Fullstack Engineer, Product Manager'
  },
  {
    id: 'experience_yrs',
    question: 'How many years of relevant professional experience do you have?',
    options: ['Entry Level (0-1 yrs)', 'Mid Level (2-4 yrs)', 'Senior (5-8 yrs)', 'Lead / Director (9+ yrs)']
  },
  {
    id: 'primary_skill',
    question: 'What is your primary skill or core tech stack focus?',
    placeholder: 'e.g. Next.js, FastAPI, PostgreSQL'
  },
  {
    id: 'biggest_achievement',
    question: 'What is your proudest professional achievement or project?',
    placeholder: 'e.g. Built microservice reducing API latency by 40% using Redis'
  }
];

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <MentorWorkspaceLayout
      mentorKey="resume"
      title="Resume Prep AI"
      icon={<FileSpreadsheet className="w-5 h-5 text-emerald-500" />}
      themeColor="emerald"
      sidebarFolders={RESUME_FOLDERS}
      onboardingQuestions={ONBOARDING_QUESTIONS}
      contextText="Resume Builder & ATS Optimizer workspace. Features scoring assessments, cover letter generation, LinkedIn headline audit, and recruiter heat map simulations."
    >
      {children}
    </MentorWorkspaceLayout>
  );
}
