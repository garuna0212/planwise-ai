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
  venue: { bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' },
  catering: { bg: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  decorations: { bg: 'bg-purple-50', text: 'text-purple-800', bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800' },
  entertainment: { bg: 'bg-blue-50', text: 'text-blue-800', bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800' },
  logistics: { bg: 'bg-rose-50', text: 'text-rose-800', bar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800' },
  contingency: { bg: 'bg-teal-50', text: 'text-teal-800', bar: 'bg-teal-500', badge: 'bg-teal-100 text-teal-800' },
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
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Stated Budget */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Stated Budget
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(plan.budget.totalINR)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{plan.input.guestCount} Guests</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">
              {formatINR(plan.budget.costPerGuestINR)}/guest
            </span>
          </div>
        </div>

        {/* Metric 2: 100% Allocation Proof */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Allocation Sum
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight flex items-baseline gap-2">
            <span>{formatINR(plan.budget.totalAllocatedINR)}</span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {totalPercentageSum}%
            </span>
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Strictly distributed (₹0 rounding leakage)</span>
          </div>
        </div>

        {/* Metric 3: Actual Spent */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Actual Committed
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(plan.budget.totalActualSpentINR)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
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
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {plan.budget.isOverallOverBudget ? 'Over Budget By' : 'Remaining Cushion'}
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                plan.budget.isOverallOverBudget
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-teal-50 text-teal-600'
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
            className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
              plan.budget.isOverallOverBudget ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {formatINR(Math.abs(plan.budget.remainingINR))}
          </div>
          <div className="text-xs mt-1">
            {plan.budget.isOverallOverBudget ? (
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Actuals exceed total budget!
              </span>
            ) : (
              <span className="text-teal-700 font-medium">
                Includes ₹{plan.budget.contingencyAmountINR.toLocaleString('en-IN')} emergency contingency
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual 100% Stacked Progress Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <span>Deterministic 100% Category Allocation</span>
            </h3>
            <p className="text-xs text-slate-500">
              Adjust sliders below to fine-tune allocation. Percentages auto-normalize to strictly 100.0%.
            </p>
          </div>
          <button
            onClick={handleResetToBaseline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline</span>
          </button>
        </div>

        {/* Stacked bar */}
        <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 shadow-inner">
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
                  ? 'bg-slate-900 text-white font-bold'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat.category].bar}`}
              />
              <span className="font-medium">{cat.label}</span>
              <span className="text-slate-400 font-mono">({cat.percentage}%)</span>
            </button>
          ))}
          {activeCategoryFilter !== 'all' && (
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
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
              className={`bg-white rounded-2xl border transition shadow-xs flex flex-col justify-between overflow-hidden ${
                isOver ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200/90'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${color.badge}`}
                    >
                      {cat.percentage}% Allocation
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {cat.label}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-slate-900 font-mono">
                      {formatINR(cat.allocatedINR)}
                    </div>
                    {cat.category === 'catering' && (
                      <div className="text-[11px] text-slate-500">
                        ~{formatINR(plan.budget.cateringPerGuestINR)}/plate
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {cat.description}
                </p>

                {/* Percentage Slider */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span className="font-medium flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      Adjust Percentage
                    </span>
                    <span className="font-mono font-bold text-indigo-600">
                      {cat.percentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="60"
                    step="1"
                    value={cat.percentage}
                    onChange={(e) =>
                      handleSliderChange(cat.category, Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* Actuals Input & Status Bar */}
              <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold text-slate-700">
                    Actual Committed (INR)
                  </label>
                  <div className="relative max-w-[140px]">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={cat.actualSpentINR || ''}
                      onChange={(e) =>
                        handleUpdateActual(cat.category, Number(e.target.value))
                      }
                      className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Variance:</span>
                  <span
                    className={`font-mono font-bold ${
                      isOver ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {isOver
                      ? `-${formatINR(Math.abs(variance))} (Over Budget)`
                      : `+${formatINR(variance)} (Under Budget)`}
                  </span>
                </div>

                {isOver && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-[11px] text-rose-900 leading-tight">
                    <strong>Actionable Tip:</strong>{' '}
                    {overspendAnalysis.overspentCategories.find((o) => o.category === cat.category)?.remedyTip ||
                      'Reduce non-critical items or reallocate from contingency buffer.'}
                  </div>
                )}
              </div>

              {/* Itemized Sub-Item Breakdown (Estimates) */}
              <div className="p-4 text-xs space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Itemized Estimates</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Labeled Estimates
                  </span>
                </div>
                <div className="space-y-1.5">
                  {cat.subItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-100 text-slate-700"
                    >
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="font-mono text-slate-900 font-semibold whitespace-nowrap">
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
    </div>
  );
};
