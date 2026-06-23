'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '@/features/lifesaver/services/GoalService';
import { taskService } from '@/features/lifesaver/services/TaskService';
import { Goal } from '@/features/lifesaver/types/goal';
import { GoalCard } from '@/features/lifesaver/components/GoalCard';
import { EmptyState } from '@/features/lifesaver/components/EmptyState';
import { Plus, X, Flag, Loader2 } from 'lucide-react';

export default function GoalsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Tab filtering state
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'paused'>('all');

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<Goal['status']>('active');
  const [category, setCategory] = useState('career');
  const [hoursPerDay, setHoursPerDay] = useState('3-4 hours');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');

  const [formError, setFormError] = useState('');

  // Fetch Goals
  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['lifesaver-goals'],
    queryFn: () => goalService.getGoals(),
  });

  // Fetch Tasks for progress calculation
  const { data: tasks = [] } = useQuery({
    queryKey: ['lifesaver-tasks'],
    queryFn: () => taskService.getTasks(),
  });


  // Goal task counts mapping
  const goalTaskStats = React.useMemo(() => {
    const stats: Record<string, { completed: number; total: number }> = {};
    goals.forEach((g) => {
      stats[g.id] = { completed: 0, total: 0 };
    });
    tasks.forEach((t) => {
      if (t.goal_id && stats[t.goal_id]) {
        stats[t.goal_id].total += 1;
        if (t.status === 'completed') {
          stats[t.goal_id].completed += 1;
        }
      }
    });
    return stats;
  }, [goals, tasks]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => 
      goalService.createGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifesaver-goals'] });
      handleCloseModal();
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to create goal');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; payload: Partial<Goal> }) => 
      goalService.updateGoal(input.id, input.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifesaver-goals'] });
      handleCloseModal();
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to update goal');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifesaver-goals'] });
      queryClient.invalidateQueries({ queryKey: ['lifesaver-tasks'] });
    }
  });

  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('career');
    setHoursPerDay('3-4 hours');
    setExperienceLevel('Beginner');
    // Default to 1 week from now
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    setTargetDate(oneWeekLater.toISOString().split('T')[0]);
    setStatus('active');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category || 'career');
    setHoursPerDay(goal.hours_per_day || '3-4 hours');
    setExperienceLevel(goal.experience_level || 'Beginner');
    setTargetDate(new Date(goal.target_date).toISOString().split('T')[0]);
    setStatus(goal.status);
    setFormError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingGoal(null);
  };

  // Listen for query params to trigger modal open
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setTimeout(() => {
        handleOpenCreateModal();
      }, 0);
      // Clear param to avoid re-opening
      router.replace('/lifesaver/goals');
    }
  }, [searchParams, router]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Goal Title Is Required');
      return;
    }
    if (!targetDate) {
      setFormError('Target Date Is Required');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      target_date: new Date(targetDate).toISOString(),
      status,
      category,
      hours_per_day: hoursPerDay,
      experience_level: experienceLevel,
    };

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleStatusChange = (id: string, nextStatus: Goal['status']) => {
    updateMutation.mutate({ id, payload: { status: nextStatus } });
  };

  const filteredGoals = goals.filter((goal) => {
    if (activeTab === 'all') return true;
    return goal.status === activeTab;
  });

  const tabs: Array<{ id: typeof activeTab; name: string }> = [
    { id: 'all', name: 'All Goals' },
    { id: 'active', name: 'Active' },
    { id: 'completed', name: 'Completed' },
    { id: 'paused', name: 'Paused' },
  ];

  return (
    <main className="w-full px-14 py-6 space-y-6 animate-fade-in">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#f4f3f0] p-0.5 rounded-[6px] border border-slate-200 self-start select-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-[4px] text-[10px] font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 border border-slate-200/60'
                  : 'text-slate-700 hover:text-slate-900 border border-transparent'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-[6px] transition-colors cursor-pointer select-none self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {/* Grid listing */}
      {loadingGoals ? (
        <div className="flex h-[250px] w-full justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              taskStats={goalTaskStats[goal.id]}
              onEdit={handleOpenEditModal}
              onDelete={(id) => deleteMutation.mutate(id)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Flag}
          title="No Goals Found"
          description={
            activeTab === 'all'
              ? 'You haven\'t created any goals yet. Setup your first milestone!'
              : `No ${activeTab} goals found.`
          }
          actionLabel={activeTab === 'all' ? 'Add Goal' : undefined}
          onAction={activeTab === 'all' ? handleOpenCreateModal : undefined}
        />
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-45 bg-black/20 backdrop-blur-[1px]" onClick={handleCloseModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <div className="pointer-events-auto bg-white border border-slate-200 rounded-[12px] shadow-xl w-full max-w-[400px] p-5 animate-scale-in text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                </h3>
                <button onClick={handleCloseModal} className="p-0.5 text-slate-550 hover:text-slate-900 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[6px] text-[10px] font-semibold text-rose-700 leading-snug">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Finish Hackathon Project"
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about what you want to achieve..."
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white cursor-pointer"
                    >
                      <option value="career">Career & Professional</option>
                      <option value="education">Academics & Learning</option>
                      <option value="health">Health & Fitness</option>
                      <option value="finance">Finance & Wealth</option>
                      <option value="lifestyle">Lifestyle & Habits</option>
                      <option value="other">Other Goals</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                      Daily Hours Capacity
                    </label>
                    <select
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white cursor-pointer"
                    >
                      <option value="1-2 hours">1-2 Hours</option>
                      <option value="3-4 hours">3-4 Hours</option>
                      <option value="5-6 hours">5-6 Hours</option>
                      <option value="7+ hours">7+ Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                      Knowledge Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white cursor-pointer"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {editingGoal && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Goal['status'])}
                      className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-1.5 rounded-[6px] border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer select-none text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-1.5 rounded-[6px] bg-slate-900 hover:bg-black text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 select-none text-center"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
