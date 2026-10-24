import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PlanWisePlan, TimelinePhase, TimelineTask } from '../types/planwise.ts';
import { formatDate, getDaysUntil } from '../utils/formatters.ts';

interface TimelineTrackerProps {
  plan: PlanWisePlan;
  onUpdatePlan: (updatedPlan: PlanWisePlan) => void;
}

export const TimelineTracker: React.FC<TimelineTrackerProps> = ({
  plan,
  onUpdatePlan,
}) => {
  const daysUntil = getDaysUntil(plan.input.date);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'urgent_overdue' | 'pending' | 'completed'>('all');
  const [selectedPhaseId, setSelectedPhaseId] = useState(plan.timeline[0]?.id || '');
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    [plan.timeline[0]?.id || '']: true,
    [plan.timeline[1]?.id || '']: true,
  });

  // Calculate overall task stats with urgency and overdue detection
  const allTasks = plan.timeline.flatMap((p) =>
    p.tasks.map((t) => {
      const taskDaysUntil = t.dueDate ? getDaysUntil(t.dueDate) : daysUntil;
      const isTaskOverdue = !t.completed && taskDaysUntil < 0;
      const isTaskUrgent = !t.completed && taskDaysUntil >= 0 && taskDaysUntil <= 7;
      return { ...t, phaseId: p.id, isTaskOverdue, isTaskUrgent, taskDaysUntil };
    })
  );

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const overdueTasksCount = allTasks.filter((t) => t.isTaskOverdue).length;
  const urgentTasksCount = allTasks.filter((t) => t.isTaskUrgent).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const toggleTask = (phaseId: string, taskId: string) => {
    const updatedTimeline = plan.timeline.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map((task) => {
          if (task.id !== taskId) return task;
          return { ...task, completed: !task.completed };
        }),
      };
    });

    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      timeline: updatedTimeline,
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TimelineTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: 'Custom',
      completed: false,
      priority: 'medium',
      dueDate: plan.input.date,
    };

    const updatedTimeline = plan.timeline.map((phase) => {
      if (phase.id === selectedPhaseId) {
        return {
          ...phase,
          tasks: [...phase.tasks, newTask],
        };
      }
      return phase;
    });

    setNewTaskTitle('');
    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      timeline: updatedTimeline,
    });
  };

  const togglePhaseExpand = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Preparation Countdown & Milestones
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                daysUntil < 7
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                  : daysUntil < 30
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]'
              }`}
            >
              {daysUntil < 0
                ? 'Event Passed'
                : daysUntil === 0
                ? 'Today is Celebration Day!'
                : `${daysUntil} Days Remaining`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Target Event Date: <strong className="text-slate-800 dark:text-slate-200">{formatDate(plan.input.date)}</strong> · Structured backward from celebration day
          </p>
        </div>

        {/* Overall Completion Progress */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start md:self-auto">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {completedTasks} of {totalTasks} Tasks Completed
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {progressPercent}% Preparation Velocity
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Urgency Alert Banner */}
      {(overdueTasksCount > 0 || urgentTasksCount > 0) && (
        <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <strong>Action Required:</strong>{' '}
              {overdueTasksCount > 0 && `${overdueTasksCount} overdue milestone${overdueTasksCount > 1 ? 's' : ''}`}{' '}
              {overdueTasksCount > 0 && urgentTasksCount > 0 && 'and '}{' '}
              {urgentTasksCount > 0 && `${urgentTasksCount} task${urgentTasksCount > 1 ? 's' : ''} due in under 7 days`}.
            </div>
          </div>
          <button
            onClick={() => setTaskFilter((prev) => (prev === 'urgent_overdue' ? 'all' : 'urgent_overdue'))}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs self-start sm:self-auto transition shrink-0 shadow-xs"
          >
            {taskFilter === 'urgent_overdue' ? 'Show All Tasks' : 'Filter Urgent & Overdue'}
          </button>
        </div>
      )}

      {/* Task Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setTaskFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              taskFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Milestones ({totalTasks})
          </button>
          <button
            onClick={() => setTaskFilter('urgent_overdue')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
              taskFilter === 'urgent_overdue'
                ? 'bg-rose-600 text-white'
                : 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60'
            }`}
          >
            <span>⚠️ Urgent / Overdue</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
              {overdueTasksCount + urgentTasksCount}
            </span>
          </button>
          <button
            onClick={() => setTaskFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              taskFilter === 'pending'
                ? 'bg-[#6D5EF8] text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Pending ({totalTasks - completedTasks})
          </button>
          <button
            onClick={() => setTaskFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              taskFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Completed ({completedTasks})
          </button>
        </div>
      </div>

      {/* Add Custom Task Form */}
      <form
        onSubmit={handleAddTask}
        aria-label="Add custom milestone task"
        className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3"
      >
        <div className="flex-1 w-full">
          <label htmlFor="new-task-title-input" className="sr-only">
            Custom Task Description
          </label>
          <input
            id="new-task-title-input"
            type="text"
            placeholder="Add a new custom preparation task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#6D5EF8] focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
          />
        </div>
        <div>
          <label htmlFor="new-task-phase-select" className="sr-only">
            Milestone Phase
          </label>
          <select
            id="new-task-phase-select"
            value={selectedPhaseId}
            onChange={(e) => setSelectedPhaseId(e.target.value)}
            className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
          >
            {plan.timeline.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.timeframe}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#6D5EF8] hover:bg-[#5B4CE6] text-white rounded-xl text-xs font-semibold shadow-xs transition focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#6D5EF8]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Task</span>
        </button>
      </form>

      {/* Timeline Phases List */}
      <div className="space-y-4">
        {plan.timeline.map((phase, phaseIdx) => {
          const isExpanded = expandedPhases[phase.id] ?? true;

          const filteredTasks = phase.tasks.filter((task) => {
            const taskDaysUntil = task.dueDate ? getDaysUntil(task.dueDate) : daysUntil;
            const isOverdue = !task.completed && taskDaysUntil < 0;
            const isUrgent = !task.completed && taskDaysUntil >= 0 && taskDaysUntil <= 7;

            if (taskFilter === 'urgent_overdue') return isOverdue || isUrgent;
            if (taskFilter === 'pending') return !task.completed;
            if (taskFilter === 'completed') return task.completed;
            return true;
          });

          if (taskFilter !== 'all' && filteredTasks.length === 0) {
            return null;
          }

          const phaseCompleted = phase.tasks.every((t) => t.completed);
          const phaseTaskCount = phase.tasks.length;
          const phaseDoneCount = phase.tasks.filter((t) => t.completed).length;
          const isOverdue = phase.status === 'overdue' && !phaseCompleted;

          return (
            <div
              key={phase.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition overflow-hidden shadow-xs ${
                isOverdue
                  ? 'border-rose-300 dark:border-rose-800 ring-1 ring-rose-200 dark:ring-rose-900/40'
                  : phaseCompleted
                  ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/10'
                  : 'border-slate-200/90 dark:border-slate-800'
              }`}
            >
              {/* Phase Header */}
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={`phase-tasks-${phase.id}`}
                onClick={() => togglePhaseExpand(phase.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      phaseCompleted
                        ? 'bg-emerald-600 text-white'
                        : isOverdue
                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {phaseCompleted ? <CheckCircle2 className="w-5 h-5" /> : phaseIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                        {phase.timeframe}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          phaseCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                            : isOverdue
                            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {phaseCompleted ? 'All Done' : isOverdue ? 'Action Needed' : 'Scheduled'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Target Milestone Date: {formatDate(phase.targetDate)} · {phaseDoneCount}/{phaseTaskCount} Tasks Done
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                    {Math.round((phaseDoneCount / Math.max(1, phaseTaskCount)) * 100)}%
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Phase Tasks List */}
              {isExpanded && (
                <div id={`phase-tasks-${phase.id}`} className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {filteredTasks.map((task) => {
                    const taskDaysUntil = task.dueDate ? getDaysUntil(task.dueDate) : daysUntil;
                    const isTaskOverdue = !task.completed && taskDaysUntil < 0;
                    const isTaskUrgent = !task.completed && taskDaysUntil >= 0 && taskDaysUntil <= 7;

                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(phase.id, task.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                          task.completed
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                            : isTaskOverdue
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-200 dark:ring-rose-900/30'
                            : isTaskUrgent
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#6D5EF8]/40 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {}}
                            aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                            className="h-4 w-4 rounded border-slate-300 text-[#6D5EF8] focus:ring-[#6D5EF8] cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs sm:text-sm font-medium ${
                                  task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {task.title}
                              </span>
                              {isTaskOverdue && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                                  Overdue ({Math.abs(taskDaysUntil)}d ago)
                                </span>
                              )}
                              {isTaskUrgent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                                  Due in {taskDaysUntil}d
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">{task.category}</span>
                              {task.dueDate && <span>· Due: {formatDate(task.dueDate)}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              task.priority === 'high'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                : task.priority === 'medium'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
