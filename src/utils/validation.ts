import {
  PlanInput,
  PlanningWarning,
  BudgetBreakdown,
} from '../types/planwise.ts';
import { getDaysUntil } from './formatters.ts';

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates user input before plan generation
 */
export function validatePlanInput(input: Partial<PlanInput>): FormValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length === 0) {
    errors.title = 'Event title is required.';
  } else if (input.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }

  if (!input.date) {
    errors.date = 'Event date is required.';
  } else {
    const daysUntil = getDaysUntil(input.date);
    if (daysUntil < 0) {
      errors.date = 'Event date cannot be in the past.';
    }
  }

  if (!input.city || input.city.trim().length === 0) {
    errors.city = 'City or location is required.';
  }

  if (input.budgetINR === undefined || input.budgetINR === null || isNaN(input.budgetINR)) {
    errors.budgetINR = 'Budget amount is required.';
  } else if (input.budgetINR < 1000) {
    errors.budgetINR = 'Minimum budget must be at least ₹1,000.';
  } else if (input.budgetINR > 1000000000) {
    errors.budgetINR = 'Budget exceeds maximum supported threshold.';
  }

  if (input.guestCount === undefined || input.guestCount === null || isNaN(input.guestCount)) {
    errors.guestCount = 'Guest count is required.';
  } else if (input.guestCount < 1) {
    errors.guestCount = 'Guest count must be at least 1.';
  } else if (input.guestCount > 25000) {
    errors.guestCount = 'Guest count exceeds supported threshold (max 25,000).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Rule-based constraint engine that checks feasibility and generates targeted warnings
 */
export function evaluatePlanningConstraints(
  input: PlanInput,
  categories: BudgetBreakdown[]
): PlanningWarning[] {
  const warnings: PlanningWarning[] = [];
  const daysRemaining = getDaysUntil(input.date);
  const costPerGuest = Math.round(input.budgetINR / Math.max(1, input.guestCount));
  const contingencyCategory = categories.find((c) => c.category === 'contingency');
  const logisticsCategory = categories.find((c) => c.category === 'logistics');

  // 1. Timeline & Urgency constraints
  if (daysRemaining < 0) {
    warnings.push({
      id: 'warn-past-date',
      severity: 'danger',
      category: 'date',
      title: 'Event Date in the Past',
      message: 'The selected date has already passed. Please choose an upcoming date.',
      actionableTip: 'Update the celebration date to a future weekend.',
    });
  } else if (daysRemaining === 0) {
    warnings.push({
      id: 'warn-today-rush',
      severity: 'danger',
      category: 'date',
      title: 'Event is Scheduled for Today',
      message: 'Same-day planning requires immediate vendor locks and off-the-shelf catering.',
      actionableTip: 'Call ready-to-serve restaurants and party rental hubs immediately.',
    });
  } else if (daysRemaining < 7) {
    warnings.push({
      id: 'warn-short-lead',
      severity: 'danger',
      category: 'date',
      title: 'Very Short Lead Time (< 7 Days)',
      message: `Only ${daysRemaining} days left! Banquet venues and top caterers are likely booked, and rush fees may apply.`,
      actionableTip: 'Lock down catering and venue today with direct phone confirmations.',
    });
  } else if (input.eventType === 'wedding' && daysRemaining < 30) {
    warnings.push({
      id: 'warn-wedding-rush',
      severity: 'warning',
      category: 'date',
      title: 'Compressed Wedding Planning Window',
      message: `Planning a wedding in ${daysRemaining} days is high-stress. Traditional wedding vendors in India usually require 60–120 days lead time.`,
      actionableTip: 'Opt for an all-inclusive hotel package or experienced wedding coordinator to streamline execution.',
    });
  }

  // 2. Budget vs Guest Capacity Constraints
  if (input.eventType === 'wedding') {
    if (costPerGuest < 600) {
      warnings.push({
        id: 'warn-wedding-budget-critical',
        severity: 'danger',
        category: 'budget',
        title: 'Critically Low Budget per Guest for Wedding',
        message: `Your total budget is ₹${costPerGuest.toLocaleString('en-IN')}/guest. In Indian cities, basic wedding catering alone typically starts around ₹600–₹1,200/plate, excluding mandap, hall, and photography.`,
        actionableTip: 'Consider reducing guest count to ~' + Math.max(20, Math.floor(input.budgetINR / 1200)) + ' guests, or host an intimate home/temple ceremony.',
      });
    } else if (costPerGuest < 1200) {
      warnings.push({
        id: 'warn-wedding-budget-tight',
        severity: 'warning',
        category: 'budget',
        title: 'Tight Wedding Budget Allocation',
        message: `Allocating ₹${costPerGuest.toLocaleString('en-IN')}/guest will require disciplined vendor selection and limited live counters.`,
        actionableTip: 'Combine lunch catering with afternoon reception to avoid multiple meal services.',
      });
    }
  } else if (input.eventType === 'birthday') {
    if (costPerGuest < 300) {
      warnings.push({
        id: 'warn-bday-budget-tight',
        severity: 'warning',
        category: 'budget',
        title: 'Tight Birthday Budget per Guest',
        message: `Budget is ₹${costPerGuest.toLocaleString('en-IN')}/guest. A full sit-down dinner might exceed this limit.`,
        actionableTip: 'Consider a High Tea or Evening Chaat & Dessert party instead of a heavy dinner.',
      });
    }
  } else if (input.eventType === 'community') {
    if (costPerGuest < 120) {
      warnings.push({
        id: 'warn-community-budget',
        severity: 'info',
        category: 'budget',
        title: 'Community Scale Requires Resourcefulness',
        message: `With ₹${costPerGuest.toLocaleString('en-IN')}/person, relying strictly on commercial vendors could stretch funds.`,
        actionableTip: 'Incorporate community potluck stalls, volunteer marshals, and local municipal park permissions.',
      });
    }
  }

  // 3. Monsoon & Seasonal Weather Checks for Outdoor Venues
  if (input.venuePreference === 'outdoor' || input.venuePreference === 'hybrid') {
    try {
      const month = new Date(input.date).getMonth() + 1; // 1-12
      const isMonsoon = month >= 6 && month <= 9; // June to Sept
      const isSummerPeak = month >= 4 && month <= 5; // April to May
      const cityLower = input.city.toLowerCase();

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

      const isCityMonsoonProne = monsoonProneCities.some((c) => cityLower.includes(c));

      if (isMonsoon && isCityMonsoonProne) {
        warnings.push({
          id: 'warn-weather-monsoon',
          severity: 'danger',
          category: 'weather',
          title: 'Monsoon Rain Risk for Outdoor Event',
          message: `The event is scheduled in ${input.city} during prime monsoon season (${new Date(input.date).toLocaleDateString('en-IN', { month: 'long' })}). Open lawns face sudden torrential downpours and muddy ground.`,
          actionableTip: 'Contract a waterproof German hanger / pagoda canopy or ensure an adjacent indoor banquet fallback.',
        });
      } else if (isSummerPeak) {
        warnings.push({
          id: 'warn-weather-summer',
          severity: 'warning',
          category: 'weather',
          title: 'Extreme Summer Heat Consideration',
          message: `Outdoor events in ${input.city} during April/May face daytime temperatures exceeding 38°C–42°C.`,
          actionableTip: 'Shift the schedule to post-sunset (after 7 PM), and budget for heavy-duty mist fans and hydration bars.',
        });
      }
    } catch {
      // ignore date parse issues handled elsewhere
    }
  }

  // 4. Logistics for Large Gatherings
  if (input.guestCount > 300) {
    const logPct = logisticsCategory ? logisticsCategory.percentage : 8;
    if (logPct < 8) {
      warnings.push({
        id: 'warn-logistics-large-crowd',
        severity: 'warning',
        category: 'logistics',
        title: 'Large Gathering (${input.guestCount} Guests) Logistics Crunch',
        message: 'Hosting over 300 guests requires dedicated parking marshals, sound permits, waste management, and queue control.',
        actionableTip: 'Increase logistics allocation to at least 10–12% to prevent bottleneck chaos at the entrance.',
      });
    }
  }

  // 5. Contingency Health
  if (contingencyCategory && contingencyCategory.percentage < 5) {
    warnings.push({
      id: 'warn-low-contingency',
      severity: 'info',
      category: 'budget',
      title: 'Low Contingency Buffer (< 5%)',
      message: 'Industry best practices recommend reserving 5–10% of total budget for overtime, extra plates, and breakage.',
      actionableTip: 'Slightly reduce decor or entertainment to bolster the emergency reserve.',
    });
  }

  return warnings;
}
