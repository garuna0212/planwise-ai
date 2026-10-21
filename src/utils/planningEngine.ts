import {
  EventType,
  VenuePreference,
  BudgetCategory,
  BudgetBreakdown,
  PlanningWarning,
  PlanInput,
  PlanWisePlan,
} from '../types/planwise.ts';
import {
  CategoryWeights,
  getBaselinePercentages,
  normalizePercentages,
  calculateBudgetPlan,
} from './budgetEngine.ts';
import { getDaysUntil, formatDate, formatINR } from './formatters.ts';
import { generatePreparationTimeline } from './timelineEngine.ts';

export interface PerGuestBudgetResult {
  costPerGuestINR: number;
  cateringPerGuestINR: number;
  isValid: boolean;
  error?: string;
  advisory?: string;
}

/**
 * Deterministically calculates per-guest total and catering budgets with strict input boundary guards.
 * Handles zero guests, negative numbers, and non-numeric values safely without throwing or NaN.
 */
export function calculatePerGuestBudget(
  totalBudgetINR: number,
  guestCount: number,
  cateringAllocationINR?: number
): PerGuestBudgetResult {
  if (guestCount === undefined || guestCount === null || isNaN(guestCount)) {
    return {
      costPerGuestINR: 0,
      cateringPerGuestINR: 0,
      isValid: false,
      error: 'Guest count is undefined or invalid.',
    };
  }

  if (guestCount === 0) {
    return {
      costPerGuestINR: 0,
      cateringPerGuestINR: 0,
      isValid: false,
      error: 'Guest count cannot be zero. At least 1 guest is required to calculate per-guest metrics.',
    };
  }

  if (guestCount < 0) {
    return {
      costPerGuestINR: 0,
      cateringPerGuestINR: 0,
      isValid: false,
      error: 'Guest count cannot be negative.',
    };
  }

  if (totalBudgetINR === undefined || totalBudgetINR === null || isNaN(totalBudgetINR)) {
    return {
      costPerGuestINR: 0,
      cateringPerGuestINR: 0,
      isValid: false,
      error: 'Budget amount is invalid.',
    };
  }

  if (totalBudgetINR < 0) {
    return {
      costPerGuestINR: 0,
      cateringPerGuestINR: 0,
      isValid: false,
      error: 'Budget amount cannot be negative.',
    };
  }

  const safeBudget = Math.max(0, Math.round(totalBudgetINR));
  const safeGuests = Math.round(guestCount);
  const costPerGuestINR = Math.round(safeBudget / safeGuests);

  const cateringAmount =
    cateringAllocationINR !== undefined && !isNaN(cateringAllocationINR)
      ? Math.max(0, Math.round(cateringAllocationINR))
      : Math.round(safeBudget * 0.35); // fallback default ~35%
  const cateringPerGuestINR = Math.round(cateringAmount / safeGuests);

  let advisory: string | undefined;
  if (costPerGuestINR < 300) {
    advisory = 'Budget per guest is under ₹300. Multi-course sit-down catering is constrained.';
  } else if (costPerGuestINR > 20000) {
    advisory = 'Budget per guest exceeds ₹20,000, supporting luxury bespoke production.';
  }

  return {
    costPerGuestINR,
    cateringPerGuestINR,
    isValid: true,
    advisory,
  };
}

export type LeadTimeCategory =
  | 'past'
  | 'today'
  | 'urgent' // 1 - 7 days
  | 'short' // 8 - 30 days
  | 'adequate' // 31 - 90 days
  | 'plentiful'; // > 90 days

export interface DateValidationResult {
  isValid: boolean;
  daysRemaining: number;
  leadTimeCategory: LeadTimeCategory;
  isPast: boolean;
  formattedDate: string;
  error?: string;
  advisory?: string;
}

/**
 * Validates dates, flags past dates, and classifies lead time urgency deterministically.
 */
export function validateEventDate(dateString: string): DateValidationResult {
  if (!dateString || typeof dateString !== 'string' || dateString.trim().length === 0) {
    return {
      isValid: false,
      daysRemaining: 0,
      leadTimeCategory: 'past',
      isPast: false,
      formattedDate: '',
      error: 'Event date is required.',
    };
  }

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return {
      isValid: false,
      daysRemaining: 0,
      leadTimeCategory: 'past',
      isPast: false,
      formattedDate: dateString,
      error: 'Invalid date format. Expected YYYY-MM-DD.',
    };
  }

  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      isValid: false,
      daysRemaining: 0,
      leadTimeCategory: 'past',
      isPast: false,
      formattedDate: dateString,
      error: 'Date values are out of range.',
    };
  }

  const daysRemaining = getDaysUntil(dateString);
  const isPast = daysRemaining < 0;
  const formattedDate = formatDate(dateString);

  if (isPast) {
    return {
      isValid: false,
      daysRemaining,
      leadTimeCategory: 'past',
      isPast: true,
      formattedDate,
      error: `Event date (${formattedDate}) is in the past by ${Math.abs(daysRemaining)} days.`,
    };
  }

  let leadTimeCategory: LeadTimeCategory;
  let advisory: string | undefined;

  if (daysRemaining === 0) {
    leadTimeCategory = 'today';
    advisory = 'Event is scheduled for today. Same-day emergency locks required.';
  } else if (daysRemaining <= 7) {
    leadTimeCategory = 'urgent';
    advisory = `Only ${daysRemaining} days remaining. Vendor rush premiums likely apply.`;
  } else if (daysRemaining <= 30) {
    leadTimeCategory = 'short';
    advisory = `${daysRemaining} days remaining. Secure catering tastings and final invitations now.`;
  } else if (daysRemaining <= 90) {
    leadTimeCategory = 'adequate';
    advisory = 'Comfortable planning window to negotiate multiple vendor quotes.';
  } else {
    leadTimeCategory = 'plentiful';
    advisory = 'Ample lead time to secure prime venue dates and early-bird discounts.';
  }

  return {
    isValid: true,
    daysRemaining,
    leadTimeCategory,
    isPast: false,
    formattedDate,
    advisory,
  };
}

export interface OverspendingAnalysis {
  isOverallOverBudget: boolean;
  totalBudgetINR: number;
  totalActualSpentINR: number;
  netVarianceINR: number; // positive = surplus, negative = deficit
  overallOverageINR: number;
  overagePercentage: number;
  overspentCategories: {
    category: BudgetCategory;
    label: string;
    allocatedINR: number;
    actualSpentINR: number;
    overageINR: number;
    percentageOver: number;
    remedyTip: string;
  }[];
}

/**
 * Deterministically analyzes spending across all categories and totals to identify overspending.
 */
export function identifyOverspending(
  categories: BudgetBreakdown[],
  totalBudgetINR: number
): OverspendingAnalysis {
  const safeTotalBudget = Math.max(0, Math.round(totalBudgetINR));
  let totalActualSpentINR = 0;
  const overspentCategories: OverspendingAnalysis['overspentCategories'] = [];

  for (const cat of categories) {
    const actual = Math.max(0, cat.actualSpentINR || 0);
    totalActualSpentINR += actual;

    if (actual > cat.allocatedINR) {
      const overage = actual - cat.allocatedINR;
      const pctOver =
        cat.allocatedINR > 0
          ? Number(((overage / cat.allocatedINR) * 100).toFixed(1))
          : 100;

      let remedyTip = `Reduce optional additions in ${cat.label} or pull from Contingency buffer.`;
      if (cat.category === 'catering') {
        remedyTip = 'Switch one live specialty counter to plated service or standardize dessert choices.';
      } else if (cat.category === 'decorations') {
        remedyTip = 'Substitute imported exotic flowers with local marigolds/tuberoses or rent reusable props.';
      } else if (cat.category === 'venue') {
        remedyTip = 'Review rental setup hours to prevent overtime surcharges.';
      } else if (cat.category === 'entertainment') {
        remedyTip = 'Streamline sound setup wattage or reduce live performance hours.';
      }

      overspentCategories.push({
        category: cat.category,
        label: cat.label,
        allocatedINR: cat.allocatedINR,
        actualSpentINR: actual,
        overageINR: overage,
        percentageOver: pctOver,
        remedyTip,
      });
    }
  }

  const isOverallOverBudget = totalActualSpentINR > safeTotalBudget;
  const netVarianceINR = safeTotalBudget - totalActualSpentINR;
  const overallOverageINR = isOverallOverBudget ? totalActualSpentINR - safeTotalBudget : 0;
  const overagePercentage =
    safeTotalBudget > 0
      ? Number(((overallOverageINR / safeTotalBudget) * 100).toFixed(1))
      : 0;

  return {
    isOverallOverBudget,
    totalBudgetINR: safeTotalBudget,
    totalActualSpentINR,
    netVarianceINR,
    overallOverageINR,
    overagePercentage,
    overspentCategories,
  };
}

/**
 * Generates comprehensive, context-aware actionable warnings based on all input constraints.
 */
export function generateContextAwareWarnings(
  input: PlanInput,
  categories: BudgetBreakdown[],
  actualsAnalysis: OverspendingAnalysis
): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  const dateResult = validateEventDate(input.date);
  const perGuestResult = calculatePerGuestBudget(input.budgetINR, input.guestCount);

  // 1. Date & Lead-Time Warnings
  if (!dateResult.isValid) {
    warnings.push({
      id: 'warn-date-invalid',
      severity: 'danger',
      category: 'date',
      title: 'Invalid Event Date',
      message: dateResult.error || 'The event date is invalid.',
      actionableTip: 'Select an upcoming future date on the calendar.',
    });
  } else if (dateResult.leadTimeCategory === 'today') {
    warnings.push({
      id: 'warn-lead-today',
      severity: 'danger',
      category: 'date',
      title: 'Event Scheduled for Today',
      message: 'Zero lead time remaining. Banquet venues and catering teams require instant telephone confirmation.',
      actionableTip: 'Prioritize walk-in ready catering and plug-and-play sound systems.',
    });
  } else if (dateResult.leadTimeCategory === 'urgent') {
    warnings.push({
      id: 'warn-lead-urgent',
      severity: 'danger',
      category: 'date',
      title: `Critical Lead Time (${dateResult.daysRemaining} Days)`,
      message: `Only ${dateResult.daysRemaining} days left! Banquet halls and premium decorators are usually fully booked.`,
      actionableTip: 'Confirm venue and primary food catering immediately today.',
    });
  } else if (input.eventType === 'wedding' && dateResult.daysRemaining < 30) {
    warnings.push({
      id: 'warn-wedding-lead-short',
      severity: 'warning',
      category: 'date',
      title: 'Compressed Wedding Preparation Window',
      message: `Planning an Indian wedding in ${dateResult.daysRemaining} days is highly compressed (60–120 days is typical).`,
      actionableTip: 'Choose an all-inclusive hotel package or experienced wedding coordinator to streamline decisions.',
    });
  }

  // 2. Guest Count & Capacity Warnings
  if (!perGuestResult.isValid) {
    warnings.push({
      id: 'warn-guest-invalid',
      severity: 'danger',
      category: 'guest_capacity',
      title: 'Invalid Guest Count',
      message: perGuestResult.error || 'Guest count must be at least 1.',
      actionableTip: 'Enter a valid positive number of expected attendees.',
    });
  }

  // 3. Budget vs Feasibility Thresholds
  if (perGuestResult.isValid && input.budgetINR > 0) {
    const costPerGuest = perGuestResult.costPerGuestINR;

    if (input.eventType === 'wedding') {
      if (costPerGuest < 600) {
        warnings.push({
          id: 'warn-wedding-budget-critical',
          severity: 'danger',
          category: 'budget',
          title: 'Critically Low Wedding Budget per Guest',
          message: `Your total budget is ₹${costPerGuest.toLocaleString('en-IN')}/guest. In Indian cities, basic wedding catering alone starts at ₹600–₹1,200/plate, excluding venue and mandap.`,
          actionableTip: `Adjust guest list to ~${Math.max(20, Math.floor(input.budgetINR / 1200))} guests or celebrate at a community trust hall.`,
        });
      } else if (costPerGuest < 1200) {
        warnings.push({
          id: 'warn-wedding-budget-tight',
          severity: 'warning',
          category: 'budget',
          title: 'Tight Wedding Budget Allocation',
          message: `Allocating ₹${costPerGuest.toLocaleString('en-IN')}/guest will require strict limits on live counters and floral density.`,
          actionableTip: 'Combine high-tea with an early dinner service to reduce catering iterations.',
        });
      }
    } else if (input.eventType === 'birthday') {
      if (costPerGuest < 300) {
        warnings.push({
          id: 'warn-bday-budget-tight',
          severity: 'warning',
          category: 'budget',
          title: 'Constrained Birthday Budget per Guest',
          message: `Budget is ₹${costPerGuest.toLocaleString('en-IN')}/guest. Full sit-down buffet will likely exceed this limit.`,
          actionableTip: 'Consider an afternoon Chaat & Cake party instead of a multi-course dinner.',
        });
      }
    } else if (input.eventType === 'community') {
      if (costPerGuest < 120) {
        warnings.push({
          id: 'warn-community-budget',
          severity: 'info',
          category: 'budget',
          title: 'Community Scale Requires Resourcefulness',
          message: `With ₹${costPerGuest.toLocaleString('en-IN')}/person, commercial catering will exceed funds.`,
          actionableTip: 'Incorporate community potluck stalls, volunteer marshals, and local municipal permissions.',
        });
      }
    }
  }

  // 4. Overspending Warnings
  if (actualsAnalysis.isOverallOverBudget) {
    warnings.push({
      id: 'warn-overspending-overall',
      severity: 'danger',
      category: 'budget',
      title: `Overall Budget Exceeded by ${formatINR(actualsAnalysis.overallOverageINR)}`,
      message: `Total committed expenses (${formatINR(actualsAnalysis.totalActualSpentINR)}) exceed stated budget (${formatINR(actualsAnalysis.totalBudgetINR)}) by ${actualsAnalysis.overagePercentage}%.`,
      actionableTip: 'Adjust non-essential decor/entertainment quotes, or increase overall budget.',
    });
  }

  for (const over of actualsAnalysis.overspentCategories) {
    warnings.push({
      id: `warn-over-${over.category}`,
      severity: 'warning',
      category: 'budget',
      title: `${over.label} Over Budget by ${formatINR(over.overageINR)}`,
      message: `Actual spent (${formatINR(over.actualSpentINR)}) exceeds ${formatINR(over.allocatedINR)} allocation by ${over.percentageOver}%.`,
      actionableTip: over.remedyTip,
    });
  }

  // 5. Weather & Seasonality Warnings
  if (input.venuePreference === 'outdoor' || input.venuePreference === 'hybrid') {
    try {
      const month = new Date(input.date).getMonth() + 1; // 1 to 12
      const isMonsoon = month >= 6 && month <= 9;
      const isSummerPeak = month >= 4 && month <= 5;
      const cityLower = (input.city || '').toLowerCase();

      const monsoonProneCities = [
        'mumbai',
        'pune',
        'goa',
        'delhi',
        'bengaluru',
        'bangalore',
        'hyderabad',
        'chennai',
        'kolkata',
        'kochi',
        'cochin',
        'ahmedabad',
        'jaipur',
      ];

      if (isMonsoon && monsoonProneCities.some((c) => cityLower.includes(c))) {
        warnings.push({
          id: 'warn-weather-monsoon',
          severity: 'danger',
          category: 'weather',
          title: 'Monsoon Rain Hazard for Outdoor Venue',
          message: `Scheduled in ${input.city} during active monsoon season (${new Date(input.date).toLocaleDateString('en-IN', { month: 'long' })}). Sudden downpours can flood lawns.`,
          actionableTip: 'Mandate waterproof German hanger / pagoda canopy or ensure adjacent banquet hall backup.',
        });
      } else if (isSummerPeak) {
        warnings.push({
          id: 'warn-weather-summer',
          severity: 'warning',
          category: 'weather',
          title: 'Extreme Summer Heat Consideration',
          message: `Outdoor daytime events in ${input.city} during April/May face temperatures above 40°C.`,
          actionableTip: 'Shift the main celebration to post-sunset (after 7 PM) and arrange industrial mist fans.',
        });
      }
    } catch {
      // ignore
    }
  }

  // 6. Large Gathering Scale & Logistics
  if (input.guestCount > 300) {
    const logistics = categories.find((c) => c.category === 'logistics');
    if (!logistics || logistics.percentage < 8) {
      warnings.push({
        id: 'warn-logistics-scale',
        severity: 'warning',
        category: 'logistics',
        title: `Crowd Scale (${input.guestCount} Guests) Logistics Crunch`,
        message: 'Events hosting >300 attendees require dedicated parking marshals, sound permits, and waste clearing.',
        actionableTip: 'Increase logistics allocation to at least 10–12% to prevent entrance congestion.',
      });
    }
  }

  // 7. Contingency Health
  const contingency = categories.find((c) => c.category === 'contingency');
  if (contingency && contingency.percentage < 5) {
    warnings.push({
      id: 'warn-low-contingency',
      severity: 'info',
      category: 'budget',
      title: 'Low Contingency Cushion (< 5%)',
      message: 'Industry standard suggests keeping 5–10% of total budget uncommitted for overtime or headcount surges.',
      actionableTip: 'Reallocate 2–3% from decor or gifts to strengthen your emergency buffer.',
    });
  }

  return warnings;
}

/**
 * Reusable immediate recalculation function.
 * Called as soon as ANY input, slider, or actual expense changes.
 */
export function recalculatePlan(
  existingPlan: PlanWisePlan,
  inputPatch?: Partial<PlanInput>,
  customPercentages?: Partial<CategoryWeights>,
  actualsPatch?: Record<BudgetCategory, number>
): PlanWisePlan {
  const updatedInput: PlanInput = {
    ...existingPlan.input,
    ...(inputPatch || {}),
  };

  // Extract current actuals
  const currentActuals: Record<BudgetCategory, number> = {} as any;
  existingPlan.budget.categories.forEach((cat) => {
    currentActuals[cat.category] = cat.actualSpentINR;
  });
  if (actualsPatch) {
    Object.assign(currentActuals, actualsPatch);
  }

  // Re-run deterministic budget calculation
  const budget = calculateBudgetPlan(
    updatedInput.budgetINR,
    customPercentages,
    updatedInput.eventType,
    updatedInput.venuePreference,
    updatedInput.guestCount,
    currentActuals
  );

  // Analyze overspending
  const overspendAnalysis = identifyOverspending(budget.categories, updatedInput.budgetINR);

  // Generate context-aware actionable warnings
  const warnings = generateContextAwareWarnings(updatedInput, budget.categories, overspendAnalysis);

  // If date or event type changed, re-evaluate timeline
  const dateChanged = inputPatch?.date && inputPatch.date !== existingPlan.input.date;
  const eventTypeChanged = inputPatch?.eventType && inputPatch.eventType !== existingPlan.input.eventType;
  const timeline =
    dateChanged || eventTypeChanged
      ? generatePreparationTimeline(updatedInput.date, updatedInput.eventType, updatedInput.venuePreference)
      : existingPlan.timeline;

  return {
    ...existingPlan,
    updatedAt: new Date().toISOString(),
    input: updatedInput,
    budget,
    warnings,
    timeline,
  };
}
