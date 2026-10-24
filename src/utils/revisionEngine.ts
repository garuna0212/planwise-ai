import {
  PlanWisePlan,
  PlanRevisionProposal,
  BudgetCategory,
  PlanInput,
} from '../types/planwise.ts';
import { CategoryWeights, normalizePercentages, calculateBudgetPlan } from './budgetEngine.ts';
import { recalculatePlan } from './planningEngine.ts';
import { formatINR } from './formatters.ts';

const VALID_CATEGORIES: BudgetCategory[] = [
  'venue',
  'catering',
  'decorations',
  'entertainment',
  'logistics',
  'contingency',
];

/**
 * Parses user natural language request into a deterministic revision proposal.
 * Supports patterns like:
 * - "Reduce catering costs by 15%"
 * - "Make this event more eco-friendly"
 * - "Shift 20000 from decor to entertainment"
 * - "Increase guest count to 150"
 * - "Reduce guest count to 80"
 * - "Increase budget to 600000"
 */
export function parseRevisionProposal(
  message: string,
  currentPlan: PlanWisePlan
): PlanRevisionProposal | null {
  const text = message.toLowerCase().trim();
  const currentWeights: CategoryWeights = {
    venue: 20,
    catering: 35,
    decorations: 15,
    entertainment: 12,
    logistics: 10,
    contingency: 8,
  };

  currentPlan.budget.categories.forEach((c) => {
    currentWeights[c.category] = c.percentage;
  });

  // Pattern 1: Eco-friendly event request
  if (text.includes('eco-friendly') || text.includes('sustainable') || text.includes('green celebration') || text.includes('zero plastic')) {
    const updatedWeights: CategoryWeights = { ...currentWeights };
    const decorCut = Math.min(updatedWeights.decorations * 0.25, 4);
    updatedWeights.decorations = Number((updatedWeights.decorations - decorCut).toFixed(1));
    updatedWeights.catering = Number((updatedWeights.catering + decorCut * 0.6).toFixed(1));
    updatedWeights.contingency = Number((updatedWeights.contingency + decorCut * 0.4).toFixed(1));

    const normalized = normalizePercentages(updatedWeights);

    return {
      id: `prop-eco-${Date.now()}`,
      title: 'Eco-Friendly & Sustainable Event Shift',
      rationale:
        'Reallocates single-use stage backdrop & imported floral budget into locally sourced organic catering, biodegradable table setups, and waste-segregation logistics.',
      changesSummary: [
        `Decorations: Reduced to ${normalized.decorations}% (eliminated single-use styrofoam & plastic)`,
        `Catering: Increased to ${normalized.catering}% (locally sourced seasonal farm ingredients & clay kulhads)`,
        `Contingency: Reinforced to ${normalized.contingency}% for green waste disposal management`,
      ],
      suggestedBudgetWeights: normalized,
      themeAdjustment: 'Sustainable Green Celebration (Plantable Seed Favors, No Single-Use Plastics)',
      specialNote: 'Ensures zero rupee budget corruption. All category percentages strictly total 100%.',
      applied: false,
    };
  }

  // Pattern 2: "Reduce [category] costs by X%"
  const reducePctMatch = text.match(/reduce\s+([a-z]+)(?:\s+costs|\s+budget|\s+expenses)?\s+by\s+(\d+(?:\.\d+)?)\s*%/);
  if (reducePctMatch) {
    const catRaw = reducePctMatch[1];
    const pctToReduce = parseFloat(reducePctMatch[2]);

    const targetCategory = VALID_CATEGORIES.find((c) => catRaw.includes(c) || c.includes(catRaw));
    if (targetCategory && pctToReduce > 0 && pctToReduce < 90) {
      const currentPct = currentWeights[targetCategory];
      const reductionAmount = Number(((currentPct * pctToReduce) / 100).toFixed(1));
      const newTargetPct = Math.max(2, Number((currentPct - reductionAmount).toFixed(1)));
      const freedPct = Number((currentPct - newTargetPct).toFixed(1));

      const updatedWeights: CategoryWeights = { ...currentWeights, [targetCategory]: newTargetPct };
      // Distribute freed percentage to contingency buffer
      updatedWeights.contingency = Number((updatedWeights.contingency + freedPct).toFixed(1));

      const normalized = normalizePercentages(updatedWeights);

      return {
        id: `prop-reduce-${targetCategory}-${Date.now()}`,
        title: `Reduce ${targetCategory.toUpperCase()} by ${pctToReduce}%`,
        rationale: `Trims ${targetCategory} allocation from ${currentPct}% down to ${normalized[targetCategory]}%, shifting ₹${Math.round((currentPlan.budget.totalINR * freedPct) / 100).toLocaleString('en-IN')} into your Contingency reserve.`,
        changesSummary: [
          `${targetCategory.toUpperCase()}: ${currentPct}% → ${normalized[targetCategory]}%`,
          `Contingency Buffer: ${currentWeights.contingency}% → ${normalized.contingency}% (+${freedPct}%)`,
        ],
        suggestedBudgetWeights: normalized,
        specialNote: 'Maintains 100% allocation balance with ₹0 rupee leakage.',
        applied: false,
      };
    }
  }

  // Pattern 3: "Shift [amount] from [category A] to [category B]"
  // e.g. "shift 20000 from decor to entertainment"
  const shiftMatch = text.match(/shift\s+(?:₹|inr\s*)?(\d+(?:,\d+)*(?:\s*k)?)\s+(?:from\s+)?([a-z]+)\s+to\s+([a-z]+)/);
  if (shiftMatch) {
    let amountStr = shiftMatch[1].replace(/,/g, '').trim();
    let amount = 0;
    if (amountStr.endsWith('k')) {
      amount = parseFloat(amountStr.slice(0, -1)) * 1000;
    } else {
      amount = parseFloat(amountStr);
    }

    const fromCatRaw = shiftMatch[2];
    const toCatRaw = shiftMatch[3];

    const fromCat = VALID_CATEGORIES.find((c) => fromCatRaw.includes(c) || c.includes(fromCatRaw));
    const toCat = VALID_CATEGORIES.find((c) => toCatRaw.includes(c) || c.includes(toCatRaw));

    if (fromCat && toCat && fromCat !== toCat && amount > 0 && currentPlan.budget.totalINR > 0) {
      const shiftPct = Number(((amount / currentPlan.budget.totalINR) * 100).toFixed(1));
      if (currentWeights[fromCat] > shiftPct + 1) {
        const updatedWeights: CategoryWeights = {
          ...currentWeights,
          [fromCat]: Number((currentWeights[fromCat] - shiftPct).toFixed(1)),
          [toCat]: Number((currentWeights[toCat] + shiftPct).toFixed(1)),
        };

        const normalized = normalizePercentages(updatedWeights);

        return {
          id: `prop-shift-${Date.now()}`,
          title: `Shift ${formatINR(amount)} from ${fromCat.toUpperCase()} to ${toCat.toUpperCase()}`,
          rationale: `Reallocates ${shiftPct}% (${formatINR(amount)}) from ${fromCat} directly into ${toCat} to enhance attendee experience.`,
          changesSummary: [
            `${fromCat.toUpperCase()}: ${currentWeights[fromCat]}% → ${normalized[fromCat]}%`,
            `${toCat.toUpperCase()}: ${currentWeights[toCat]}% → ${normalized[toCat]}%`,
          ],
          suggestedBudgetWeights: normalized,
          specialNote: 'Total budget and all arithmetic constraints remain completely intact.',
          applied: false,
        };
      }
    }
  }

  // Pattern 4: "Change/Adjust/Reduce guest count to X" or "Reduce guests to X"
  const guestMatch = text.match(/(?:change|reduce|increase|set|adjust)\s+(?:guest\s+count|guests|attendees)\s+to\s+(\d+)/);
  if (guestMatch) {
    const newGuestCount = parseInt(guestMatch[1], 10);
    if (newGuestCount >= 1 && newGuestCount <= 50000 && newGuestCount !== currentPlan.input.guestCount) {
      const oldPerGuest = currentPlan.budget.costPerGuestINR;
      const newPerGuest = Math.round(currentPlan.budget.totalINR / newGuestCount);

      return {
        id: `prop-guests-${Date.now()}`,
        title: `Adjust Guest Count to ${newGuestCount}`,
        rationale: `Updating expected attendees from ${currentPlan.input.guestCount} to ${newGuestCount}. Cost per guest will shift from ${formatINR(oldPerGuest)} to ${formatINR(newPerGuest)}.`,
        changesSummary: [
          `Guest Count: ${currentPlan.input.guestCount} → ${newGuestCount}`,
          `Budget Per Guest: ${formatINR(oldPerGuest)} → ${formatINR(newPerGuest)}`,
          `Estimated Catering Per Plate: ~${formatINR(Math.round((currentPlan.budget.totalINR * (currentWeights.catering / 100)) / newGuestCount))}`,
        ],
        suggestedGuestCount: newGuestCount,
        applied: false,
      };
    }
  }

  return null;
}

/**
 * Validates any proposal object before applying to prevent corrupting state
 */
export function validateProposalStructure(
  raw: unknown
): { isValid: boolean; proposal?: PlanRevisionProposal; error?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { isValid: false, error: 'Proposal must be a valid object.' };
  }

  const p = raw as any;
  if (typeof p.id !== 'string' || typeof p.title !== 'string' || typeof p.rationale !== 'string') {
    return { isValid: false, error: 'Proposal is missing required string fields.' };
  }

  if (p.suggestedBudgetWeights && typeof p.suggestedBudgetWeights === 'object') {
    const weights = p.suggestedBudgetWeights;
    for (const key of Object.keys(weights)) {
      if (!VALID_CATEGORIES.includes(key as BudgetCategory)) {
        return { isValid: false, error: `Invalid budget category "${key}" in proposal.` };
      }
      const val = Number(weights[key]);
      if (isNaN(val) || val < 0 || val > 100) {
        return { isValid: false, error: `Invalid percentage value for "${key}".` };
      }
    }
  }

  if (p.suggestedGuestCount !== undefined) {
    const guests = Number(p.suggestedGuestCount);
    if (isNaN(guests) || guests < 1 || guests > 50000) {
      return { isValid: false, error: 'Invalid suggested guest count.' };
    }
  }

  if (p.suggestedTotalBudgetINR !== undefined) {
    const b = Number(p.suggestedTotalBudgetINR);
    if (isNaN(b) || b < 1000 || b > 1000000000) {
      return { isValid: false, error: 'Invalid suggested total budget.' };
    }
  }

  return {
    isValid: true,
    proposal: {
      id: String(p.id),
      title: String(p.title),
      rationale: String(p.rationale),
      changesSummary: Array.isArray(p.changesSummary) ? p.changesSummary.map(String) : [],
      suggestedBudgetWeights: p.suggestedBudgetWeights,
      suggestedGuestCount: p.suggestedGuestCount,
      suggestedTotalBudgetINR: p.suggestedTotalBudgetINR,
      themeAdjustment: p.themeAdjustment ? String(p.themeAdjustment) : undefined,
      specialNote: p.specialNote ? String(p.specialNote) : undefined,
      applied: Boolean(p.applied),
    },
  };
}

/**
 * Deterministically applies a validated revision proposal to a plan.
 * Guarantees zero budget leakage and full mathematical consistency.
 */
export function applyPlanRevision(
  currentPlan: PlanWisePlan,
  proposal: PlanRevisionProposal
): PlanWisePlan {
  const inputPatch: Partial<PlanInput> = {};
  if (proposal.suggestedGuestCount) {
    inputPatch.guestCount = proposal.suggestedGuestCount;
  }
  if (proposal.suggestedTotalBudgetINR) {
    inputPatch.budgetINR = proposal.suggestedTotalBudgetINR;
  }
  if (proposal.themeAdjustment) {
    inputPatch.theme = proposal.themeAdjustment;
  }

  let weightsPatch: CategoryWeights | undefined = undefined;
  if (proposal.suggestedBudgetWeights) {
    const baselineWeights: CategoryWeights = {
      venue: 20,
      catering: 35,
      decorations: 15,
      entertainment: 12,
      logistics: 10,
      contingency: 8,
    };
    currentPlan.budget.categories.forEach((c) => {
      baselineWeights[c.category] = c.percentage;
    });

    weightsPatch = normalizePercentages({
      ...baselineWeights,
      ...proposal.suggestedBudgetWeights,
    });
  }

  const updatedPlan = recalculatePlan(currentPlan, inputPatch, weightsPatch);

  // Update chat message proposal status so the UI shows it as "Applied"
  const updatedHistory = updatedPlan.chatHistory.map((msg) => {
    if (msg.revisionProposal && msg.revisionProposal.id === proposal.id) {
      return {
        ...msg,
        revisionProposal: {
          ...msg.revisionProposal,
          applied: true,
        },
      };
    }
    return msg;
  });

  return {
    ...updatedPlan,
    chatHistory: updatedHistory,
  };
}
