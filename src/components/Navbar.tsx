import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  PlusCircle,
  Download,
  Printer,
  CheckCircle2,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';
import { PlanWisePlan } from '../types/planwise.ts';
import { formatCompactINR, formatDate } from '../utils/formatters.ts';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key for accessible PC and mobile navigation
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  PlanWise <span className="text-indigo-600">AI</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Smart Event Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden lg:block">
                Context-Aware Celebration & Budget Planner
              </p>
            </div>
          </div>

          {/* Active Plan Selector & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Plan Switcher Dropdown (Click & Tap enabled for PC + Mobile) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 transition cursor-pointer border border-slate-200 select-none"
              >
                <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
                <span className="max-w-[100px] sm:max-w-[170px] md:max-w-[220px] truncate font-semibold text-slate-800">
                  {currentPlan.input.title}
                </span>
                <span className="hidden xs:inline-block text-[11px] sm:text-xs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                  {formatCompactINR(currentPlan.input.budgetINR)}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Switch Celebration Plan ({savedPlans.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {savedPlans.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectPlan(p);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-indigo-50/80 transition ${
                          p.id === currentPlan.id
                            ? 'bg-indigo-50/90 text-indigo-950 font-bold border-l-4 border-indigo-600 pl-2.5'
                            : 'text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate font-medium">{p.input.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.input.city} • {formatDate(p.input.date)}
                          </div>
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-600 shrink-0">
                          {formatCompactINR(p.input.budgetINR)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Test Suite Runner Button */}
            <button
              onClick={onOpenTestModal}
              title="Run Automated Tests (Budget, Date & Rules)"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Run Tests</span>
            </button>

            {/* Print / Export Icons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={handlePrint}
                title="Print or Save PDF"
                aria-label="Print or save PDF"
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onExportJSON}
                title="Export Plan as JSON"
                aria-label="Export Plan as JSON"
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Create New Plan Button */}
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-300 transition shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline">New Event</span>
              <span className="xs:hidden">New</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
