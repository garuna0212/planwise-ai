import { describe, it, expect } from 'vitest';
import {
  getBaselinePercentages,
  normalizePercentages,
  calculateBudgetPlan,
} from '../budgetEngine.ts';
import {
  validatePlanInput,
  evaluatePlanningConstraints,
} from '../validation.ts';
import {
  calculatePerGuestBudget,
  validateEventDate,
  identifyOverspending,
  generateContextAwareWarnings,
  recalculatePlan,
} from '../planningEngine.ts';
import { generatePreparationTimeline } from '../timelineEngine.ts';
import { PlanInput } from '../../types/planwise.ts';
import { createPlanObject } from '../storage.ts';

describe('PlanWise AI - Deterministic Budget Allocation Engine', () => {
  it('should ensure baseline percentages sum to exactly 100% across all event types and settings', () => {
    const eventTypes = [
      'wedding',
      'birthday',
      'community',
      'anniversary',
      'corporate',
      'festival',
    ] as const;

    for (const type of eventTypes) {
      const indoorWeights = getBaselinePercentages(type, 'indoor');
      const indoorSum = Object.values(indoorWeights).reduce((a, b) => a + b, 0);
      expect(indoorSum).toBe(100);

      const outdoorWeights = getBaselinePercentages(type, 'outdoor');
      const outdoorSum = Object.values(outdoorWeights).reduce((a, b) => a + b, 0);
      expect(outdoorSum).toBe(100);
    }
  });

  it('should normalize arbitrary custom slider weights to strictly 100.0%', () => {
    const customWeights = [
      { venue: 13, catering: 42, decorations: 17, entertainment: 9, logistics: 11, contingency: 5 }, // sum 97
      { venue: 35, catering: 45, decorations: 20, entertainment: 15, logistics: 10, contingency: 10 }, // sum 135
      { venue: 1, catering: 1, decorations: 1, entertainment: 1, logistics: 1, contingency: 1 }, // sum 6
    ];

    for (const custom of customWeights) {
      const normalized = normalizePercentages(custom);
      const sum = Number(
        Object.values(normalized)
          .reduce((a, b) => a + b, 0)
          .toFixed(1)
      );
      expect(sum).toBe(100);
    }
  });

  it('should allocate integer rupee amounts that strictly equal the total budget with zero rounding loss', () => {
    const testBudgets = [1000, 7777, 25345, 123456, 876543, 1800000, 10000000];

    for (const budget of testBudgets) {
      const result = calculateBudgetPlan(budget, undefined, 'wedding', 'indoor', 150);
      const sumAllocated = result.categories.reduce((acc, cat) => acc + cat.allocatedINR, 0);

      expect(sumAllocated).toBe(budget);
      expect(result.totalAllocatedINR).toBe(budget);

      // Verify all amounts are nonnegative integers
      for (const cat of result.categories) {
        expect(cat.allocatedINR).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(cat.allocatedINR)).toBe(true);
      }
    }
  });
});

describe('PlanWise AI - Zero Guests & Edge Case Guards', () => {
  it('should safely handle zero guests without NaN, division-by-zero, or throwing', () => {
    const zeroResult = calculatePerGuestBudget(500000, 0);
    expect(zeroResult.isValid).toBe(false);
    expect(zeroResult.costPerGuestINR).toBe(0);
    expect(zeroResult.error).toContain('cannot be zero');
    expect(Number.isNaN(zeroResult.costPerGuestINR)).toBe(false);
  });

  it('should reject negative guests safely', () => {
    const negativeResult = calculatePerGuestBudget(500000, -15);
    expect(negativeResult.isValid).toBe(false);
    expect(negativeResult.costPerGuestINR).toBe(0);
    expect(negativeResult.error).toContain('cannot be negative');
  });

  it('should reject negative budget safely', () => {
    const negativeBudget = calculatePerGuestBudget(-50000, 100);
    expect(negativeBudget.isValid).toBe(false);
    expect(negativeBudget.costPerGuestINR).toBe(0);
    expect(negativeBudget.error).toContain('cannot be negative');
  });

  it('should calculate valid per-guest budget accurately for standard inputs', () => {
    const valid = calculatePerGuestBudget(600000, 200, 210000);
    expect(valid.isValid).toBe(true);
    expect(valid.costPerGuestINR).toBe(3000);
    expect(valid.cateringPerGuestINR).toBe(1050);
  });
});

describe('PlanWise AI - Past Dates & Date Validation', () => {
  it('should flag dates in the past as invalid and identify days past', () => {
    const pastResult = validateEventDate('2020-01-01');
    expect(pastResult.isValid).toBe(false);
    expect(pastResult.isPast).toBe(true);
    expect(pastResult.leadTimeCategory).toBe('past');
    expect(pastResult.error).toContain('in the past');
  });

  it('should reject malformed or non-date strings', () => {
    const malformed = validateEventDate('invalid-date-string');
    expect(malformed.isValid).toBe(false);
    expect(malformed.error).toBeDefined();

    const empty = validateEventDate('');
    expect(empty.isValid).toBe(false);
    expect(empty.error).toBeDefined();
  });

  it('should categorize lead times correctly for future dates', () => {
    // 5 days ahead
    const urgentDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const urgentRes = validateEventDate(urgentDate);
    expect(urgentRes.isValid).toBe(true);
    expect(urgentRes.leadTimeCategory).toBe('urgent');

    // 45 days ahead
    const normalDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const normalRes = validateEventDate(normalDate);
    expect(normalRes.isValid).toBe(true);
    expect(normalRes.leadTimeCategory).toBe('adequate');
  });
});

describe('PlanWise AI - Insufficient Budget & Feasibility Warnings', () => {
  it('should trigger high-severity warning when wedding budget per guest is unrealistically low', () => {
    const input: PlanInput = {
      title: 'Budget Wedding',
      eventType: 'wedding',
      date: '2026-11-20',
      city: 'Mumbai',
      budgetINR: 80000,
      guestCount: 250, // ₹320 per guest
      theme: 'Traditional',
      venuePreference: 'indoor',
      specialRequirements: '',
    };
    const budget = calculateBudgetPlan(input.budgetINR, undefined, input.eventType, input.venuePreference, input.guestCount);
    const analysis = identifyOverspending(budget.categories, input.budgetINR);
    const warnings = generateContextAwareWarnings(input, budget.categories, analysis);

    const budgetWarning = warnings.find((w) => w.id === 'warn-wedding-budget-critical');
    expect(budgetWarning).toBeDefined();
    expect(budgetWarning?.severity).toBe('danger');
    expect(budgetWarning?.title).toContain('Critically Low');
    expect(budgetWarning?.message).toContain('₹320/guest');
  });

  it('should trigger monsoon weather warning for outdoor events during monsoon in Mumbai', () => {
    const input: PlanInput = {
      title: 'July Lawn Party',
      eventType: 'birthday',
      date: '2026-07-15', // July = monsoon
      city: 'Mumbai',
      budgetINR: 150000,
      guestCount: 50,
      theme: 'Tropical',
      venuePreference: 'outdoor',
      specialRequirements: '',
    };
    const budget = calculateBudgetPlan(input.budgetINR, undefined, input.eventType, input.venuePreference, input.guestCount);
    const analysis = identifyOverspending(budget.categories, input.budgetINR);
    const warnings = generateContextAwareWarnings(input, budget.categories, analysis);

    const monsoonWarning = warnings.find((w) => w.id === 'warn-weather-monsoon');
    expect(monsoonWarning).toBeDefined();
    expect(monsoonWarning?.severity).toBe('danger');
  });
});

describe('PlanWise AI - Overspending Identification', () => {
  it('should accurately identify category overspending and overall budget overrun', () => {
    const totalBudget = 500000;
    const plan = calculateBudgetPlan(totalBudget, undefined, 'wedding', 'indoor', 100);

    // Simulate actuals exceeding catering allocation
    const cateringCat = plan.categories.find((c) => c.category === 'catering')!;
    const originalCateringAlloc = cateringCat.allocatedINR;

    // Overspend catering by ₹50,000
    cateringCat.actualSpentINR = originalCateringAlloc + 50000;

    const analysis = identifyOverspending(plan.categories, totalBudget);
    expect(analysis.overspentCategories.length).toBe(1);
    expect(analysis.overspentCategories[0].category).toBe('catering');
    expect(analysis.overspentCategories[0].overageINR).toBe(50000);
    expect(analysis.overspentCategories[0].remedyTip).toBeDefined();
  });
});

describe('PlanWise AI - Immediate Recalculation Engine', () => {
  it('should recalculate immediately when inputs change', () => {
    const initialInput: PlanInput = {
      title: 'Initial Celebration',
      eventType: 'birthday',
      date: '2026-11-20',
      city: 'Delhi',
      budgetINR: 100000,
      guestCount: 50,
      theme: 'Festive',
      venuePreference: 'indoor',
      specialRequirements: '',
    };

    const initialPlan = createPlanObject(initialInput);
    expect(initialPlan.budget.totalINR).toBe(100000);
    expect(initialPlan.budget.costPerGuestINR).toBe(2000);

    // Immediately patch with budget increase and guest count change
    const updatedPlan = recalculatePlan(initialPlan, {
      budgetINR: 200000,
      guestCount: 80,
    });

    expect(updatedPlan.budget.totalINR).toBe(200000);
    expect(updatedPlan.budget.totalAllocatedINR).toBe(200000);
    expect(updatedPlan.budget.costPerGuestINR).toBe(2500);
  });
});
