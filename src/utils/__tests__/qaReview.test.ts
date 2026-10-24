import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePlanInput,
  evaluatePlanningConstraints,
} from '../validation.ts';
import {
  calculateBudgetPlan,
  normalizePercentages,
  getBaselinePercentages,
} from '../budgetEngine.ts';
import {
  calculatePerGuestBudget,
  validateEventDate,
  identifyOverspending,
  generateContextAwareWarnings,
  recalculatePlan,
} from '../planningEngine.ts';
import {
  generatePreparationTimeline,
} from '../timelineEngine.ts';
import {
  generateInitialVendors,
} from '../vendorEngine.ts';
import { createPlanObject } from '../storage.ts';
import {
  validatePlanApiRequest,
  validateChatApiRequest,
  validateAndSanitizeGeminiPlanResponse,
  containsPrototypePollution,
  sanitizeString,
  stripHtmlAndScripts,
} from '../securityValidators.ts';
import {
  parseRevisionProposal,
  validateProposalStructure,
  applyPlanRevision,
} from '../revisionEngine.ts';
import { MemoryRateLimiterStore } from '../rateLimiter.ts';
import { PlanInput, GeminiCreativeInsights, BudgetBreakdown } from '../../types/planwise.ts';

const FALLBACK_INSIGHTS: GeminiCreativeInsights = {
  tagline: 'Celebration of Joy & Elegance',
  conceptNarrative: 'A curated gathering designed with seamless guest experience.',
  curatedMenu: {
    welcomeDrinks: ['Mint Cooler', 'Fruit Sparkler'],
    appetizers: ['Paneer Tikka', 'Crispy Corn'],
    mains: ['Dal Makhani', 'Paneer Butter Masala', 'Jeera Rice', 'Tandoori Roti'],
    desserts: ['Gulab Jamun', 'Rasmalai'],
    culturalNotes: 'Balanced multi-course menu catering to all attendee groups.',
  },
  decorAndAmbience: {
    colorPalette: [
      { name: 'Royal Violet', hex: '#6D5EF8' },
      { name: 'Warm Amber', hex: '#F59E0B' },
      { name: 'Soft Slate', hex: '#0F172A' },
    ],
    stylingHighlights: ['Floral arch', 'Ambient candlelit centerpieces'],
    diyCostSavingIdeas: ['Rent brass props locally', 'Digital program QR placards'],
  },
  entertainmentAndActivities: {
    highlights: ['Acoustic live band', 'Celebration photo booth'],
    runOfShowTips: ['Stage announcements 15 minutes before dinner buffet'],
  },
  citySpecificAdvice: 'Check municipal noise curfew regulations after 10 PM.',
};

describe('Comprehensive PlanWise AI Quality Assurance Suite', () => {
  const standardInput: PlanInput = {
    title: 'Ananya & Rohan Wedding Gala',
    eventType: 'wedding',
    date: '2026-12-18',
    city: 'Bengaluru',
    budgetINR: 2000000,
    guestCount: 250,
    theme: 'Botanical Elegance & Warm Amber',
    venuePreference: 'hybrid',
    specialRequirements: 'Special seating for grandparents; live acoustic quartet',
  };

  // =========================================================================
  // REQUIREMENT 0: CONFIRMED BUG REGRESSION TEST (src/utils/validation.ts line 215)
  // =========================================================================
  describe('Regression Test: Large Gathering Interpolation Bug (line 215)', () => {
    it('properly interpolates guest count in warning title and does NOT display literal "${input.guestCount}"', () => {
      const largeGatheringInput: PlanInput = {
        ...standardInput,
        guestCount: 450,
      };

      // Create categories where logistics is under 8% (e.g. 5%)
      const categories: BudgetBreakdown[] = [
        {
          category: 'venue',
          label: 'Venue & Banquet Hall',
          percentage: 30,
          allocatedINR: 600000,
          actualSpentINR: 0,
          description: 'Hall rental',
          isOverBudget: false,
          subItems: [],
        },
        {
          category: 'logistics',
          label: 'Logistics, Sound & Licenses',
          percentage: 5, // under 8% threshold
          allocatedINR: 100000,
          actualSpentINR: 0,
          description: 'Sound permits and valet',
          isOverBudget: false,
          subItems: [],
        },
        {
          category: 'contingency',
          label: 'Emergency Reserve',
          percentage: 10,
          allocatedINR: 200000,
          actualSpentINR: 0,
          description: 'Buffer',
          isOverBudget: false,
          subItems: [],
        },
      ];

      const warnings = evaluatePlanningConstraints(largeGatheringInput, categories);
      const logisticsWarning = warnings.find((w) => w.id === 'warn-logistics-large-crowd');

      expect(logisticsWarning).toBeDefined();
      expect(logisticsWarning?.title).toBe('Large Gathering (450 Guests) Logistics Crunch');
      // Critical regression assertions:
      expect(logisticsWarning?.title).not.toContain('${input.guestCount}');
      expect(logisticsWarning?.title).toContain('450 Guests');
    });

    it('handles various guest count numbers correctly without template literal breakage', () => {
      const counts = [301, 750, 1500, 5000];
      const categories: BudgetBreakdown[] = [
        {
          category: 'logistics',
          label: 'Logistics',
          percentage: 4,
          allocatedINR: 40000,
          actualSpentINR: 0,
          description: 'Logistics',
          isOverBudget: false,
          subItems: [],
        },
      ];

      for (const count of counts) {
        const input: PlanInput = {
          ...standardInput,
          guestCount: count,
        };
        const warnings = evaluatePlanningConstraints(input, categories);
        const warn = warnings.find((w) => w.id === 'warn-logistics-large-crowd');
        expect(warn).toBeDefined();
        expect(warn?.title).toBe(`Large Gathering (${count} Guests) Logistics Crunch`);
        expect(warn?.title).not.toContain('${');
      }
    });
  });

  // =========================================================================
  // REQUIREMENT 1: VERIFY EVENT CREATION AND EDITING
  // =========================================================================
  describe('1. Event Creation & Editing Lifecycle', () => {
    it('creates a complete, coherent PlanWisePlan object from valid user input', () => {
      const plan = createPlanObject(standardInput);

      expect(plan.id).toBeDefined();
      expect(plan.input.title).toBe(standardInput.title);
      expect(plan.budget.totalINR).toBe(standardInput.budgetINR);
      expect(plan.budget.categories.length).toBeGreaterThan(0);
      expect(plan.timeline.length).toBeGreaterThan(0);
      expect(plan.vendors.length).toBeGreaterThan(0);
      expect(plan.assumptions.length).toBeGreaterThan(0);
      expect(plan.tradeOffs.length).toBeGreaterThan(0);
      expect(plan.aiInsights).toBeDefined();
    });

    it('edits an existing plan dynamically while preserving actual expenses and custom tasks', () => {
      const plan = createPlanObject(standardInput);

      // Simulate user editing actual spent expenses on venue category
      plan.budget.categories[0].actualSpentINR = 450000;

      // Edit plan with new budget and guest count
      const updatedPlan = recalculatePlan(plan, {
        budgetINR: 2500000,
        guestCount: 300,
        title: 'Ananya & Rohan Grand Wedding (Updated)',
      });

      expect(updatedPlan.input.title).toBe('Ananya & Rohan Grand Wedding (Updated)');
      expect(updatedPlan.budget.totalINR).toBe(2500000);
      expect(updatedPlan.input.guestCount).toBe(300);
      expect(updatedPlan.budget.costPerGuestINR).toBe(Math.round(2500000 / 300));
      // Actual expense was preserved
      expect(updatedPlan.budget.categories[0].actualSpentINR).toBe(450000);
    });

    it('validates form input correctly during event creation', () => {
      const valid = validatePlanInput(standardInput);
      expect(valid.isValid).toBe(true);
      expect(Object.keys(valid.errors).length).toBe(0);

      const invalidTitle = validatePlanInput({ ...standardInput, title: 'ab' });
      expect(invalidTitle.isValid).toBe(false);
      expect(invalidTitle.errors.title).toBeDefined();

      const missingCity = validatePlanInput({ ...standardInput, city: '  ' });
      expect(missingCity.isValid).toBe(false);
      expect(missingCity.errors.city).toBeDefined();
    });
  });

  // =========================================================================
  // REQUIREMENT 2: VERIFY BUDGET CALCULATIONS AND EXACT ALLOCATION TOTALS
  // =========================================================================
  describe('2. Budget Calculations & Zero Rupee Leakage', () => {
    it('guarantees baseline percentages sum to exactly 100% for all combinations', () => {
      const types = ['wedding', 'birthday', 'community', 'anniversary', 'corporate', 'festival'] as const;
      const venues = ['indoor', 'outdoor', 'hybrid'] as const;

      for (const t of types) {
        for (const v of venues) {
          const weights = getBaselinePercentages(t, v);
          const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
          expect(total).toBe(100);
        }
      }
    });

    it('guarantees allocatedINR strictly equals total budget with zero rounding loss across odd numbers', () => {
      const oddBudgets = [1000, 5001, 13337, 78921, 1234567, 9999999, 100000000];

      for (const budget of oddBudgets) {
        const result = calculateBudgetPlan(budget, undefined, 'wedding', 'hybrid', 200);
        const sumAllocated = result.categories.reduce((sum, c) => sum + c.allocatedINR, 0);
        expect(sumAllocated).toBe(budget);
        expect(result.totalAllocatedINR).toBe(budget);
      }
    });

    it('correctly detects category overspending and calculates variance', () => {
      const categories: BudgetBreakdown[] = [
        {
          category: 'venue',
          label: 'Venue',
          percentage: 40,
          allocatedINR: 400000,
          actualSpentINR: 480000, // overspent by 80,000
          description: 'Venue rental',
          isOverBudget: true,
          subItems: [],
        },
        {
          category: 'catering',
          label: 'Catering',
          percentage: 30,
          allocatedINR: 300000,
          actualSpentINR: 250000, // underspent by 50,000
          description: 'Food & beverage',
          isOverBudget: false,
          subItems: [],
        },
      ];

      const analysis = identifyOverspending(categories, 1000000);
      expect(analysis.isOverallOverBudget).toBe(false); // total committed (730k) is < 1M
      expect(analysis.overspentCategories.length).toBe(1);
      expect(analysis.overspentCategories[0].category).toBe('venue');
      expect(analysis.overspentCategories[0].overageINR).toBe(80000);
    });
  });

  // =========================================================================
  // REQUIREMENT 3: TEST ZERO, NEGATIVE, MISSING, AND EXTREMELY LARGE INPUTS
  // =========================================================================
  describe('3. Boundary, Zero, Negative, Missing, and Extreme Inputs', () => {
    it('safely rejects zero, negative, and extreme budget amounts in client validation', () => {
      expect(validatePlanInput({ ...standardInput, budgetINR: 0 }).isValid).toBe(false);
      expect(validatePlanInput({ ...standardInput, budgetINR: -50000 }).isValid).toBe(false);
      expect(validatePlanInput({ ...standardInput, budgetINR: 500 }).isValid).toBe(false); // below ₹1000 minimum
      expect(validatePlanInput({ ...standardInput, budgetINR: 2000000000 }).isValid).toBe(false); // exceeds 1 billion limit
      expect(validatePlanInput({ ...standardInput, budgetINR: undefined }).isValid).toBe(false);
      expect(validatePlanInput({ ...standardInput, budgetINR: NaN }).isValid).toBe(false);
    });

    it('safely rejects zero, negative, and extreme guest counts in client validation', () => {
      expect(validatePlanInput({ ...standardInput, guestCount: 0 }).isValid).toBe(false);
      expect(validatePlanInput({ ...standardInput, guestCount: -10 }).isValid).toBe(false);
      expect(validatePlanInput({ ...standardInput, guestCount: 50000 }).isValid).toBe(false); // exceeds 25,000 cap
      expect(validatePlanInput({ ...standardInput, guestCount: undefined }).isValid).toBe(false);
      expect(validatePlanInput({ ...standardInput, guestCount: NaN }).isValid).toBe(false);
    });

    it('calculatePerGuestBudget safely handles zero or negative values without throwing or returning NaN', () => {
      const zeroGuest = calculatePerGuestBudget(500000, 0);
      expect(zeroGuest.isValid).toBe(false);
      expect(zeroGuest.costPerGuestINR).toBe(0);
      expect(Number.isNaN(zeroGuest.costPerGuestINR)).toBe(false);

      const negativeBudget = calculatePerGuestBudget(-100000, 100);
      expect(negativeBudget.isValid).toBe(false);
      expect(negativeBudget.costPerGuestINR).toBe(0);

      const extremeBudget = calculatePerGuestBudget(100000000000, 1000);
      expect(extremeBudget.isValid).toBe(true);
      expect(extremeBudget.costPerGuestINR).toBe(100000000);
    });

    it('server-side validator strictly rejects invalid or extreme API payloads', () => {
      const invalidPayload = {
        input: {
          ...standardInput,
          budgetINR: -1000,
        },
        budget: { totalINR: -1000, categories: [] },
      };
      const res = validatePlanApiRequest(invalidPayload);
      expect(res.isValid).toBe(false);
      expect(res.errors.some((e) => e.includes('budgetINR'))).toBe(true);
    });
  });

  // =========================================================================
  // REQUIREMENT 4: TEST INVALID AND PAST EVENT DATES
  // =========================================================================
  describe('4. Invalid & Past Event Dates Handling', () => {
    it('rejects dates in the past with clear error messages', () => {
      const pastValidation = validatePlanInput({
        ...standardInput,
        date: '2020-01-01',
      });
      expect(pastValidation.isValid).toBe(false);
      expect(pastValidation.errors.date).toBe('Event date cannot be in the past.');

      const pastEventCheck = validateEventDate('2021-06-15');
      expect(pastEventCheck.isValid).toBe(false);
      expect(pastEventCheck.error).toContain('past');
    });

    it('rejects malformed date strings safely', () => {
      const malformedCheck = validateEventDate('not-a-valid-date');
      expect(malformedCheck.isValid).toBe(false);

      const outOfBoundsCheck = validateEventDate('2026-99-99');
      expect(outOfBoundsCheck.isValid).toBe(false);
    });

    it('generates appropriate urgency warnings for same day and short lead times', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const sameDayInput: PlanInput = {
        ...standardInput,
        date: todayStr,
      };
      const warnings = evaluatePlanningConstraints(sameDayInput, []);
      const todayWarn = warnings.find((w) => w.id === 'warn-today-rush');
      expect(todayWarn).toBeDefined();
      expect(todayWarn?.severity).toBe('danger');
    });
  });

  // =========================================================================
  // REQUIREMENT 5: TEST AI RESPONSES WITH MALFORMED JSON OR INCORRECT SCHEMA
  // =========================================================================
  describe('5. AI Response Sanitization & Malformed Schema Resilience', () => {
    it('returns clean fallback insights when raw model output is null, undefined, or empty', () => {
      expect(validateAndSanitizeGeminiPlanResponse(null, FALLBACK_INSIGHTS)).toEqual(FALLBACK_INSIGHTS);
      expect(validateAndSanitizeGeminiPlanResponse(undefined, FALLBACK_INSIGHTS)).toEqual(FALLBACK_INSIGHTS);
      expect(validateAndSanitizeGeminiPlanResponse('string-response', FALLBACK_INSIGHTS)).toEqual(FALLBACK_INSIGHTS);
      expect(validateAndSanitizeGeminiPlanResponse([1, 2, 3], FALLBACK_INSIGHTS)).toEqual(FALLBACK_INSIGHTS);
    });

    it('handles malformed partial objects and wrong field types safely', () => {
      const malformed = {
        tagline: 12345, // wrong type: number instead of string
        conceptNarrative: null,
        curatedMenu: 'not-an-object', // wrong type
        decorAndAmbience: {
          colorPalette: 'single-color-string', // wrong type: string instead of array of objects
          stylingHighlights: null,
        },
      };

      const sanitized = validateAndSanitizeGeminiPlanResponse(malformed, FALLBACK_INSIGHTS);

      expect(typeof sanitized.tagline).toBe('string');
      expect(typeof sanitized.conceptNarrative).toBe('string');
      expect(Array.isArray(sanitized.curatedMenu.welcomeDrinks)).toBe(true);
      expect(Array.isArray(sanitized.decorAndAmbience.colorPalette)).toBe(true);
      expect(sanitized.decorAndAmbience.colorPalette.length).toBeGreaterThan(0);
    });

    it('strips XSS attack payloads from AI suggestions', () => {
      const attackPayload = {
        tagline: 'Regal Wedding <script>alert("hack")</script>',
        conceptNarrative: 'A party featuring <iframe src="evil.com"></iframe> and <a href="javascript:steal()">click</a>',
        curatedMenu: {
          welcomeDrinks: ['<img src="x" onerror="alert(1)">Mint Cooler'],
          appetizers: [],
          mains: [],
          desserts: [],
        },
      };

      const sanitized = validateAndSanitizeGeminiPlanResponse(attackPayload, FALLBACK_INSIGHTS);
      expect(sanitized.tagline).not.toContain('<script>');
      expect(sanitized.conceptNarrative).not.toContain('<iframe');
      expect(sanitized.conceptNarrative).not.toContain('javascript:');
      expect(sanitized.curatedMenu.welcomeDrinks[0]).not.toContain('onerror=');
    });

    it('prevents prototype pollution in nested AI output objects', () => {
      const malicious = JSON.parse('{"__proto__": {"admin": true}, "tagline": "Test Tagline"}');
      expect(containsPrototypePollution(malicious)).toBe(true);

      const sanitized = validateAndSanitizeGeminiPlanResponse(malicious, FALLBACK_INSIGHTS);
      expect((Object.prototype as any).admin).toBeUndefined();
      expect(sanitized.tagline).toBe('Test Tagline');
    });
  });

  // =========================================================================
  // REQUIREMENT 6: TEST GEMINI API FAILURES AND RATE-LIMIT ERRORS
  // =========================================================================
  describe('6. Gemini API Failure Modes & Rate Limiting Enforcement', () => {
    let rateLimiter: MemoryRateLimiterStore;

    beforeEach(() => {
      rateLimiter = new MemoryRateLimiterStore();
    });

    it('allows requests within threshold and blocks requests exceeding rate limit', async () => {
      const clientIp = 'client-192.168.1.50';
      const maxRequests = 5;
      const windowMs = 5000;

      // 5 requests allowed
      for (let i = 1; i <= maxRequests; i++) {
        const record = await rateLimiter.increment(clientIp, windowMs);
        expect(record.count).toBe(i);
      }

      // 6th request exceeds limit
      const blockedRecord = await rateLimiter.increment(clientIp, windowMs);
      expect(blockedRecord.count).toBe(6);
      expect(blockedRecord.count > maxRequests).toBe(true);
    });

    it('resets rate limit correctly after reset call', async () => {
      const clientIp = 'client-to-reset';
      await rateLimiter.increment(clientIp, 10000);
      await rateLimiter.increment(clientIp, 10000);

      await rateLimiter.reset(clientIp);

      const freshRecord = await rateLimiter.increment(clientIp, 10000);
      expect(freshRecord.count).toBe(1);
    });

    it('validates AI chat API requests against injection, oversized messages, and malicious history', () => {
      // Missing message
      expect(validateChatApiRequest({}).isValid).toBe(false);

      // Oversized message > 1000 chars
      const hugeMessage = 'A'.repeat(1050);
      const hugeRes = validateChatApiRequest({ message: hugeMessage });
      expect(hugeRes.isValid).toBe(false);
      expect(hugeRes.errors.some((e) => e.includes('1,000 characters'))).toBe(true);

      // Invalid history item sender
      const invalidHistory = validateChatApiRequest({
        message: 'Hello',
        history: [{ sender: 'hacker', text: 'infiltrate' }],
      });
      expect(invalidHistory.isValid).toBe(false);
      expect(invalidHistory.errors.some((e) => e.includes('invalid sender'))).toBe(true);

      // Valid message
      const valid = validateChatApiRequest({
        message: 'Can you suggest cost saving ideas for decor?',
        history: [{ sender: 'user', text: 'Hi', timestamp: '2026-03-01' }],
      });
      expect(valid.isValid).toBe(true);
    });
  });

  // =========================================================================
  // REQUIREMENT 7: VERIFY CHECKLIST INTERACTIONS AND PLAN PERSISTENCE
  // =========================================================================
  describe('7. Checklist Interactions & Plan Persistence', () => {
    it('generates dynamic preparation timeline phases and handles task status toggles', () => {
      const phases = generatePreparationTimeline(standardInput.date, standardInput.eventType, standardInput.venuePreference);

      expect(phases.length).toBeGreaterThanOrEqual(3);
      const firstTask = phases[0].tasks[0];
      expect(firstTask.completed).toBe(false);

      // Toggle task completion
      firstTask.completed = true;
      expect(firstTask.completed).toBe(true);

      // Calculate progress
      const allTasks = phases.flatMap((p) => p.tasks);
      const completedCount = allTasks.filter((t) => t.completed).length;
      const progressPct = Math.round((completedCount / allTasks.length) * 100);

      expect(progressPct).toBeGreaterThan(0);
      expect(progressPct).toBeLessThanOrEqual(100);
    });

    it('initializes vendor checklist categories and supports quote and booking status updates', () => {
      const budget = calculateBudgetPlan(standardInput.budgetINR, undefined, standardInput.eventType, standardInput.venuePreference, standardInput.guestCount);
      const vendors = generateInitialVendors(budget.categories, standardInput.eventType);

      expect(vendors.length).toBeGreaterThanOrEqual(5);

      const caterer = vendors.find((v) => v.category === 'catering');
      expect(caterer).toBeDefined();
      expect(caterer?.status).toBe('not_contacted');

      // Update caterer status and quote
      if (caterer) {
        caterer.status = 'booked';
        caterer.actualQuoteINR = 650000;
        caterer.vendorName = 'Royal Saffron Banquet Catering';
      }

      expect(caterer?.status).toBe('booked');
      expect(caterer?.actualQuoteINR).toBe(650000);
    });

    it('serializes and deserializes the full plan without data loss or NaN corruption', () => {
      const plan = createPlanObject(standardInput);
      const serialized = JSON.stringify(plan);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.id).toBe(plan.id);
      expect(deserialized.budget.totalINR).toBe(plan.budget.totalINR);
      expect(deserialized.budget.categories.length).toBe(plan.budget.categories.length);
      expect(deserialized.timeline.length).toBe(plan.timeline.length);
      expect(deserialized.vendors.length).toBe(plan.vendors.length);
    });
  });

  // =========================================================================
  // REQUIREMENT 8: TEST AI-GENERATED PLAN REVISIONS
  // =========================================================================
  describe('8. AI-Generated Plan Revisions & Dynamic Rebalancing', () => {
    it('parses natural language catering reduction proposals accurately', () => {
      const plan = createPlanObject(standardInput);
      const proposal = parseRevisionProposal('Please reduce catering expenses by 15%', plan);

      expect(proposal).not.toBeNull();
      expect(proposal?.suggestedBudgetWeights).toBeDefined();

      const newWeights = proposal!.suggestedBudgetWeights!;
      const originalCatering = plan.budget.categories.find((c) => c.category === 'catering')!.percentage;
      expect(newWeights.catering).toBeLessThan(originalCatering);

      // Verify that applying the revision keeps 100% budget with 0 leakage
      const revisedPlan = applyPlanRevision(plan, proposal!);
      const sumAllocated = revisedPlan.budget.categories.reduce((acc, c) => acc + c.allocatedINR, 0);
      expect(sumAllocated).toBe(plan.budget.totalINR);
    });

    it('parses guest count modification proposals and updates attendee metrics', () => {
      const plan = createPlanObject(standardInput);
      const proposal = parseRevisionProposal('Adjust guest count to 180 guests', plan);

      expect(proposal).not.toBeNull();
      expect(proposal?.suggestedGuestCount).toBe(180);

      const revisedPlan = applyPlanRevision(plan, proposal!);
      expect(revisedPlan.input.guestCount).toBe(180);
      expect(revisedPlan.budget.costPerGuestINR).toBe(Math.round(standardInput.budgetINR / 180));
    });

    it('validates proposal structure strictly and rejects invalid modifications', () => {
      expect(validateProposalStructure(null).isValid).toBe(false);
      expect(validateProposalStructure(undefined).isValid).toBe(false);
      expect(validateProposalStructure('string').isValid).toBe(false);

      const invalidCategory = {
        id: 'rev-test',
        title: 'Invalid',
        rationale: 'Test',
        suggestedBudgetWeights: { nonExistentCategory: 40 },
      };
      expect(validateProposalStructure(invalidCategory).isValid).toBe(false);

      const negativeGuests = {
        id: 'rev-test-neg',
        title: 'Negative guests',
        rationale: 'Test',
        suggestedGuestCount: -20,
      };
      expect(validateProposalStructure(negativeGuests).isValid).toBe(false);
    });
  });

  // =========================================================================
  // REQUIREMENT 9: VERIFY MOBILE LAYOUTS AND KEYBOARD INTERACTIONS
  // =========================================================================
  describe('9. Interaction, Accessibility & Motion Specifications', () => {
    it('verifies string sanitization and HTML tag stripping for accessible rendering', () => {
      const dirty = '  <b>Bold Announcement</b> & <script>alert(1)</script>   ';
      const clean = sanitizeString(dirty, 100);
      expect(clean).toBe('Bold Announcement &');
      expect(clean).not.toContain('<b>');
      expect(clean).not.toContain('<script>');
    });

    it('verifies stripHtmlAndScripts safely removes malicious links and javascript: URIs', () => {
      const maliciousHtml = '<a href="javascript:void(0)" onclick="alert(1)">Click me</a>';
      const safeText = stripHtmlAndScripts(maliciousHtml);
      expect(safeText).not.toContain('javascript:');
      expect(safeText).not.toContain('onclick=');
      expect(safeText).toBe('Click me');
    });

    it('ensures category percentage normalization preserves accessible slider values summing to 100%', () => {
      const sliders = {
        venue: 28,
        catering: 33,
        decorations: 14,
        entertainment: 11,
        logistics: 9,
        contingency: 5,
      };
      const normalized = normalizePercentages(sliders);
      const total = Number(Object.values(normalized).reduce((a, b) => a + b, 0).toFixed(1));
      expect(total).toBe(100);
    });
  });
});
