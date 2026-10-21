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
  MessageSquare,
  Share2,
  Trash2,
  Copy,
} from 'lucide-react';
import { Navbar } from './components/Navbar.tsx';
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
import { formatINR, formatCompactINR, formatDate, getDaysUntil } from './utils/formatters.ts';

type ActiveTab = 'budget' | 'creative' | 'timeline' | 'vendors' | 'warnings';

export const App: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<PlanWisePlan>(loadActivePlan);
  const [savedPlans, setSavedPlans] = useState<PlanWisePlan[]>(getSavedPlansList);
  const [activeTab, setActiveTab] = useState<ActiveTab>('budget');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuickTuning, setShowQuickTuning] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    saveActivePlan(currentPlan);
    setSavedPlans(getSavedPlansList());
  }, [currentPlan]);

  const handleUpdatePlan = (updated: PlanWisePlan) => {
    setCurrentPlan(updated);
  };

  const handleSelectPlan = (plan: PlanWisePlan) => {
    setCurrentPlan(plan);
  };

  // Immediate deterministic recalculation when any input changes
  const handleInlineParamChange = (field: string, value: any) => {
    const patch = { [field]: value };
    const updated = recalculatePlan(currentPlan, patch);
    setCurrentPlan(updated);
  };

  const handleCreateNewPlan = async (input: PlanInput, useGeminiAI: boolean) => {
    setIsGenerating(true);
    try {
      let aiInsightsOverride = null;

      if (useGeminiAI) {
        // Call backend server endpoint
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

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.error('Error creating plan:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const daysUntil = getDaysUntil(currentPlan.input.date);
  const warningCount = currentPlan.warnings.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        currentPlan={currentPlan}
        savedPlans={savedPlans}
        onSelectPlan={handleSelectPlan}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onExportJSON={() => exportPlanAsJSON(currentPlan)}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Event Hero Header */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {currentPlan.input.eventType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {currentPlan.input.venuePreference}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    daysUntil < 7
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {daysUntil < 0
                    ? 'Past Event'
                    : daysUntil === 0
                    ? 'Celebration Day Today!'
                    : `${daysUntil} Days Remaining`}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {currentPlan.input.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatDate(currentPlan.input.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{currentPlan.input.city}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{currentPlan.input.guestCount} Guests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-800">
                    {formatINR(currentPlan.input.budgetINR)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <button
                onClick={() => setShowQuickTuning(!showQuickTuning)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition ${
                  showQuickTuning
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>⚡ Instant Recalculation Tuning</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 hover:opacity-95 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask AI Planner</span>
              </button>
            </div>
          </div>

          {/* Quick Context Tuning Panel (Immediately recalculates on change) */}
          {showQuickTuning && (
            <div className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/80 p-4 rounded-2xl animate-in fade-in duration-150">
              {/* Budget input with quick increments */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Total Budget (INR)
                </label>
                <div className="flex items-center gap-1">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min="1000"
                      step="10000"
                      value={currentPlan.input.budgetINR || ''}
                      onChange={(e) =>
                        handleInlineParamChange('budgetINR', Number(e.target.value))
                      }
                      className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Guest Count input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Guest Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="25000"
                  value={currentPlan.input.guestCount}
                  onChange={(e) =>
                    handleInlineParamChange('guestCount', Number(e.target.value))
                  }
                  className="w-full px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Event Type
                </label>
                <select
                  value={currentPlan.input.eventType}
                  onChange={(e) =>
                    handleInlineParamChange('eventType', e.target.value)
                  }
                  className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800"
                >
                  <option value="wedding">Wedding</option>
                  <option value="birthday">Birthday</option>
                  <option value="community">Community</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="corporate">Corporate</option>
                  <option value="festival">Festival</option>
                </select>
              </div>

              {/* Venue Preference */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Venue Setting
                </label>
                <select
                  value={currentPlan.input.venuePreference}
                  onChange={(e) =>
                    handleInlineParamChange('venuePreference', e.target.value)
                  }
                  className="w-full px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={currentPlan.input.date}
                  onChange={(e) =>
                    handleInlineParamChange('date', e.target.value)
                  }
                  className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Warnings Banner on top of all views */}
        <WarningsBanner warnings={currentPlan.warnings} />

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 no-print">
          <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setActiveTab('budget')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === 'budget'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Budget Allocation</span>
              <span className="text-xs px-1.5 py-0.2 bg-slate-100 rounded-md font-mono text-slate-600">
                100%
              </span>
            </button>

            <button
              onClick={() => setActiveTab('creative')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === 'creative'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Creative Suite & Menu</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-md font-bold uppercase">
                AI
              </span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Timeline & Countdown</span>
              <span className="text-xs px-1.5 py-0.2 bg-slate-100 rounded-md font-mono text-slate-600">
                {daysUntil}d
              </span>
            </button>

            <button
              onClick={() => setActiveTab('vendors')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === 'vendors'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Vendor Checklist</span>
              <span className="text-xs px-1.5 py-0.2 bg-slate-100 rounded-md font-mono text-slate-600">
                {currentPlan.vendors.filter((v) => v.status === 'booked').length}/
                {currentPlan.vendors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('warnings')}
              className={`py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                activeTab === 'warnings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Planning Advisory</span>
              {warningCount > 0 && (
                <span className="text-xs px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold">
                  {warningCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
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
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Complete Planning & Feasibility Analysis
              </h3>
              <p className="text-xs text-slate-500">
                PlanWise AI constantly computes feasibility metrics including guest-to-budget ratios, monsoon rainfall risks, and vendor lead-times.
              </p>
              <WarningsBanner warnings={currentPlan.warnings} />
            </div>
          )}
        </div>
      </main>

      {/* Floating AI Assistant Trigger */}
      <div className="fixed bottom-6 right-6 z-30 no-print">
        <button
          onClick={() => setIsChatOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-xl shadow-indigo-300 hover:scale-105 active:scale-95 transition"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="font-bold text-sm hidden sm:inline">Ask AI Planner</span>
        </button>
      </div>

      {/* Modals & Drawers */}
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
