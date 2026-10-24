import React, { useState } from 'react';
import {
  PieChart,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  PlanWisePlan,
  BudgetCategory,
  BudgetBreakdown,
} from '../types/planwise.ts';
import { formatINR, formatCompactINR } from '../utils/formatters.ts';
import { calculateBudgetPlan, CategoryWeights, getBaselinePercentages } from '../utils/budgetEngine.ts';
import {
  recalculatePlan,
  identifyOverspending,
} from '../utils/planningEngine.ts';

interface BudgetDashboardProps {
  plan: PlanWisePlan;
  onUpdatePlan: (updatedPlan: PlanWisePlan) => void;
}

const CATEGORY_COLORS: Record<BudgetCategory, { bg: string; text: string; bar: string; badge: string }> = {
  venue: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', bar: 'bg-amber-500', badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300' },
  catering: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', bar: 'bg-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300' },
  decorations: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-300', bar: 'bg-purple-500', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' },
  entertainment: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', bar: 'bg-blue-500', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' },
  logistics: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-800 dark:text-rose-300', bar: 'bg-rose-500', badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300' },
  contingency: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-800 dark:text-teal-300', bar: 'bg-teal-500', badge: 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300' },
};

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  plan,
  onUpdatePlan,
}) => {
  const [sliderWeights, setSliderWeights] = useState<CategoryWeights>(() => {
    const weights: any = {};
    plan.budget.categories.forEach((c) => {
      weights[c.category] = c.percentage;
    });
    return weights as CategoryWeights;
  });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<BudgetCategory | 'all'>('all');

  const overspendAnalysis = identifyOverspending(plan.budget.categories, plan.budget.totalINR);

  // Handle slider adjustment with immediate recalculation
  const handleSliderChange = (category: BudgetCategory, newPercentage: number) => {
    const updatedWeights: CategoryWeights = {
      ...sliderWeights,
      [category]: Math.max(0, Math.min(100, newPercentage)),
    };
    setSliderWeights(updatedWeights);

    const updatedPlan = recalculatePlan(plan, undefined, updatedWeights);
    onUpdatePlan(updatedPlan);
  };

  // Reset to default baseline with immediate recalculation
  const handleResetToBaseline = () => {
    const baseline = getBaselinePercentages(plan.input.eventType, plan.input.venuePreference);
    setSliderWeights(baseline);

    const updatedPlan = recalculatePlan(plan, undefined, baseline);
    onUpdatePlan(updatedPlan);
  };

  // Update actual expense for a category with immediate recalculation
  const handleUpdateActual = (category: BudgetCategory, amount: number) => {
    const safeAmount = Math.max(0, amount || 0);
    const actualsMap: Record<BudgetCategory, number> = {} as any;
    plan.budget.categories.forEach((c) => {
      actualsMap[c.category] = c.category === category ? safeAmount : c.actualSpentINR;
    });

    const updatedPlan = recalculatePlan(plan, undefined, sliderWeights, actualsMap);
    onUpdatePlan(updatedPlan);
  };

  // Sum of percentages verification
  const totalPercentageSum = Number(
    plan.budget.categories.reduce((acc, c) => acc + c.percentage, 0).toFixed(1)
  );

  const filteredCategories =
    activeCategoryFilter === 'all'
      ? plan.budget.categories
      : plan.budget.categories.filter((c) => c.category === activeCategoryFilter);

  return (
    <div className="space-y-6">
      {/* Trustworthiness & Estimation Disclosure Banner */}
      <div className="p-3.5 px-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5 text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Estimated Planning Allocation · Not a vendor quotation.</strong> Benchmarks are deterministically balanced (100% sum, ₹0 leakage). Final supplier rates require signed contracts.
          </span>
        </div>
        <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 uppercase tracking-wider self-start sm:self-auto">
          Unverified Estimate
        </span>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Stated Budget */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Stated Budget
            </span>
            <div className="p-1.5 rounded-lg bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {formatINR(plan.budget.totalINR)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>{plan.input.guestCount} Guests</span>
            <span>·</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {formatINR(plan.budget.costPerGuestINR)}/guest
            </span>
          </div>
        </div>

        {/* Metric 2: 100% Allocation Proof */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Allocation Sum
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-baseline gap-2 tabular-nums">
            <span>{formatINR(plan.budget.totalAllocatedINR)}</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              {totalPercentageSum}%
            </span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strictly distributed (₹0 rounding leakage)</span>
          </div>
        </div>

        {/* Metric 3: Actual Spent */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Actual Committed
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
            {formatINR(plan.budget.totalActualSpentINR)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {plan.budget.totalINR > 0
              ? `${Math.round(
                  (plan.budget.totalActualSpentINR / plan.budget.totalINR) * 100
                )}% of budget utilized`
              : '0% utilized'}
          </div>
        </div>

        {/* Metric 4: Remaining or Over-Budget Alert */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition ${
            plan.budget.isOverallOverBudget
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {plan.budget.isOverallOverBudget ? 'Over Budget By' : 'Remaining Cushion'}
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                plan.budget.isOverallOverBudget
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                  : 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
              }`}
            >
              {plan.budget.isOverallOverBudget ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${
              plan.budget.isOverallOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formatINR(Math.abs(plan.budget.remainingINR))}
          </div>
          <div className="text-xs mt-1">
            {plan.budget.isOverallOverBudget ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Actuals exceed total budget!
              </span>
            ) : (
              <span className="text-teal-700 dark:text-teal-300 font-medium">
                Includes ₹{plan.budget.contingencyAmountINR.toLocaleString('en-IN')} emergency contingency
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual 100% Stacked Progress Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#6D5EF8] dark:text-[#9B8FF9]" />
              <span>Deterministic 100% Category Allocation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Adjust sliders below to fine-tune allocation. Percentages auto-normalize to strictly 100.0%.
            </p>
          </div>
          <button
            onClick={handleResetToBaseline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline</span>
          </button>
        </div>

        {/* Stacked bar */}
        <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
          {plan.budget.categories.map((cat) => (
            <div
              key={cat.category}
              style={{ width: `${cat.percentage}%` }}
              className={`${CATEGORY_COLORS[cat.category].bar} h-full transition-all duration-300 relative group cursor-pointer`}
              title={`${cat.label}: ${cat.percentage}% (${formatINR(cat.allocatedINR)})`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs">
          {plan.budget.categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() =>
                setActiveCategoryFilter((prev) =>
                  prev === cat.category ? 'all' : cat.category
                )
              }
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition ${
                activeCategoryFilter === cat.category
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat.category].bar}`}
              />
              <span className="font-medium">{cat.label}</span>
              <span className="text-slate-400 dark:text-slate-500 font-mono">({cat.percentage}%)</span>
            </button>
          ))}
          {activeCategoryFilter !== 'all' && (
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className="text-xs text-[#6D5EF8] dark:text-[#9B8FF9] font-semibold hover:underline"
            >
              Show All
            </button>
          )}
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const color = CATEGORY_COLORS[cat.category];
          const isOver = cat.actualSpentINR > cat.allocatedINR;
          const variance = cat.allocatedINR - cat.actualSpentINR;

          return (
            <div
              key={cat.category}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition shadow-xs flex flex-col justify-between overflow-hidden ${
                isOver ? 'border-rose-300 dark:border-rose-800 ring-1 ring-rose-200 dark:ring-rose-900/40' : 'border-slate-200/90 dark:border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${color.badge}`}
                    >
                      {cat.percentage}% Allocation
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {cat.label}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                      {formatINR(cat.allocatedINR)}
                    </div>
                    {cat.category === 'catering' && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        ~{formatINR(plan.budget.cateringPerGuestINR)}/plate
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {cat.description}
                </p>

                {/* Percentage Slider */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                    <label
                      htmlFor={`slider-${cat.category}`}
                      className="font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      Adjust Percentage
                    </label>
                    <span className="font-mono font-bold text-[#6D5EF8] dark:text-[#9B8FF9] tabular-nums">
                      {cat.percentage}%
                    </span>
                  </div>
                  <input
                    id={`slider-${cat.category}`}
                    type="range"
                    min="2"
                    max="60"
                    step="1"
                    aria-label={`Adjust ${cat.label} allocation percentage`}
                    aria-valuemin={2}
                    aria-valuemax={60}
                    aria-valuenow={cat.percentage}
                    value={cat.percentage}
                    onChange={(e) =>
                      handleSliderChange(cat.category, Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#6D5EF8] focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
                  />
                </div>
              </div>

              {/* Actuals Input & Status Bar */}
              <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={`actual-committed-${cat.category}`}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Actual Committed (INR)
                  </label>
                  <div className="relative max-w-[140px]">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold" aria-hidden="true">
                      ₹
                    </span>
                    <input
                      id={`actual-committed-${cat.category}`}
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      aria-label={`${cat.label} actual committed INR`}
                      value={cat.actualSpentINR || ''}
                      onChange={(e) =>
                        handleUpdateActual(cat.category, Number(e.target.value))
                      }
                      className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#6D5EF8] focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 dark:text-slate-400">Variance:</span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {isOver
                      ? `-${formatINR(Math.abs(variance))} (Over Budget)`
                      : `+${formatINR(variance)} (Under Budget)`}
                  </span>
                </div>

                {isOver && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-100/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-950 dark:text-rose-200 leading-tight">
                    <strong>Actionable Tip:</strong>{' '}
                    {overspendAnalysis.overspentCategories.find((o) => o.category === cat.category)?.remedyTip ||
                      'Reduce non-critical items or reallocate from contingency buffer.'}
                  </div>
                )}
              </div>

              {/* Itemized Sub-Item Breakdown (Estimates) */}
              <div className="p-4 text-xs space-y-2">
                <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Itemized Estimates</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Labeled Estimates
                  </span>
                </div>
                <div className="space-y-1.5">
                  {cat.subItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap tabular-nums">
                        {formatINR(item.estimatedINR)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Practical Budget Trade-Offs & Adjustments Section */}
      {plan.tradeOffs && plan.tradeOffs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Actionable Budget Trade-offs & Strategic Adjustments
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data-driven trade-offs based on your {plan.input.eventType} in {plan.input.city} for {plan.input.guestCount} guests.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {plan.tradeOffs.map((tradeOff) => (
              <div
                key={tradeOff.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-3 hover:border-[#6D5EF8]/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]">
                      {tradeOff.area}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60 tabular-nums">
                      Save ~{formatINR(tradeOff.potentialSavingsINR)}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2.5 leading-snug">
                    {tradeOff.tradeOff}
                  </h5>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {tradeOff.impact}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span>Deterministic impact</span>
                  <span className="font-semibold text-[#6D5EF8] dark:text-[#9B8FF9] tabular-nums">
                    {Math.round((tradeOff.potentialSavingsINR / Math.max(1, plan.budget.totalINR)) * 100)}% of total budget
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transparent Planning Assumptions Panel */}
      {plan.assumptions && plan.assumptions.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Transparent Planning Assumptions & Scope Bounds
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
            {plan.assumptions.map((assumption, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 font-bold">•</span>
                <span className="leading-relaxed">{assumption}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
