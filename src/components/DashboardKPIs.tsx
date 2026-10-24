import React from 'react';
import {
  IndianRupee,
  Users,
  Calendar,
  CheckSquare,
  ShieldCheck,
  Building,
  TrendingUp,
} from 'lucide-react';
import { PlanWisePlan } from '../types/planwise.ts';
import { formatINR, formatDate, getDaysUntil } from '../utils/formatters.ts';

interface DashboardKPIsProps {
  plan: PlanWisePlan;
  onNavigateToTab?: (tab: 'budget' | 'creative' | 'timeline' | 'vendors' | 'warnings') => void;
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
  plan,
  onNavigateToTab,
}) => {
  const daysUntil = getDaysUntil(plan.input.date);

  // Vendor calculations
  const totalVendors = plan.vendors.length;
  const bookedVendors = plan.vendors.filter((v) => v.status === 'booked').length;

  // Task calculations
  const allTasks = plan.timeline.flatMap((p) => p.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;

  // Blended progress calculation
  const totalMilestones = totalVendors + totalTasks;
  const completedMilestones = bookedVendors + completedTasks;
  const overallProgress =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* KPI 1: Stated Budget */}
      <div
        onClick={() => onNavigateToTab?.('budget')}
        className="group bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-[#6D5EF8]/40 transition cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Budget
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9] flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
          {formatINR(plan.budget.totalINR)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
          <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
            {formatINR(plan.budget.costPerGuestINR)}
          </span>
          <span>/ guest</span>
          <span>·</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            100% Balanced
          </span>
        </div>
      </div>

      {/* KPI 2: Guest Scale & Venue */}
      <div
        onClick={() => onNavigateToTab?.('creative')}
        className="group bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-[#6D5EF8]/40 transition cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Guest Scale
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
          {plan.input.guestCount}{' '}
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Guests
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize truncate">
          <span>{plan.input.venuePreference}</span>
          <span> · </span>
          <span>{plan.input.city}</span>
          <span> · </span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {plan.input.eventType}
          </span>
        </div>
      </div>

      {/* KPI 3: Days Remaining */}
      <div
        onClick={() => onNavigateToTab?.('timeline')}
        className="group bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-[#6D5EF8]/40 transition cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Countdown
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
          {daysUntil < 0 ? (
            'Past Event'
          ) : daysUntil === 0 ? (
            <span className="text-[#6D5EF8]">Today!</span>
          ) : (
            <>
              {daysUntil}{' '}
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Days
              </span>
            </>
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
          <span>Target: </span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatDate(plan.input.date)}
          </span>
        </div>
      </div>

      {/* KPI 4: Checklist & Vendor Progress */}
      <div
        onClick={() => onNavigateToTab?.('vendors')}
        className="group bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-[#6D5EF8]/40 transition cursor-pointer"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Checklist Progress
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {overallProgress}%
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {bookedVendors}/{totalVendors} vendors
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
          <div
            className="h-full bg-[#6D5EF8] transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
