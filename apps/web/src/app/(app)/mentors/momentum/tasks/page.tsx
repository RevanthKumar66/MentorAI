'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/features/lifesaver/services/TaskService';
import { goalService } from '@/features/lifesaver/services/GoalService';
import { priorityEngineService } from '@/features/lifesaver/services/PriorityEngineService';
import { Task } from '@/features/lifesaver/types/task';
import { TaskScoreMap } from '@/features/lifesaver/types/focus';
import { TaskCard } from '@/features/lifesaver/components/TaskCard';
import { EmptyState } from '@/features/lifesaver/components/EmptyState';
import { Plus, X, CheckSquare, Loader2 } from 'lucide-react';

export default function TasksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [scoreMap, setScoreMap] = useState<TaskScoreMap>({});

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalId, setGoalId] = useState<string>('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>('pending');
  const [dueDate, setDueDate] = useState('');

  const [formError, setFormError] = useState('');

  // Fetch Tasks
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['lifesaver-tasks'],
    queryFn: () => taskService.getTasks(),
  });

  // Fetch Goals (to link tasks)
  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['lifesaver-goals'],
    queryFn: () => goalService.getGoals(),
  });

  // Load persisted priority scores
  useEffect(() => {
    priorityEngineService.loadPersistedScores()
      .then(setScoreMap)
      .catch((err) => console.error('Failed to load scores:', err));
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setGoalId('');
    setPriority('medium');
    setStatus('pending');
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDate(tomorrow.toISOString().split('T')[0]);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setGoalId(task.goal_id || '');
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(new Date(task.due_date).toISOString().split('T')[0]);
    setFormError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  // Listen for query params to trigger modal open or edit
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setTimeout(() => {
        handleOpenCreateModal();
      }, 0);
      router.replace('/mentors/momentum/tasks');
    } else {
      const editId = searchParams.get('edit');
      if (editId && tasks.length > 0) {
        const found = tasks.find(t => t.id === editId);
        if (found) {
          setTimeout(() => {
            handleOpenEditModal(found);
          }, 0);
        }
        router.replace('/mentors/momentum/tasks');
      }
    }
  }, [searchParams, tasks, router]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: {
      title: string;
      description: string | null;
      goal_id: string | null;
      priority: Task['priority'];
      status: Task['status'];
      due_date: string;
    }) => taskService.createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifesaver-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['lifesaver-goals'] });
      handleCloseModal();
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to create task');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; payload: Partial<Task> }) => 
      taskService.updateTask(input.id, input.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifesaver-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['lifesaver-goals'] });
      handleCloseModal();
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to update task');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifesaver-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['lifesaver-goals'] });
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!dueDate) {
      setFormError('Due date is required');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      goal_id: goalId || null,
      priority,
      status,
      due_date: new Date(dueDate).toISOString(),
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: Task['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateMutation.mutate({ id, payload: { status: nextStatus } });
  };

  // Filter tasks logic
  const filteredTasks = tasks.filter((task) => {
    // Goal filter
    if (goalFilter !== 'all' && task.goal_id !== goalFilter) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Status filter
    if (statusFilter === 'pending') {
      return task.status !== 'completed';
    } else if (statusFilter === 'completed') {
      return task.status === 'completed';
    }
    
    return true;
  });

  const statusTabs: Array<{ id: typeof statusFilter; name: string }> = [
    { id: 'all', name: 'All Tasks' },
    { id: 'pending', name: 'Pending' },
    { id: 'completed', name: 'Completed' },
  ];

  return (
    <main className="w-full px-14 py-6 space-y-6 animate-fade-in">
      {/* Filters row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#f4f3f0] p-0.5 rounded-[6px] border border-slate-200 select-none">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-[4px] text-[10px] font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 border border-slate-200/60'
                    : 'text-slate-700 hover:text-slate-900 border border-transparent'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Goal Filter Dropdown */}
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[10.5px] font-semibold text-slate-800 focus:outline-none focus:border-slate-500 bg-white"
          >
            <option value="all">All Goals</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>Goal: {g.title}</option>
            ))}
          </select>

          {/* Priority Filter Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[10.5px] font-semibold text-slate-800 focus:outline-none focus:border-slate-500 bg-white"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-[6px] transition-colors cursor-pointer select-none self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Grid listing */}
      {loadingTasks || loadingGoals ? (
        <div className="flex h-[250px] w-full justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              goals={goals}
              onToggleStatus={handleToggleStatus}
              onEdit={handleOpenEditModal}
              onDelete={(id) => deleteMutation.mutate(id)}
              priorityScore={scoreMap[task.id]?.priority_score}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No Tasks Found"
          description={
            statusFilter === 'all' && goalFilter === 'all' && priorityFilter === 'all'
              ? 'You haven\'t created any tasks yet. Setup your first checkpoint!'
              : 'No tasks match the active filters.'
          }
          actionLabel={statusFilter === 'all' && goalFilter === 'all' && priorityFilter === 'all' ? 'Add Task' : undefined}
          onAction={statusFilter === 'all' && goalFilter === 'all' && priorityFilter === 'all' ? handleOpenCreateModal : undefined}
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
                  {editingTask ? 'Edit Task' : 'Create New Task'}
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
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Code database migrations"
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
                    placeholder="Provide details about what needs to be done..."
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                    Link to Goal
                  </label>
                  <select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="">None (General Task)</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Task['priority'])}
                      className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {editingTask && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-800 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Task['status'])}
                      className="w-full px-2.5 py-1.5 rounded-[6px] border border-slate-300 text-[11.5px] text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
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
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Task'}
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
