'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { goalPlanningService } from '@/features/lifesaver/services/GoalPlanningService';
import { goalService } from '@/features/lifesaver/services/GoalService';
import { PlannerForm } from '@/features/lifesaver/components/PlannerForm';
import { Sparkles, Brain } from 'lucide-react';

export default function PlannerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    'Analyzing Goal Objectives And Constraints...',
    'Consulting AI Strategist Models...',
    'Formulating Structured Weekly Milestones...',
    'Predicting Completion Feasibility...',
    'Generating Actionable Tasks & Strategic Suggestions...',
    'Finalizing Your Premium Strategic Roadmap...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (formData: {
    title: string;
    category: string;
    target_date: string;
    hours_per_day: string;
    experience_level: string;
  }) => {
    setIsLoading(true);
    try {
      // 1. Generate the plan using the API
      const planResponse = await goalPlanningService.generatePlan({
        title: formData.title,
        category: formData.category,
        target_date: formData.target_date,
        hours_per_day: formData.hours_per_day,
        experience_level: formData.experience_level,
      });

      // 2. Insert the goal to lifesaver_goals
      const createdGoal = await goalService.createGoal({
        title: formData.title,
        description: planResponse.summary || `AI Generated Roadmap Plan For ${formData.title}`,
        target_date: formData.target_date,
        status: 'active',
        category: formData.category,
        hours_per_day: formData.hours_per_day,
        experience_level: formData.experience_level,
      });

      // 3. Save the generated plan metadata, milestones, and tasks using the new goal ID
      await goalPlanningService.saveGoalPlan(createdGoal.id, planResponse);

      // 4. Redirect to the detail page for the goal
      router.push(`/lifesaver/goals/${createdGoal.id}`);
    } catch (err) {
      console.error('Error creating AI plan:', err);
      alert(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full px-14 py-6 space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-base font-semibold text-slate-950 tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-700" />
          AI Goal Planner
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Enter your goal, schedule, and experience level — AI maps out your roadmap.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200/60 rounded-[12px] min-h-[340px] flex flex-col items-center justify-center gap-5 px-8 py-12">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 border-2 border-slate-200 border-t-slate-950 rounded-full animate-spin" />
            <Brain className="w-6 h-6 text-slate-900 absolute" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xs font-semibold text-slate-950 uppercase tracking-wider">Formulating Strategic Plan</h3>
            <p className="text-[10px] text-slate-600 font-semibold animate-pulse">
              {loadingSteps[loadingStep]}
            </p>
          </div>
        </div>
      ) : (
        <PlannerForm onSubmit={handleSubmit} isLoading={isLoading} />
      )}
    </div>
  );
}
