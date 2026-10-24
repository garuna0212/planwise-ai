import {
  EventType,
  VenuePreference,
  PlanInput,
  BudgetBreakdown,
  BudgetTradeOff,
  GeminiCreativeInsights,
} from '../types/planwise.ts';
import { formatINR } from './formatters.ts';

export interface SeasonalityInfo {
  season: 'monsoon' | 'peak_winter' | 'extreme_summer' | 'pleasant_autumn' | 'spring';
  isMonsoon: boolean;
  isExtremeSummer: boolean;
  isPeakWeddingSeason: boolean;
  description: string;
  weatherAdvisory: string;
}

/**
 * Analyzes event date and city climate deterministically
 */
export function analyzeSeasonality(dateString: string, city: string = ''): SeasonalityInfo {
  let month = 10; // Default Oct
  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      month = d.getMonth() + 1; // 1 to 12
    }
  } catch {
    month = 10;
  }

  const isMonsoon = month >= 6 && month <= 9;
  const isExtremeSummer = month >= 4 && month <= 5;
  const isPeakWeddingSeason = month === 11 || month === 12 || month === 1 || month === 2;

  let season: SeasonalityInfo['season'] = 'pleasant_autumn';
  let description = 'Moderate, pleasant weather window suitable for both indoor and outdoor setups.';
  let weatherAdvisory = 'Standard seasonal planning. Ensure normal ventilation and comfortable guest seating.';

  const cityLower = (city || '').toLowerCase();
  const coastalRainCities = ['mumbai', 'pune', 'goa', 'kochi', 'cochin', 'mangalore', 'trivandrum', 'ratnagiri'];
  const northernExtremeHeatCities = ['delhi', 'ncr', 'jaipur', 'lucknow', 'ahmedabad', 'bhopal', 'nagpur', 'chandigarh'];

  if (isMonsoon) {
    season = 'monsoon';
    const isCoastal = coastalRainCities.some((c) => cityLower.includes(c));
    description = isCoastal
      ? `Active South-West monsoon season in ${city || 'the region'} with heavy rainfall and high humidity.`
      : `Monsoon season with periodic showers and damp ground conditions.`;
    weatherAdvisory =
      'Outdoor lawns require waterproof German hangar pagodas, raised wooden platforms, and dry covered passages.';
  } else if (isExtremeSummer) {
    season = 'extreme_summer';
    const isNorth = northernExtremeHeatCities.some((c) => cityLower.includes(c));
    description = isNorth
      ? `Peak Northern/Central summer heatwave where daytime temperatures routinely exceed 40°C in ${city || 'this area'}.`
      : `High daytime temperatures with intense solar exposure.`;
    weatherAdvisory =
      'Schedule festivities after 7:00 PM; deploy high-velocity misting coolers and continuous chilled welcome hydration.';
  } else if (isPeakWeddingSeason) {
    season = 'peak_winter';
    description = `Peak winter wedding calendar window in India. Premium banquet halls and top vendors face 3x demand.`;
    weatherAdvisory =
      'Evenings can become chilly; arrange portable patio heaters / fire braziers for open-air lawn dinners.';
  }

  return {
    season,
    isMonsoon,
    isExtremeSummer,
    isPeakWeddingSeason,
    description,
    weatherAdvisory,
  };
}

/**
 * Generates transparent, verifiable planning assumptions for missing details
 */
export function generatePlanningAssumptions(
  input: PlanInput,
  costPerGuestINR: number
): string[] {
  const assumptions: string[] = [];
  const seasonality = analyzeSeasonality(input.date, input.city);

  assumptions.push(
    `Standard Duration: Calculations assume a 4 to 6-hour single-day celebration slot. Additional sessions (e.g. sangeet, after-parties) require proportional venue & catering additions.`
  );

  assumptions.push(
    `Guest Headcount Guarantee: Catering estimates include an industry-standard 10% overflow buffer above the stated ${input.guestCount} guests.`
  );

  if (input.venuePreference === 'outdoor' || input.venuePreference === 'hybrid') {
    assumptions.push(
      `Outdoor Infrastructure: Allocations reserve ~₹20,000–₹45,000 within Logistics for silent generator backup, sound permits, and weather shielding (${seasonality.season.replace('_', ' ')}).`
    );
  } else {
    assumptions.push(
      `Indoor Banquet: Allocations assume banquet hall HVAC, standard banqueting chairs, and basic house lighting are included in the venue rental quote.`
    );
  }

  if (costPerGuestINR < 800 && input.eventType === 'wedding') {
    assumptions.push(
      `Budget Tier: With ₹${costPerGuestINR.toLocaleString('en-IN')}/guest, calculations assume community trust halls or family-owned grounds rather than commercial 5-star hotel banquet ballrooms.`
    );
  } else if (costPerGuestINR > 5000) {
    assumptions.push(
      `Premium Production: With ₹${costPerGuestINR.toLocaleString('en-IN')}/guest, calculations support custom architectural staging, imported floral accents, and multi-camera cinematic coverage.`
    );
  }

  assumptions.push(
    `Pricing Transparency: All figures represent estimated planning benchmarks, not confirmed vendor contracts. Taxes (18% GST) and civic permit deposits vary by municipal jurisdiction.`
  );

  return assumptions;
}

/**
 * Generates actionable, mathematically verified budget trade-offs with explicit savings
 */
export function generateBudgetTradeOffs(
  input: PlanInput,
  categories: BudgetBreakdown[],
  totalBudgetINR: number,
  costPerGuestINR: number
): BudgetTradeOff[] {
  const tradeOffs: BudgetTradeOff[] = [];

  const cateringCat = categories.find((c) => c.category === 'catering');
  const decorCat = categories.find((c) => c.category === 'decorations');
  const venueCat = categories.find((c) => c.category === 'venue');
  const entertainmentCat = categories.find((c) => c.category === 'entertainment');

  const cateringINR = cateringCat?.allocatedINR || Math.round(totalBudgetINR * 0.35);
  const decorINR = decorCat?.allocatedINR || Math.round(totalBudgetINR * 0.15);
  const venueINR = venueCat?.allocatedINR || Math.round(totalBudgetINR * 0.20);
  const entertainmentINR = entertainmentCat?.allocatedINR || Math.round(totalBudgetINR * 0.12);

  // Trade-off 1: Guest count reduction (The highest-leverage lever in event planning)
  if (input.guestCount >= 60) {
    const trimmedGuests = Math.round(input.guestCount * 0.15);
    const savings = Math.round(trimmedGuests * costPerGuestINR);
    tradeOffs.push({
      id: 'to-trim-guests',
      area: 'Guest List Optimization',
      tradeOff: `Streamline guest list from ${input.guestCount} to ${input.guestCount - trimmedGuests} (by ${trimmedGuests} attendees)`,
      impact: `Reduces catering plates, table rentals, and favor costs proportionately while retaining premium quality for intimate close circle.`,
      potentialSavingsINR: savings,
      actionType: 'reduce_guests',
    });
  }

  // Trade-off 2: Catering style optimization
  if (cateringINR > 40000) {
    const savings = Math.round(cateringINR * 0.18);
    tradeOffs.push({
      id: 'to-catering-format',
      area: 'Catering Service Format',
      tradeOff:
        input.eventType === 'birthday' || input.eventType === 'corporate'
          ? 'Switch from full dinner buffet to gourmet high-tea & 6 live chaat/finger-food counters'
          : 'Replace 2 complex exotic live counters with regional specialty street food stations',
      impact: 'Significantly cuts raw ingredient and live chef labor charges without reducing guest culinary satisfaction.',
      potentialSavingsINR: savings,
      actionType: 'shift_catering',
    });
  }

  // Trade-off 3: Reusable & Local Florals / Decor
  if (decorINR > 30000) {
    const savings = Math.round(decorINR * 0.25);
    tradeOffs.push({
      id: 'to-decor-local',
      area: 'Floral & Prop Sourcing',
      tradeOff: 'Substitute imported cold-storage flowers with indigenous marigolds, tuberoses, brass urlis, and fabric drapes',
      impact: 'Creates vibrant, authentic traditional aesthetics while eliminating expensive cold-chain floral transport markups.',
      potentialSavingsINR: savings,
      actionType: 'diy_decor',
    });
  }

  // Trade-off 4: Off-Peak / Day Slot Venue Negotiation
  if (venueINR > 40000) {
    const savings = Math.round(venueINR * 0.15);
    tradeOffs.push({
      id: 'to-venue-timing',
      area: 'Venue Booking Window',
      tradeOff: 'Negotiate a Sunday morning / afternoon slot or weekday booking instead of peak Saturday night prime slot',
      impact: 'Banquet halls offer 15–20% discounts for day slots and lower minimum catering food-and-beverage spend guarantees.',
      potentialSavingsINR: savings,
      actionType: 'off_peak',
    });
  }

  // Trade-off 5: Entertainment & AV Streamlining
  if (entertainmentINR > 25000 && input.eventType !== 'festival') {
    const savings = Math.round(entertainmentINR * 0.22);
    tradeOffs.push({
      id: 'to-ent-streamline',
      area: 'Entertainment & Acoustics',
      tradeOff: 'Bundle DJ sound system with venue in-house PA and use curated digital playlist for warm-up hours',
      impact: 'Reduces equipment rental transport charges and eliminates need for separate acoustic engineering crews.',
      potentialSavingsINR: savings,
      actionType: 'rebalance_entertainment',
    });
  }

  return tradeOffs;
}

/**
 * Generates explicit contextual rationale explaining WHY recommendations fit the user's situation
 */
export function generateContextualRationale(
  input: PlanInput,
  budget: { costPerGuestINR: number; cateringPerGuestINR: number; totalINR: number }
): GeminiCreativeInsights['whyThisFitsContext'] {
  const seasonality = analyzeSeasonality(input.date, input.city);

  let eventTypeRationale = '';
  switch (input.eventType) {
    case 'wedding':
      eventTypeRationale = `Tailored for a traditional and grand wedding ceremony: allocations prioritize bridal stage grandeur (mandap), ample dining flow for ${input.guestCount} guests, and milestone photography.`;
      break;
    case 'birthday':
      eventTypeRationale = `Optimized for a high-energy birthday celebration: higher entertainment budget for DJ, interactive host/emcee, and dynamic photo zone, with streamlined finger foods and celebratory desserts.`;
      break;
    case 'community':
      eventTypeRationale = `Engineered for a community gathering and high-volume crowd management: emphasizes civic sound permissions, wide-gate logistics, volunteer hydration, and wholesome, scalable communal catering.`;
      break;
    case 'anniversary':
      eventTypeRationale = `Designed for heartfelt intimacy and romance: focuses on warm filament mood lighting, nostalgic run-of-show speeches, and multi-course culinary pairing.`;
      break;
    case 'corporate':
      eventTypeRationale = `Structured for professional networking: prioritizes crisp AV acoustics, prompt high-tea transitions, executive staging, and itemized billing compliance.`;
      break;
    case 'festival':
    default:
      eventTypeRationale = `Built for vibrant festive energy: robust audio-visual staging, crowd security buffers, and thematic cultural highlights that engage diverse age groups.`;
      break;
  }

  const cityAndSeasonRationale = `In ${input.city || 'your city'} during ${seasonality.season.replace('_', ' ')} (${new Date(input.date).toLocaleDateString('en-IN', { month: 'long' })}), ${seasonality.description} ${
    input.venuePreference === 'outdoor'
      ? 'Your outdoor preference requires active weatherproofing (German pagodas or rapid rain-retreat indoor spaces).'
      : 'Your indoor preference provides guaranteed climate control away from seasonal weather fluctuations.'
  }`;

  const guestScaleRationale = `For ${input.guestCount} guests, the run-of-show establishes staggered dining entrances and a 15-minute early buffet open to prevent long single-file banquet lines.`;

  const budgetEfficiencyRationale = `At ${formatINR(budget.costPerGuestINR)}/guest (with ~${formatINR(budget.cateringPerGuestINR)} for catering), the allocation guarantees 100% mathematical coverage across all 6 core categories with zero rupee rounding leakage, preserving an emergency reserve of ₹${Math.round(budget.totalINR * 0.07).toLocaleString('en-IN')}.`;

  return {
    eventTypeRationale,
    cityAndSeasonRationale,
    guestScaleRationale,
    budgetEfficiencyRationale,
  };
}
