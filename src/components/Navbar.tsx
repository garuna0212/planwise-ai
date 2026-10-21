import React from 'react';
import {
  Sparkles,
  Calendar,
  PlusCircle,
  Download,
  Printer,
  CheckCircle2,
  FolderOpen,
  IndianRupee,
} from 'lucide-react';
import { PlanWisePlan } from '../types/planwise.ts';
import { formatCompactINR, formatDate, getDaysUntil } from '../utils/formatters.ts';

interface NavbarProps {
  currentPlan: PlanWisePlan;
  savedPlans: PlanWisePlan[];
  onSelectPlan: (plan: PlanWisePlan) => void;
  onOpenCreateModal: () => void;
  onExportJSON: () => void;
  onOpenTestModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  savedPlans,
  onSelectPlan,
  onOpenCreateModal,
  onExportJSON,
  onOpenTestModal,
}) => {
  const daysUntil = getDaysUntil(currentPlan.input.date);

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  PlanWise <span className="text-indigo-600">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Smart Event Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Context-Aware Celebration & Budget Planner
              </p>
            </div>
          </div>

          {/* Active Plan Selector & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Plan Switcher Dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs sm:text-sm font-medium text-slate-700 transition cursor-pointer border border-slate-200">
                <FolderOpen className="w-4 h-4 text-slate-500" />
                <span className="max-w-[130px] sm:max-w-[200px] truncate font-semibold">
                  {currentPlan.input.title}
                </span>
                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                  {formatCompactINR(currentPlan.input.budgetINR)}
                </span>
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover:block hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Celebration Plan
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {savedPlans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPlan(p)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/80 transition ${
                        p.id === currentPlan.id ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{p.input.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {p.input.city} • {formatDate(p.input.date)}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-slate-500">
                        {formatCompactINR(p.input.budgetINR)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Suite Runner Button */}
            <button
              onClick={onOpenTestModal}
              title="Run Automated Tests (Budget, Date & Rules)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">Run Tests</span>
            </button>

            {/* Print / Export */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrint}
                title="Print or Save PDF"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onExportJSON}
                title="Export Plan as JSON"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Create New Plan Button */}
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-300 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
