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
  const [selectedPhaseId, setSelectedPhaseId] = useState(plan.timeline[0]?.id || '');
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    [plan.timeline[0]?.id || '']: true,
    [plan.timeline[1]?.id || '']: true,
  });

  // Calculate overall task stats
  const allTasks = plan.timeline.flatMap((p) => p.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Preparation Countdown & Milestones
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                daysUntil < 7
                  ? 'bg-rose-100 text-rose-800'
                  : daysUntil < 30
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {daysUntil < 0
                ? 'Event Passed'
                : daysUntil === 0
                ? 'Today is Celebration Day!'
                : `${daysUntil} Days Remaining`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Target Event Date: <strong className="text-slate-800">{formatDate(plan.input.date)}</strong> • Structured backward from celebration day
          </p>
        </div>

        {/* Overall Completion Progress */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/60 self-start md:self-auto">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-700">
              {completedTasks} of {totalTasks} Tasks Completed
            </div>
            <div className="text-[11px] text-slate-500">
              {progressPercent}% Preparation Velocity
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Add Custom Task Form */}
      <form
        onSubmit={handleAddTask}
        className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3"
      >
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Add a new custom preparation task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
        <select
          value={selectedPhaseId}
          onChange={(e) => setSelectedPhaseId(e.target.value)}
          className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700"
        >
          {plan.timeline.map((phase) => (
            <option key={phase.id} value={phase.id}>
              {phase.timeframe}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </form>

      {/* Timeline Phases List */}
      <div className="space-y-4">
        {plan.timeline.map((phase, phaseIdx) => {
          const isExpanded = expandedPhases[phase.id] ?? true;
          const phaseCompleted = phase.tasks.every((t) => t.completed);
          const phaseTaskCount = phase.tasks.length;
          const phaseDoneCount = phase.tasks.filter((t) => t.completed).length;

          const isOverdue = phase.status === 'overdue' && !phaseCompleted;

          return (
            <div
              key={phase.id}
              className={`bg-white rounded-2xl border transition overflow-hidden shadow-xs ${
                isOverdue
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : phaseCompleted
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Phase Header */}
              <button
                type="button"
                onClick={() => togglePhaseExpand(phase.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      phaseCompleted
                        ? 'bg-emerald-600 text-white'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {phaseCompleted ? <CheckCircle2 className="w-5 h-5" /> : phaseIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {phase.timeframe}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          phaseCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {phaseCompleted ? 'All Done' : isOverdue ? 'Action Needed' : 'Scheduled'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Target Milestone Date: {formatDate(phase.targetDate)} • {phaseDoneCount}/{phaseTaskCount} Tasks Done
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-xs font-mono text-slate-400">
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
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-2">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(phase.id, task.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                        task.completed
                          ? 'bg-slate-50 border-slate-200/60 opacity-60'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-600">{task.category}</span>
                            {task.dueDate && <span>• Due: {formatDate(task.dueDate)}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-50 text-rose-700'
                              : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
