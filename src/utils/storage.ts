import { PlanWisePlan, PlanInput } from '../types/planwise.ts';
import { calculateBudgetPlan } from './budgetEngine.ts';
import { generatePreparationTimeline } from './timelineEngine.ts';
import { generateInitialVendors } from './vendorEngine.ts';
import {
  generateContextAwareWarnings,
  identifyOverspending,
} from './planningEngine.ts';

const ACTIVE_PLAN_KEY = 'planwise_active_plan_v1';
const SAVED_PLANS_KEY = 'planwise_saved_plans_list_v1';

import {
  generatePlanningAssumptions,
  generateBudgetTradeOffs,
  generateContextualRationale,
} from './contextEngine.ts';

/**
 * Creates a complete PlanWisePlan object using deterministic engine + initial insights
 */
export function createPlanObject(
  input: PlanInput,
  customPercentages?: any,
  aiInsightsOverride?: any
): PlanWisePlan {
  const budget = calculateBudgetPlan(
    input.budgetINR,
    customPercentages,
    input.eventType,
    input.venuePreference,
    input.guestCount
  );

  const overspendAnalysis = identifyOverspending(budget.categories, input.budgetINR);
  const warnings = generateContextAwareWarnings(input, budget.categories, overspendAnalysis);
  const timeline = generatePreparationTimeline(input.date, input.eventType, input.venuePreference);
  const vendors = generateInitialVendors(budget.categories, input.eventType);
  const assumptions = generatePlanningAssumptions(input, budget.costPerGuestINR);
  const tradeOffs = generateBudgetTradeOffs(input, budget.categories, budget.totalINR, budget.costPerGuestINR);
  const contextualRationale = generateContextualRationale(input, budget);

  const defaultInsights = {
    tagline: `An unforgettable ${input.eventType} celebration in ${input.city}`,
    conceptNarrative: `Crafted for ${input.guestCount} guests in ${input.city}, this event centers on a stunning "${input.theme}" aesthetic with seamless transitions from arrival to finale.`,
    curatedMenu: {
      welcomeDrinks: [
        'Spiced Hibiscus & Mint Sparkler',
        'Traditional Rose Cardamom Sherbet',
        'Zesty Kokum Jaljeera with Boondi',
      ],
      appetizers: [
        'Crispy Lotus Stem in Sweet Chili Glaze',
        'Paneer Tikka with Smoked Bell Peppers',
        'Stuffed Mushroom Crostini with Fresh Herbs',
        'Mini Vegetable Samosa Cones with Tamarind Dip',
      ],
      mains: [
        'Slow-Cooked Dal Makhani with Churned Butter',
        'Paneer Butter Masala in Cashew Velouté',
        'Kashmiri Dum Pulao with Fried Nuts and Saffron',
        'Assorted Oven Tandoori Breads (Garlic Naan, Roti)',
        'Cucumber & Pomegranate Mint Raita',
      ],
      desserts: [
        'Hot Gulab Jamun over Saffron Rabdi',
        'Mango Shrikhand Tartlets with Pistachio Dust',
        'Baked Rasgulla with Cardamom Cream',
      ],
      culturalNotes: `Menu balanced with crowd favorites for ${input.city}, ensuring swift service flow for ${input.guestCount} guests.`,
    },
    decorAndAmbience: {
      colorPalette: [
        { name: 'Imperial Crimson', hex: '#BE123C' },
        { name: 'Warm Amber Gold', hex: '#F59E0B' },
        { name: 'Ivory Cream', hex: '#FEF3C7' },
        { name: 'Emerald Velvet', hex: '#047857' },
        { name: 'Aged Brass', hex: '#92400E' },
      ],
      stylingHighlights: [
        'Entrance arch featuring fresh floral ropes and ambient fairy light drapes',
        'Warm candlelight votives and brass urlis on cocktail tables',
        'Custom photo backdrop with thematic geometric lattice & guest names',
        'Soft amber uplighting illuminating the perimeter walls',
      ],
      diyCostSavingIdeas: [
        'Rent brass props locally rather than buying customized one-off decor',
        'Use potted plants and ferns as centerpieces that can be reused at home',
        'Digital QR code placards for table menus instead of individual printing',
      ],
    },
    entertainmentAndActivities: {
      highlights: [
        'Live acoustic instrument / percussion arrival set',
        'Engaging host-led trivia & celebration games',
        'Curated high-energy dance playlist with DJ coordination',
        'Audio or polaroid guestbook station for keepsake memories',
      ],
      runOfShowTips: [
        'Announce food stations 15 minutes before opening to spread the crowd',
        'Limit speeches to 3-4 minutes each to maintain party momentum',
      ],
    },
    citySpecificAdvice: `In ${input.city}, check venue local noise curfews (typically 10:00 PM for outdoor amplification) and factor in 45 minutes buffer for guest transit.`,
    whyThisFitsContext: contextualRationale,
  };

  const finalInsights = aiInsightsOverride
    ? {
        ...aiInsightsOverride,
        whyThisFitsContext: aiInsightsOverride.whyThisFitsContext || contextualRationale,
      }
    : defaultInsights;

  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    input,
    budget,
    warnings,
    timeline,
    vendors,
    aiInsights: finalInsights,
    assumptions,
    tradeOffs,
    chatHistory: [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `Hello! I'm your PlanWise AI coordinator for "${input.title}". I've initialized your deterministic 100% budget, vendor checklist, and timeline. You can ask me to revise menus, suggest cost-saving ideas, or adapt for weather!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };
}

/**
 * Pre-seeded sample plans for instant exploration
 */
export function getSamplePlans(): PlanWisePlan[] {
  // 1. Wedding sample
  const sample1Input: PlanInput = {
    title: "Ananya & Kabir's Royal Heritage Wedding",
    eventType: 'wedding',
    date: '2026-11-20',
    city: 'Jaipur',
    budgetINR: 1800000,
    guestCount: 250,
    theme: 'Royal Rajputana Heritage & Marigold Elegance',
    venuePreference: 'hybrid',
    specialRequirements: 'Grand Baraat procession with dhol, pure vegetarian gourmet feast, sunset phera ceremony under open courtyard.',
  };
  const plan1 = createPlanObject(sample1Input);

  // 2. Birthday sample
  const sample2Input: PlanInput = {
    title: "Vivaan's 10th Birthday Space Odyssey",
    eventType: 'birthday',
    date: '2026-11-08',
    city: 'Bengaluru',
    budgetINR: 120000,
    guestCount: 40,
    theme: 'Cosmic Galaxy & Astronaut Quest',
    venuePreference: 'indoor',
    specialRequirements: 'Interactive science tricks counter, planet cupcakes, zero-waste biodegradable tableware.',
  };
  const plan2 = createPlanObject(sample2Input);

  // 3. Community event sample
  const sample3Input: PlanInput = {
    title: 'Greenwood Heights Grand Diwali Mela',
    eventType: 'community',
    date: '2026-11-01',
    city: 'Mumbai',
    budgetINR: 450000,
    guestCount: 350,
    theme: 'Traditional Diyas & Folk Melodies',
    venuePreference: 'outdoor',
    specialRequirements: 'Community talent show stage, sweet distribution counters, eco-friendly LED sparklers for children.',
  };
  const plan3 = createPlanObject(sample3Input);

  return [plan1, plan2, plan3];
}

/**
 * Loads current active plan from localStorage, or falls back to first sample plan
 */
export function loadActivePlan(): PlanWisePlan {
  try {
    const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.input) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load active plan from localStorage:', e);
  }

  const samples = getSamplePlans();
  saveActivePlan(samples[0]);
  savePlanToSavedList(samples[0]);
  savePlanToSavedList(samples[1]);
  savePlanToSavedList(samples[2]);
  return samples[0];
}

/**
 * Saves current active plan to localStorage
 */
export function saveActivePlan(plan: PlanWisePlan): void {
  try {
    localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
    savePlanToSavedList(plan);
  } catch (e) {
    console.error('Failed to save active plan:', e);
  }
}

/**
 * Saves/updates a plan in the saved plans list
 */
export function savePlanToSavedList(plan: PlanWisePlan): void {
  try {
    const existingList = getSavedPlansList();
    const index = existingList.findIndex((p) => p.id === plan.id);
    if (index >= 0) {
      existingList[index] = plan;
    } else {
      existingList.unshift(plan);
    }
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(existingList));
  } catch (e) {
    console.error('Failed to update saved plans list:', e);
  }
}

/**
 * Retrieves all saved plans from localStorage
 */
export function getSavedPlansList(): PlanWisePlan[] {
  try {
    const raw = localStorage.getItem(SAVED_PLANS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (e) {
    console.warn('Failed to read saved plans list:', e);
  }
  return [];
}

/**
 * Deletes a plan from saved list
 */
export function deletePlanFromSavedList(planId: string): void {
  try {
    const list = getSavedPlansList().filter((p) => p.id !== planId);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to delete plan:', e);
  }
}

/**
 * Exports plan as downloadable JSON file
 */
export function exportPlanAsJSON(plan: PlanWisePlan): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const cleanTitle = plan.input.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  downloadAnchor.setAttribute('download', `planwise-${cleanTitle}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
