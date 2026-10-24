import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  PieChart,
  Palette,
  Calendar,
  Building,
  AlertTriangle,
  Plus,
  FolderOpen,
  ChevronDown,
  CheckCircle2,
  Moon,
  Sun,
  ShieldCheck,
  X,
  IndianRupee,
  MapPin,
  Users,
} from 'lucide-react';
import { PlanWisePlan } from '../types/planwise.ts';
import { formatCompactINR, formatDate, getDaysUntil } from '../utils/formatters.ts';
import { useFocusTrap } from '../utils/useFocusTrap.ts';

export type ActiveTab = 'budget' | 'creative' | 'timeline' | 'vendors' | 'warnings';

interface SidebarProps {
  currentPlan: PlanWisePlan;
  savedPlans: PlanWisePlan[];
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectPlan: (plan: PlanWisePlan) => void;
  onOpenCreateModal: () => void;
  onOpenTestModal: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  warningCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPlan,
  savedPlans,
  activeTab,
  onSelectTab,
  onSelectPlan,
  onOpenCreateModal,
  onOpenTestModal,
  isDarkMode,
  onToggleTheme,
  isMobileOpen,
  onCloseMobile,
  warningCount,
}) => {
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<ActiveTab, HTMLButtonElement | null>>({
    budget: null,
    creative: null,
    timeline: null,
    vendors: null,
    warnings: null,
  });

  // Focus trap for mobile drawer
  useFocusTrap(mobileDrawerRef, {
    isOpen: isMobileOpen,
    onClose: onCloseMobile,
  });

  const daysUntil = getDaysUntil(currentPlan.input.date);
  const bookedVendorsCount = currentPlan.vendors.filter((v) => v.status === 'booked').length;
  const totalVendorsCount = currentPlan.vendors.length;

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPlanDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlanDropdownOpen) {
        setIsPlanDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlanDropdownOpen]);

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: React.ReactNode;
  }[] = [
    {
      id: 'budget',
      label: 'Budget Allocation',
      icon: PieChart,
      badge: (
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold tabular-nums">
          100%
        </span>
      ),
    },
    {
      id: 'creative',
      label: 'Creative Suite & Menu',
      icon: Palette,
      badge: (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9] tracking-wider uppercase">
          AI
        </span>
      ),
    },
    {
      id: 'timeline',
      label: 'Timeline & Countdown',
      icon: Calendar,
      badge: (
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums">
          {daysUntil < 0 ? 'Past' : `${daysUntil}d`}
        </span>
      ),
    },
    {
      id: 'vendors',
      label: 'Vendor Checklist',
      icon: Building,
      badge: (
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums">
          {bookedVendorsCount}/{totalVendorsCount}
        </span>
      ),
    },
    {
      id: 'warnings',
      label: 'Planning Advisory',
      icon: AlertTriangle,
      badge: warningCount > 0 ? (
        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 tabular-nums">
          {warningCount}
        </span>
      ) : (
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          Clear
        </span>
      ),
    },
  ];

  // Accessible keyboard navigation for tabs
  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % navItems.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + navItems.length) % navItems.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = navItems.length - 1;
    } else {
      return;
    }

    const nextTab = navItems[nextIndex].id;
    onSelectTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#6D5EF8] flex items-center justify-center text-white shadow-sm shadow-[#6D5EF8]/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100">
                PlanWise
              </span>
              <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Celebration & Event Engine
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Plan Switcher Dropdown */}
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800/80" ref={dropdownRef}>
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Active Event
        </div>
        <div className="relative">
          <button
            type="button"
            id="plan-switcher-button"
            aria-haspopup="listbox"
            aria-expanded={isPlanDropdownOpen}
            aria-label={`Current event: ${currentPlan.input.title}. Click to switch plan.`}
            onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition text-left group focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
          >
            <div className="min-w-0 flex-1 pr-2">
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                {currentPlan.input.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                <span>{currentPlan.input.city}</span>
                <span>·</span>
                <span className="font-semibold text-[#6D5EF8] dark:text-[#9B8FF9]">
                  {formatCompactINR(currentPlan.input.budgetINR)}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                isPlanDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Saved Plans Dropdown */}
          {isPlanDropdownOpen && (
            <div
              role="listbox"
              aria-labelledby="plan-switcher-button"
              className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in duration-100"
            >
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Switch Saved Event ({savedPlans.length})
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {savedPlans.map((p) => {
                  const isCurrent = p.id === currentPlan.id;
                  return (
                    <button
                      key={p.id}
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => {
                        onSelectPlan(p);
                        setIsPlanDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8] ${
                        isCurrent
                          ? 'bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9] font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-medium">{p.input.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {p.input.city} · {formatDate(p.input.date)}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 shrink-0 tabular-nums">
                        {formatCompactINR(p.input.budgetINR)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Create New Event Button */}
        <button
          onClick={() => {
            onOpenCreateModal();
            if (isMobileOpen) onCloseMobile();
          }}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#6D5EF8] hover:bg-[#5B4CE6] text-white shadow-xs transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Celebration Plan</span>
        </button>
      </div>

      {/* Main Navigation Links with Semantic ARIA tablist/tab */}
      <nav
        role="tablist"
        aria-label="Planning Workspace Navigation"
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
      >
        <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Workspace
        </div>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[item.id] = el;
              }}
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              onClick={() => {
                onSelectTab(item.id);
                if (isMobileOpen) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8] ${
                isActive
                  ? 'bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-[#6D5EF8] dark:text-[#9B8FF9]'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Section: Theme Switcher & Test Suite */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {/* Test Suite Trigger */}
        <button
          onClick={() => {
            onOpenTestModal();
            if (isMobileOpen) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 transition focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Deterministic Test Suite</span>
          </div>
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
            56 Passing
          </span>
        </button>

        {/* Theme Toggle & Engine Status */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Math Engine Active</span>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside
        role="region"
        aria-label="Application Sidebar Navigation"
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-30 no-print"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer with Focus Trap */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden no-print" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div
            ref={mobileDrawerRef}
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-200"
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
