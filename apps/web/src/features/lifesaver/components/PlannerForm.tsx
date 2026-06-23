import React, { useState } from 'react';
import { Calendar, Clock, GraduationCap, Folder, AlertCircle } from 'lucide-react';

interface PlannerFormProps {
  onSubmit: (data: {
    title: string;
    category: string;
    target_date: string;
    hours_per_day: string;
    experience_level: string;
  }) => void;
  isLoading: boolean;
}

export const PlannerForm: React.FC<PlannerFormProps> = ({ onSubmit, isLoading }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('career');
  const [targetDate, setTargetDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('3-4 hours');
  const [experienceLevel, setExperienceLevel] = useState('Beginner');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please Enter A Goal Title.');
      return;
    }
    if (!targetDate) {
      setError('Please Select A Target Date.');
      return;
    }

    // Check if target date is in the future
    const selectedDate = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      setError('Please Select A Future Date.');
      return;
    }

    onSubmit({
      title: title.trim(),
      category,
      target_date: targetDate,
      hours_per_day: hoursPerDay,
      experience_level: experienceLevel,
    });
  };

  const categories = [
    { value: 'career', label: 'Career & Professional' },
    { value: 'education', label: 'Academics & Learning' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'finance', label: 'Finance & Wealth' },
    { value: 'lifestyle', label: 'Lifestyle & Habits' },
    { value: 'other', label: 'Other Goals' },
  ];

  const hoursOptions = [
    { value: '1-2 hours', label: '1-2 Hours Per Day' },
    { value: '3-4 hours', label: '3-4 Hours Per Day' },
    { value: '5-6 hours', label: '5-6 Hours Per Day' },
    { value: '7+ hours', label: '7+ Hours Per Day' },
  ];

  const experienceLevels = [
    { value: 'Beginner', label: 'Beginner (No Prior Knowledge)' },
    { value: 'Intermediate', label: 'Intermediate (Some Foundation)' },
    { value: 'Advanced', label: 'Advanced (Experienced)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200/60 rounded-[12px] p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-slate-950 tracking-tight">Create AI Roadmap Plan</h2>
        <p className="text-[10px] text-slate-700 font-medium">
          Enter your objective, schedule details, and let LifeSaver strategist map out the roadmap.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200/60 rounded-[8px] flex items-start gap-2 text-rose-800 text-[10.5px] font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Goal Title */}
        <div className="space-y-1.5">
          <label htmlFor="goal-title" className="text-[10px] font-semibold text-slate-750 uppercase tracking-wider">
            What Is Your Objective?
          </label>
          <input
            id="goal-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Crack TCS NQT in 30 days"
            className="w-full px-3 py-2 text-xs bg-[#fcfbf9] border border-slate-200 rounded-[8px] focus:outline-none focus:border-slate-400 transition-colors disabled:opacity-50 text-slate-900 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="goal-category" className="text-[10px] font-semibold text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-slate-500" />
              Category
            </label>
            <select
              id="goal-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs bg-[#fcfbf9] border border-slate-200 rounded-[8px] focus:outline-none focus:border-slate-400 transition-colors disabled:opacity-50 text-slate-900 font-semibold cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Date */}
          <div className="space-y-1.5">
            <label htmlFor="goal-target-date" className="text-[10px] font-semibold text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Target Achievement Date
            </label>
            <input
              id="goal-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs bg-[#fcfbf9] border border-slate-200 rounded-[8px] focus:outline-none focus:border-slate-400 transition-colors disabled:opacity-50 text-slate-900 font-medium cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hours Per Day */}
          <div className="space-y-1.5">
            <label htmlFor="goal-hours" className="text-[10px] font-semibold text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Daily Study / Work Capacity
            </label>
            <select
              id="goal-hours"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs bg-[#fcfbf9] border border-slate-200 rounded-[8px] focus:outline-none focus:border-slate-400 transition-colors disabled:opacity-50 text-slate-900 font-semibold cursor-pointer"
            >
              {hoursOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level */}
          <div className="space-y-1.5">
            <label htmlFor="goal-experience" className="text-[10px] font-semibold text-slate-750 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              Starting Skill / Knowledge Level
            </label>
            <select
              id="goal-experience"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs bg-[#fcfbf9] border border-slate-200 rounded-[8px] focus:outline-none focus:border-slate-400 transition-colors disabled:opacity-50 text-slate-900 font-semibold cursor-pointer"
            >
              {experienceLevels.map((el) => (
                <option key={el.value} value={el.value}>
                  {el.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-[8px] bg-slate-950 text-white text-[11px] font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2"
      >
        {isLoading ? 'Formulating AI Strategic Plan...' : 'Generate AI Execution Plan'}
      </button>
    </form>
  );
};
export default PlannerForm;
