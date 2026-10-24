import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  PieChart,
  Palette,
  CheckSquare,
  Building,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Check,
} from 'lucide-react';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardKPIs } from './components/DashboardKPIs.tsx';
import { BudgetDashboard } from './components/BudgetDashboard.tsx';
import { WarningsBanner } from './components/WarningsBanner.tsx';
import { TimelineTracker } from './components/TimelineTracker.tsx';
import { VendorChecklist } from './components/VendorChecklist.tsx';
import { AICreativeSuite } from './components/AICreativeSuite.tsx';
import { AIChatDrawer } from './components/AIChatDrawer.tsx';
import { EventCreationModal } from './components/EventCreationModal.tsx';
import { TestRunnerModal } from './components/TestRunnerModal.tsx';
import { PlanWisePlan, PlanInput } from './types/planwise.ts';
import {
  loadActivePlan,
  saveActivePlan,
  getSavedPlansList,
  exportPlanAsJSON,
  createPlanObject,
} from './utils/storage.ts';
import { recalculatePlan } from './utils/planningEngine.ts';
import { formatINR, formatDate, getDaysUntil } from './utils/formatters.ts';

export const App: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<PlanWisePlan>(loadActivePlan);
  const [savedPlans, setSavedPlans] = useState<PlanWisePlan[]>(getSavedPlansList);
  const [activeTab, setActiveTab] = useState<ActiveTab>('budget');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuickTuning, setShowQuickTuning] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Theme Management
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('planwise_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('planwise_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('planwise_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    setAnnouncement(`Switched to ${!isDarkMode ? 'dark' : 'light'} theme`);
  };

  // Sync current plan to localStorage
  useEffect(() => {
    saveActivePlan(currentPlan);
    setSavedPlans(getSavedPlansList());
  }, [currentPlan]);

  const handleUpdatePlan = (updated: PlanWisePlan) => {
    setCurrentPlan(updated);
  };

  const handleSelectPlan = (plan: PlanWisePlan) => {
    setCurrentPlan(plan);
    setAnnouncement(`Switched active event to ${plan.input.title}`);
  };

  // Immediate deterministic recalculation when any tuning parameter changes
  const handleInlineParamChange = (field: string, value: any) => {
    const patch = { [field]: value };
    const updated = recalculatePlan(currentPlan, patch);
    setCurrentPlan(updated);
    setAnnouncement(`Updated ${field}. Total budget is ${formatINR(updated.budget.totalINR)}.`);
  };

  const handleCreateNewPlan = async (input: PlanInput, useGeminiAI: boolean) => {
    setIsGenerating(true);
    try {
      let aiInsightsOverride = null;

      if (useGeminiAI) {
        try {
          const res = await fetch('/api/gemini/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input,
              budget: {
                totalINR: input.budgetINR,
                guestCount: input.guestCount,
              },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.insights) {
              aiInsightsOverride = data.insights;
            }
          }
        } catch (err) {
          console.warn('Backend AI generation fell back to deterministic generator:', err);
        }
      }

      const newPlan = createPlanObject(input, undefined, aiInsightsOverride);
      setCurrentPlan(newPlan);
      setIsCreateModalOpen(false);
      setAnnouncement(`Created new celebration plan: ${newPlan.input.title}`);

      // Check prefers-reduced-motion before firing confetti
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (e) {
      console.error('Error creating plan:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'budget':
        return {
          title: 'Budget Allocation',
          subtitle: 'Deterministic 100% distribution with category sliders and zero rounding error',
        };
      case 'creative':
        return {
          title: 'Creative Direction & Menu',
          subtitle: 'AI synthesized theme narrative, color palette swatches, and multi-course culinary plan',
        };
      case 'timeline':
        return {
          title: 'Preparation Timeline',
          subtitle: 'Countdown milestones structured backward from celebration day',
        };
      case 'vendors':
        return {
          title: 'Vendor Checklist',
          subtitle: 'Live vendor quotes, booking pipeline, and payment tracking',
        };
      case 'warnings':
        return {
          title: 'Planning Advisory & Feasibility',
          subtitle: 'Continuous audit of budget-to-guest ratio, monsoon weather, and vendor lead times',
        };
    }
  };

  const currentTabMeta = getTabTitle(activeTab);
  const warningCount = currentPlan.warnings.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Screen Reader Live Announcement Region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Sidebar Navigation (Desktop fixed + Mobile sliding drawer) */}
      <Sidebar
        currentPlan={currentPlan}
        savedPlans={savedPlans}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setAnnouncement(`Switched to tab ${getTabTitle(tab).title}`);
        }}
        onSelectPlan={handleSelectPlan}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenTestModal={() => setIsTestModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        warningCount={warningCount}
      />

      {/* Main Content Area (Offset by Sidebar on Large Screens) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <Header
          pageTitle={currentTabMeta.title}
          pageSubtitle={currentTabMeta.subtitle}
          currentPlan={currentPlan}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          showQuickTuning={showQuickTuning}
          onToggleQuickTuning={() => {
            const next = !showQuickTuning;
            setShowQuickTuning(next);
            setAnnouncement(next ? 'Instant tuning panel opened' : 'Instant tuning panel closed');
          }}
          onOpenAIChat={() => setIsChatOpen(true)}
          onExportJSON={() => {
            exportPlanAsJSON(currentPlan);
            setAnnouncement('Exported celebration plan as JSON');
          }}
        />

        {/* Main Workspace Body */}
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
          {/* Quick Context Tuning Panel with accessible label associations */}
          {showQuickTuning && (
            <section
              aria-label="Instant Parameter Tuning Panel"
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-[#6D5EF8]/30 dark:border-[#6D5EF8]/40 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#6D5EF8]" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Instant Parameter Tuning
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    (Recalculates budget, timelines, and advisories immediately)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickTuning(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-[#6D5EF8] rounded-md px-1.5 py-0.5"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* Budget */}
                <div>
                  <label
                    htmlFor="tuning-budget"
                    className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1"
                  >
                    Total Budget (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold" aria-hidden="true">₹</span>
                    <input
                      id="tuning-budget"
                      type="number"
                      min="1000"
                      step="10000"
                      value={currentPlan.input.budgetINR || ''}
                      onChange={(e) =>
                        handleInlineParamChange('budgetINR', Number(e.target.value))
                      }
                      className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
                    />
                  </div>
                </div>

                {/* Guest Count */}
                <div>
                  <label
                    htmlFor="tuning-guests"
                    className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1"
                  >
                    Guest Count
                  </label>
                  <input
                    id="tuning-guests"
                    type="number"
                    min="1"
                    max="25000"
                    value={currentPlan.input.guestCount}
                    onChange={(e) =>
                      handleInlineParamChange('guestCount', Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label
                    htmlFor="tuning-event-type"
                    className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1"
                  >
                    Event Type
                  </label>
                  <select
                    id="tuning-event-type"
                    value={currentPlan.input.eventType}
                    onChange={(e) =>
                      handleInlineParamChange('eventType', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
                  >
                    <option value="wedding">Wedding</option>
                    <option value="birthday">Birthday</option>
                    <option value="community">Community</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="corporate">Corporate</option>
                    <option value="festival">Festival</option>
                  </select>
                </div>

                {/* Venue Setting */}
                <div>
                  <label
                    htmlFor="tuning-venue-preference"
                    className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1"
                  >
                    Venue Setting
                  </label>
                  <select
                    id="tuning-venue-preference"
                    value={currentPlan.input.venuePreference}
                    onChange={(e) =>
                      handleInlineParamChange('venuePreference', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Event Date */}
                <div>
                  <label
                    htmlFor="tuning-event-date"
                    className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1"
                  >
                    Event Date
                  </label>
                  <input
                    id="tuning-event-date"
                    type="date"
                    value={currentPlan.input.date}
                    onChange={(e) =>
                      handleInlineParamChange('date', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 4 Dashboard Summary KPI Cards */}
          <DashboardKPIs
            plan={currentPlan}
            onNavigateToTab={(tab) => {
              setActiveTab(tab);
              setAnnouncement(`Navigated to ${getTabTitle(tab).title}`);
            }}
          />

          {/* Warnings Banner (Always visible if active advisories exist) */}
          <WarningsBanner warnings={currentPlan.warnings} />

          {/* Active Tab Workspace Display with semantic role="tabpanel" */}
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
            className="pt-1 outline-hidden"
          >
            {activeTab === 'budget' && (
              <BudgetDashboard
                plan={currentPlan}
                onUpdatePlan={handleUpdatePlan}
              />
            )}

            {activeTab === 'creative' && (
              <AICreativeSuite plan={currentPlan} />
            )}

            {activeTab === 'timeline' && (
              <TimelineTracker
                plan={currentPlan}
                onUpdatePlan={handleUpdatePlan}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorChecklist
                plan={currentPlan}
                onUpdatePlan={handleUpdatePlan}
              />
            )}

            {activeTab === 'warnings' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Complete Planning & Feasibility Analysis
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Continuous real-time verification of budget feasibility, city monsoon alerts, and vendor lead times.
                    </p>
                  </div>
                </div>
                <WarningsBanner warnings={currentPlan.warnings} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Trigger (Bottom right on all viewports) */}
      <div className="fixed bottom-6 right-6 z-30 no-print">
        <button
          onClick={() => setIsChatOpen(true)}
          aria-label="Open PlanWise AI Assistant"
          className="group flex items-center gap-2.5 px-4 py-3 bg-[#6D5EF8] hover:bg-[#5B4CE6] text-white rounded-full shadow-lg shadow-[#6D5EF8]/30 hover:scale-105 active:scale-95 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6D5EF8]"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold text-sm hidden sm:inline">Ask AI Planner</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible on mobile viewports) */}
      <nav
        role="tablist"
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 flex items-center justify-around no-print"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'budget'}
          aria-label="Budget Allocation Tab"
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8] ${
            activeTab === 'budget'
              ? 'text-[#6D5EF8] dark:text-[#9B8FF9]'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <PieChart className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>Budget</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'creative'}
          aria-label="Creative Suite Tab"
          onClick={() => setActiveTab('creative')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8] ${
            activeTab === 'creative'
              ? 'text-[#6D5EF8] dark:text-[#9B8FF9]'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Palette className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>Creative</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'timeline'}
          aria-label="Preparation Timeline Tab"
          onClick={() => setActiveTab('timeline')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8] ${
            activeTab === 'timeline'
              ? 'text-[#6D5EF8] dark:text-[#9B8FF9]'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>Timeline</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'vendors'}
          aria-label="Vendor Checklist Tab"
          onClick={() => setActiveTab('vendors')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8] ${
            activeTab === 'vendors'
              ? 'text-[#6D5EF8] dark:text-[#9B8FF9]'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Building className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>Vendors</span>
        </button>

        <button
          type="button"
          aria-label="Open PlanWise AI Assistant Chat"
          onClick={() => setIsChatOpen(true)}
          className="flex flex-col items-center py-1 px-2 text-[10px] font-semibold text-[#6D5EF8] dark:text-[#9B8FF9] focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
        >
          <Sparkles className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>AI Chat</span>
        </button>
      </nav>

      {/* Modals & AI Assistant Drawer */}
      <EventCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePlan={handleCreateNewPlan}
        isGenerating={isGenerating}
      />

      <TestRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      <AIChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        plan={currentPlan}
        onUpdatePlan={handleUpdatePlan}
      />
    </div>
  );
};
