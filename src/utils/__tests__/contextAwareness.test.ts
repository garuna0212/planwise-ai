import { describe, it, expect } from 'vitest';
import {
  getBaselinePercentages,
  calculateBudgetPlan,
} from '../budgetEngine.ts';
import {
  calculatePerGuestBudget,
  validateEventDate,
  generateContextAwareWarnings,
  recalculatePlan,
  identifyOverspending,
} from '../planningEngine.ts';
import {
  analyzeSeasonality,
  generatePlanningAssumptions,
  generateBudgetTradeOffs,
  generateContextualRationale,
} from '../contextEngine.ts';
import {
  parseRevisionProposal,
  validateProposalStructure,
  applyPlanRevision,
} from '../revisionEngine.ts';
import { createPlanObject } from '../storage.ts';
import { PlanInput } from '../../types/planwise.ts';

describe('Context-Aware Event Planning & Decision Engine', () => {
  const baseInput: PlanInput = {
    title: 'Priya & Rahul Grand Wedding',
    eventType: 'wedding',
    date: '2026-11-25',
    city: 'Jaipur',
    budgetINR: 1500000,
    guestCount: 200,
    theme: 'Regal Heritage & Marigold Radiance',
    venuePreference: 'hybrid',
    specialRequirements: 'Royal entryway procession, authentic Rajasthani vegetarian feast',
  };

  describe('1. Event-Specific Logic & Differentials', () => {
    it('should generate distinct budget allocations for weddings vs birthdays vs community gatherings', () => {
      const weddingWeights = getBaselinePercentages('wedding', 'indoor');
      const bdayWeights = getBaselinePercentages('birthday', 'indoor');
      const communityWeights = getBaselinePercentages('community', 'indoor');
      const corporateWeights = getBaselinePercentages('corporate', 'indoor');

      // Wedding prioritizes catering & venue
      expect(weddingWeights.catering).toBe(35);
      expect(weddingWeights.venue).toBe(25);
      expect(weddingWeights.entertainment).toBe(10);

      // Birthday prioritizes entertainment & dynamic games
      expect(bdayWeights.entertainment).toBe(15);
      expect(bdayWeights.venue).toBe(20);

      // Community prioritizes logistics, crowd safety & permits
      expect(communityWeights.logistics).toBe(15);
      expect(communityWeights.contingency).toBe(10);

      // Corporate prioritizes professional venue & staging
      expect(corporateWeights.venue).toBe(30);
      expect(corporateWeights.logistics).toBe(12);
    });

    it('should generate contextual fit rationale specific to the event type', () => {
      const weddingPlan = createPlanObject(baseInput);
      expect(weddingPlan.aiInsights.whyThisFitsContext?.eventTypeRationale).toContain('wedding');

      const bdayInput: PlanInput = {
        ...baseInput,
        eventType: 'birthday',
        title: 'Aryan 10th Birthday Blast',
      };
      const bdayPlan = createPlanObject(bdayInput);
      expect(bdayPlan.aiInsights.whyThisFitsContext?.eventTypeRationale).toContain('birthday');

      const commInput: PlanInput = {
        ...baseInput,
        eventType: 'community',
        title: 'Navratri Dandiya Night',
      };
      const commPlan = createPlanObject(commInput);
      expect(commPlan.aiInsights.whyThisFitsContext?.eventTypeRationale).toContain('community');
    });

    it('should adjust outdoor events by shifting allocation into weatherproofing logistics', () => {
      const indoor = getBaselinePercentages('wedding', 'indoor');
      const outdoor = getBaselinePercentages('wedding', 'outdoor');

      expect(outdoor.logistics).toBe(indoor.logistics + 2);
      expect(outdoor.venue).toBe(indoor.venue - 2);
    });
  });

  describe('2. City Climate & Seasonality Intelligence', () => {
    it('should flag monsoon hazards for coastal cities during June–September', () => {
      const monsoonMumbai = analyzeSeasonality('2026-07-15', 'Mumbai');
      expect(monsoonMumbai.isMonsoon).toBe(true);
      expect(monsoonMumbai.weatherAdvisory).toContain('German hangar');

      const planMonsoon = createPlanObject({
        ...baseInput,
        city: 'Mumbai',
        date: '2026-07-20',
        venuePreference: 'outdoor',
      });
      const weatherWarn = planMonsoon.warnings.find((w) => w.category === 'weather');
      expect(weatherWarn).toBeDefined();
      expect(weatherWarn?.title).toContain('Monsoon');
    });

    it('should flag extreme heatwave for North Indian cities in April–May', () => {
      const summerDelhi = analyzeSeasonality('2026-05-10', 'Delhi');
      expect(summerDelhi.isExtremeSummer).toBe(true);
      expect(summerDelhi.weatherAdvisory).toContain('mist');

      const planSummer = createPlanObject({
        ...baseInput,
        city: 'Delhi',
        date: '2026-05-10',
        venuePreference: 'outdoor',
      });
      const heatWarn = planSummer.warnings.find((w) => w.id === 'warn-weather-summer');
      expect(heatWarn).toBeDefined();
    });

    it('should identify peak Indian winter wedding demand window (Nov–Feb)', () => {
      const winterWedding = analyzeSeasonality('2026-12-15', 'Jaipur');
      expect(winterWedding.isPeakWeddingSeason).toBe(true);
      expect(winterWedding.season).toBe('peak_winter');
    });
  });

  describe('3. Dynamic Budget Changes & Leakage Guarantees', () => {
    it('should guarantee zero rupee leakage when budget changes arbitrarily', () => {
      const initialPlan = createPlanObject(baseInput);

      const testBudgets = [123456, 999999, 1500001, 7777777, 50000];
      for (const newBudget of testBudgets) {
        const recalculated = recalculatePlan(initialPlan, { budgetINR: newBudget });
        const sumAllocated = recalculated.budget.categories.reduce((a, b) => a + b.allocatedINR, 0);

        expect(sumAllocated).toBe(newBudget);
        expect(recalculated.budget.totalAllocatedINR).toBe(newBudget);
        expect(recalculated.budget.totalINR).toBe(newBudget);
      }
    });

    it('should recalculate cost per guest and catering per guest immediately upon headcount changes', () => {
      const initialPlan = createPlanObject(baseInput);
      expect(initialPlan.budget.costPerGuestINR).toBe(7500); // 1,500,000 / 200

      const scaledPlan = recalculatePlan(initialPlan, { guestCount: 300 });
      expect(scaledPlan.budget.costPerGuestINR).toBe(5000); // 1,500,000 / 300
      expect(scaledPlan.input.guestCount).toBe(300);
    });

    it('should generate critical warnings when wedding budget per guest is unfeasibly low', () => {
      const lowBudgetInput: PlanInput = {
        ...baseInput,
        budgetINR: 80000,
        guestCount: 200, // ₹400/guest
      };
      const plan = createPlanObject(lowBudgetInput);
      const budgetWarn = plan.warnings.find((w) => w.id === 'warn-wedding-budget-critical');
      expect(budgetWarn).toBeDefined();
      expect(budgetWarn?.severity).toBe('danger');
    });
  });

  describe('4. Natural Language Plan Revisions (AI Chat Assistant)', () => {
    it('should parse "Reduce catering costs by 15%" and reallocate savings to contingency without math corruption', () => {
      const plan = createPlanObject(baseInput);
      const proposal = parseRevisionProposal('Please reduce catering costs by 15%', plan);

      expect(proposal).not.toBeNull();
      expect(proposal?.suggestedBudgetWeights).toBeDefined();

      const newWeights = proposal!.suggestedBudgetWeights!;
      expect(newWeights.catering).toBeLessThan(35);
      expect(newWeights.contingency).toBeGreaterThan(7);

      // Verify that applying the proposal keeps 100% totalINR and ₹0 leakage
      const updatedPlan = applyPlanRevision(plan, proposal!);
      const sum = updatedPlan.budget.categories.reduce((a, b) => a + b.allocatedINR, 0);
      expect(sum).toBe(plan.budget.totalINR);
    });

    it('should parse "Make this event more eco-friendly" and rebalance decor and catering', () => {
      const plan = createPlanObject(baseInput);
      const proposal = parseRevisionProposal('Can we make this event more eco-friendly?', plan);

      expect(proposal).not.toBeNull();
      expect(proposal?.title).toContain('Eco-Friendly');
      expect(proposal?.themeAdjustment).toContain('Sustainable');

      const updatedPlan = applyPlanRevision(plan, proposal!);
      const sum = updatedPlan.budget.categories.reduce((a, b) => a + b.allocatedINR, 0);
      expect(sum).toBe(plan.budget.totalINR);
    });

    it('should parse "Shift 20000 from decor to entertainment"', () => {
      const plan = createPlanObject(baseInput);
      const proposal = parseRevisionProposal('Shift 20000 from decor to entertainment', plan);

      expect(proposal).not.toBeNull();
      expect(proposal?.changesSummary.length).toBeGreaterThan(0);

      const updatedPlan = applyPlanRevision(plan, proposal!);
      expect(updatedPlan.budget.totalAllocatedINR).toBe(plan.budget.totalINR);
    });

    it('should parse "Reduce guest count to 120" and adjust attendee scale', () => {
      const plan = createPlanObject(baseInput);
      const proposal = parseRevisionProposal('Reduce guest count to 120', plan);

      expect(proposal).not.toBeNull();
      expect(proposal?.suggestedGuestCount).toBe(120);

      const updatedPlan = applyPlanRevision(plan, proposal!);
      expect(updatedPlan.input.guestCount).toBe(120);
      expect(updatedPlan.budget.costPerGuestINR).toBe(Math.round(1500000 / 120));
    });

    it('should reject malformed or invalid proposal objects safely', () => {
      expect(validateProposalStructure(null).isValid).toBe(false);
      expect(validateProposalStructure({}).isValid).toBe(false);
      expect(validateProposalStructure({ id: '1', title: 'test', rationale: 'test', suggestedGuestCount: -5 }).isValid).toBe(false);
      expect(validateProposalStructure({ id: '1', title: 'test', rationale: 'test', suggestedBudgetWeights: { fakeCat: 50 } }).isValid).toBe(false);
    });
  });

  describe('5. Trustworthiness, Assumptions & Trade-offs', () => {
    it('should generate verifiable assumptions for transparent event boundaries', () => {
      const assumptions = generatePlanningAssumptions(baseInput, 7500);
      expect(assumptions.length).toBeGreaterThanOrEqual(4);
      expect(assumptions.some((a) => a.includes('Duration'))).toBe(true);
      expect(assumptions.some((a) => a.includes('Pricing Transparency'))).toBe(true);
    });

    it('should compute mathematically sound budget trade-offs with explicit savings amounts', () => {
      const plan = createPlanObject(baseInput);
      expect(plan.tradeOffs.length).toBeGreaterThanOrEqual(3);

      for (const tradeOff of plan.tradeOffs) {
        expect(tradeOff.potentialSavingsINR).toBeGreaterThan(0);
        expect(tradeOff.potentialSavingsINR).toBeLessThan(plan.budget.totalINR);
        expect(tradeOff.impact.length).toBeGreaterThan(10);
      }
    });

    it('should never claim vendor prices or availability are confirmed by default', () => {
      const plan = createPlanObject(baseInput);
      for (const vendor of plan.vendors) {
        // Vendors start as not_contacted or unverified estimate
        expect(vendor.status).not.toBe('completed');
      }
    });
  });
});
