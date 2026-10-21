import {
  EventType,
  VenuePreference,
  BudgetCategory,
  BudgetBreakdown,
  BudgetSubItem,
} from '../types/planwise.ts';

export interface CategoryWeights {
  venue: number;
  catering: number;
  decorations: number;
  entertainment: number;
  logistics: number;
  contingency: number;
}

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  venue: 'Venue & Banquet Hall',
  catering: 'Catering & Beverages',
  decorations: 'Decorations & Florals',
  entertainment: 'Entertainment & Music',
  logistics: 'Logistics, Staff & Permits',
  contingency: 'Contingency & Emergency Reserve',
};

export const CATEGORY_DESCRIPTIONS: Record<BudgetCategory, string> = {
  venue: 'Hall rental, lawn deposit, bridal green room, cleanup fees, and setup time.',
  catering: 'Welcome refreshments, appetizers, buffet/plated mains, desserts, and live stations.',
  decorations: 'Stage design, entrance arches, floral arrangements, seating decor, and mood lighting.',
  entertainment: 'Sound system (PA/mic), DJ / live artists, MC / Emcee, lighting cues, and games.',
  logistics: 'Security, valet parking, civic permissions, sound permits, transport, and generators.',
  contingency: 'Buffer for last-minute headcount surges, overtime extensions, and unexpected needs.',
};

/**
 * Returns deterministic baseline percentage allocation for a given event type & venue preference
 * All base configurations strictly total 100%.
 */
export function getBaselinePercentages(
  eventType: EventType,
  venuePreference: VenuePreference
): CategoryWeights {
  let base: CategoryWeights;

  switch (eventType) {
    case 'wedding':
      base = {
        venue: 25,
        catering: 35,
        decorations: 15,
        entertainment: 10,
        logistics: 8,
        contingency: 7,
      };
      break;

    case 'birthday':
      base = {
        venue: 20,
        catering: 35,
        decorations: 15,
        entertainment: 15,
        logistics: 8,
        contingency: 7,
      };
      break;

    case 'community':
      base = {
        venue: 15,
        catering: 25,
        decorations: 15,
        entertainment: 20,
        logistics: 15,
        contingency: 10,
      };
      break;

    case 'anniversary':
      base = {
        venue: 22,
        catering: 38,
        decorations: 15,
        entertainment: 12,
        logistics: 6,
        contingency: 7,
      };
      break;

    case 'corporate':
      base = {
        venue: 30,
        catering: 30,
        decorations: 10,
        entertainment: 12,
        logistics: 12,
        contingency: 6,
      };
      break;

    case 'festival':
    default:
      base = {
        venue: 20,
        catering: 20,
        decorations: 15,
        entertainment: 25,
        logistics: 12,
        contingency: 8,
      };
      break;
  }

  // If outdoor event, shift 2% from venue to logistics for weatherproofing, backup power & permits
  if (venuePreference === 'outdoor') {
    base.venue = Math.max(5, base.venue - 2);
    base.logistics += 2;
  }

  return base;
}

/**
 * Ensures percentages sum to exactly 100.0%.
 * If they do not, normalizes and adjusts the largest category.
 */
export function normalizePercentages(weights: CategoryWeights): CategoryWeights {
  const categories: BudgetCategory[] = [
    'venue',
    'catering',
    'decorations',
    'entertainment',
    'logistics',
    'contingency',
  ];

  // Guarantee all values are nonnegative
  const safeWeights: CategoryWeights = {
    venue: Math.max(0, weights.venue || 0),
    catering: Math.max(0, weights.catering || 0),
    decorations: Math.max(0, weights.decorations || 0),
    entertainment: Math.max(0, weights.entertainment || 0),
    logistics: Math.max(0, weights.logistics || 0),
    contingency: Math.max(0, weights.contingency || 0),
  };

  const rawSum = categories.reduce((acc, cat) => acc + safeWeights[cat], 0);
  if (rawSum === 0) {
    return {
      venue: 20,
      catering: 35,
      decorations: 15,
      entertainment: 15,
      logistics: 8,
      contingency: 7,
    };
  }

  // Calculate rounded normalized percentages to 1 decimal place
  const normalized: Partial<Record<BudgetCategory, number>> = {};
  let normalizedSum = 0;
  let maxCat: BudgetCategory = 'catering';
  let maxVal = -1;

  for (const cat of categories) {
    const val = Number(((safeWeights[cat] / rawSum) * 100).toFixed(1));
    normalized[cat] = val;
    normalizedSum += val;
    if (val > maxVal) {
      maxVal = val;
      maxCat = cat;
    }
  }

  // Adjust rounding drift onto the largest category
  const drift = Number((100 - normalizedSum).toFixed(1));
  normalized[maxCat] = Number(((normalized[maxCat] || 0) + drift).toFixed(1));

  return normalized as CategoryWeights;
}

/**
 * Generates sample sub-item estimates for a category
 */
function generateCategorySubItems(
  category: BudgetCategory,
  allocatedINR: number,
  eventType: EventType,
  guestCount: number
): BudgetSubItem[] {
  const itemMap: Record<BudgetCategory, { name: string; share: number }[]> = {
    venue: [
      { name: 'Hall / Lawn Rental Base Fee (Estimate)', share: 0.75 },
      { name: 'Security Deposit & Facility Fee (Estimate)', share: 0.15 },
      { name: 'Post-Event Cleaning & Waste Removal (Estimate)', share: 0.10 },
    ],
    catering: [
      { name: `Food Menu & Live Counters (~₹${Math.round(allocatedINR * 0.7 / Math.max(1, guestCount))}/plate estimate)`, share: 0.70 },
      { name: 'Beverages, Mocktails & Mineral Water (Estimate)', share: 0.15 },
      { name: 'Service Staff, Cutlery & Buffet Setup (Estimate)', share: 0.15 },
    ],
    decorations: [
      { name: 'Main Stage / Mandap / Focus Backdrop (Estimate)', share: 0.50 },
      { name: 'Table Centerpieces & Guest Seating Florals (Estimate)', share: 0.30 },
      { name: 'Entrance Arch & Welcome Signage (Estimate)', share: 0.20 },
    ],
    entertainment: [
      { name: eventType === 'wedding' ? 'DJ, Dhol Players & Sound Setup (Estimate)' : 'DJ / Audio System & Mic (Estimate)', share: 0.60 },
      { name: 'Emcee / Host / Activity Coordinator (Estimate)', share: 0.25 },
      { name: 'Party Props, Favors & Game Materials (Estimate)', share: 0.15 },
    ],
    logistics: [
      { name: 'Sound & Civic Permissions / Police NOC (Estimate)', share: 0.35 },
      { name: 'Valet Parking & On-Site Security Guard (Estimate)', share: 0.35 },
      { name: 'Power Generator & Electrical Backup (Estimate)', share: 0.30 },
    ],
    contingency: [
      { name: 'Overtime & Extra Hour Buffer (Estimate)', share: 0.50 },
      { name: 'Emergency Supplies & Unplanned Guest Buffer (Estimate)', share: 0.50 },
    ],
  };

  const specs = itemMap[category] || [];
  let remaining = allocatedINR;

  return specs.map((spec, idx) => {
    const isLast = idx === specs.length - 1;
    const est = isLast ? remaining : Math.round(allocatedINR * spec.share);
    remaining -= est;
    return {
      id: `${category}-sub-${idx + 1}`,
      name: spec.name,
      estimatedINR: Math.max(0, est),
      actualINR: 0,
      status: 'pending',
    };
  });
}

/**
 * Deterministically computes the full budget plan:
 * 1. Ensures weights sum to 100.0% exactly.
 * 2. Distributes integer INR amounts such that sum(allocatedINR) === totalBudget.
 * 3. Calculates per-guest metrics.
 * 4. Checks over-budget conditions.
 */
export function calculateBudgetPlan(
  totalBudgetINR: number,
  customPercentages?: Partial<CategoryWeights>,
  eventType: EventType = 'wedding',
  venuePreference: VenuePreference = 'indoor',
  guestCount: number = 100,
  existingActuals?: Record<BudgetCategory, number>
) {
  const safeTotalBudget = Math.max(0, Math.round(totalBudgetINR));
  const baseline = getBaselinePercentages(eventType, venuePreference);
  const rawWeights: CategoryWeights = {
    venue: customPercentages?.venue ?? baseline.venue,
    catering: customPercentages?.catering ?? baseline.catering,
    decorations: customPercentages?.decorations ?? baseline.decorations,
    entertainment: customPercentages?.entertainment ?? baseline.entertainment,
    logistics: customPercentages?.logistics ?? baseline.logistics,
    contingency: customPercentages?.contingency ?? baseline.contingency,
  };

  const normalized = normalizePercentages(rawWeights);

  const categories: BudgetCategory[] = [
    'venue',
    'catering',
    'decorations',
    'entertainment',
    'logistics',
    'contingency',
  ];

  // Distribute integer amounts
  const preliminaryAllocations: Record<BudgetCategory, number> = {} as any;
  let allocatedSum = 0;
  let largestCategory: BudgetCategory = 'catering';
  let largestAllocation = -1;

  for (const cat of categories) {
    const amount = Math.floor((safeTotalBudget * normalized[cat]) / 100);
    preliminaryAllocations[cat] = amount;
    allocatedSum += amount;
    if (amount > largestAllocation) {
      largestAllocation = amount;
      largestCategory = cat;
    }
  }

  // Allocate rounding remainder to largest category so sum(allocated) === safeTotalBudget
  const remainder = safeTotalBudget - allocatedSum;
  preliminaryAllocations[largestCategory] += remainder;

  let totalActualSpentINR = 0;

  const breakdowns: BudgetBreakdown[] = categories.map((cat) => {
    const allocated = preliminaryAllocations[cat];
    const actual = Math.max(0, existingActuals?.[cat] || 0);
    totalActualSpentINR += actual;
    const isOver = actual > allocated;

    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      percentage: normalized[cat],
      allocatedINR: allocated,
      actualSpentINR: actual,
      description: CATEGORY_DESCRIPTIONS[cat],
      isOverBudget: isOver,
      subItems: generateCategorySubItems(cat, allocated, eventType, guestCount),
    };
  });

  const safeGuestCount = Math.max(1, guestCount);
  const costPerGuestINR = Math.round(safeTotalBudget / safeGuestCount);
  const cateringAllocation = preliminaryAllocations['catering'] || 0;
  const cateringPerGuestINR = Math.round(cateringAllocation / safeGuestCount);
  const contingencyAmountINR = preliminaryAllocations['contingency'] || 0;

  const remainingINR = safeTotalBudget - totalActualSpentINR;
  const isOverallOverBudget = totalActualSpentINR > safeTotalBudget;

  return {
    totalINR: safeTotalBudget,
    costPerGuestINR,
    cateringPerGuestINR,
    totalAllocatedINR: safeTotalBudget,
    totalActualSpentINR,
    remainingINR,
    isOverallOverBudget,
    categories: breakdowns,
    contingencyAmountINR,
  };
}
