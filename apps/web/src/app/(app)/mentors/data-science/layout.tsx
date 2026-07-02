'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { MentorWorkspaceLayout, SidebarFolder } from '@/components/MentorWorkspaceLayout';

const DS_FOLDERS: SidebarFolder[] = [
  {
    id: 'notebooks',
    name: 'Jupyter Notebooks',
    items: [
      { id: 'eda', name: 'Exploratory Data Analysis', href: '/mentors/data-science?nb=eda' },
      { id: 'eval', name: 'Model Performance Evaluator', href: '/mentors/data-science?nb=eval' }
    ]
  }
];

const ONBOARDING_QUESTIONS = [
  {
    id: 'level',
    question: 'What is your current data science expertise level?',
    options: ['Beginner (Pandas & Data Cleaning)', 'Intermediate (SciKit-Learn & Classical ML)', 'Advanced (PyTorch & Deep Learning)']
  },
  {
    id: 'interests',
    question: 'Which domain are you most interested in exploring?',
    options: ['Data Visualizations & SQL Analytics', 'Supervised / Unsupervised ML models', 'Natural Language Processing & LLMs']
  }
];

export default function DSLayout({ children }: { children: React.ReactNode }) {
  return (
    <MentorWorkspaceLayout
      mentorKey="datascience"
      title="Data Scientist"
      icon={<BarChart3 className="w-5 h-5 text-cyan-600" />}
      themeColor="cyan"
      sidebarFolders={DS_FOLDERS}
      onboardingQuestions={ONBOARDING_QUESTIONS}
      contextText="Data Scientist workspace. Features python scratchpad notebooks, interactive cells executing charts, and ROC/PR metric evaluators."
    >
      {children}
    </MentorWorkspaceLayout>
  );
}
