import {
  EventType,
  VenuePreference,
  PlanInput,
  GeminiCreativeInsights,
} from '../types/planwise.ts';

const VALID_EVENT_TYPES: EventType[] = [
  'wedding',
  'birthday',
  'community',
  'anniversary',
  'corporate',
  'festival',
];

const VALID_VENUE_PREFS: VenuePreference[] = ['indoor', 'outdoor', 'hybrid'];

/**
 * Checks for prototype pollution keys in objects and arrays with circular reference guard
 */
export function containsPrototypePollution(obj: unknown, visited = new WeakSet()): boolean {
  if (!obj || typeof obj !== 'object') return false;

  if (visited.has(obj)) {
    return false; // Break circular references safely
  }
  visited.add(obj);

  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === 'object' && containsPrototypePollution(item, visited)) {
        return true;
      }
    }
    return false;
  }

  const keys = Object.getOwnPropertyNames(obj);
  for (const key of keys) {
    if (dangerousKeys.includes(key)) return true;
    try {
      const val = (obj as any)[key];
      if (val && typeof val === 'object' && containsPrototypePollution(val, visited)) {
        return true;
      }
    } catch {
      return true;
    }
  }
  return false;
}

/**
 * Strips script tags, javascript: links, event handlers, and HTML tags for defense-in-depth against XSS
 */
export function stripHtmlAndScripts(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:[^"'\s]+/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/data:text\/html[^"'\s]*/gi, '')
    .trim();
}

/**
 * Sanitizes a string: trims, strips control characters, strips scripts/HTML, and enforces length limits
 */
export function sanitizeString(val: unknown, maxLength: number, allowMultiline = false): string {
  if (typeof val !== 'string') return '';
  let cleaned = val.trim();
  if (!allowMultiline) {
    cleaned = cleaned.replace(/[\r\n\t]+/g, ' ');
  }
  // Strip null bytes and non-printable control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Defense-in-depth HTML and script stripping
  cleaned = stripHtmlAndScripts(cleaned).trim();
  return cleaned.slice(0, maxLength);
}

export interface PlanValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedInput?: PlanInput;
  sanitizedBudget?: any;
}

/**
 * Strict server-side runtime validator for POST /api/gemini/plan
 */
export function validatePlanApiRequest(body: unknown): PlanValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  if (containsPrototypePollution(body)) {
    return { isValid: false, errors: ['Malicious object properties detected.'] };
  }

  const { input, budget } = body as any;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    errors.push('Missing or invalid "input" object.');
  }

  if (!budget || typeof budget !== 'object' || Array.isArray(budget)) {
    errors.push('Missing or invalid "budget" object.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Reject oversized input strings before processing
  if (typeof input.title === 'string' && input.title.length > 200) {
    errors.push('Title exceeds maximum allowed length of 200 characters.');
  }
  if (typeof input.city === 'string' && input.city.length > 100) {
    errors.push('City exceeds maximum allowed length of 100 characters.');
  }
  if (typeof input.theme === 'string' && input.theme.length > 150) {
    errors.push('Theme exceeds maximum allowed length of 150 characters.');
  }
  if (typeof input.specialRequirements === 'string' && input.specialRequirements.length > 2000) {
    errors.push('Special requirements exceeds maximum allowed length of 2,000 characters.');
  }
  if (Array.isArray(budget.categories) && budget.categories.length > 30) {
    errors.push('Budget categories array exceeds maximum limit of 30 items.');
  }

  // Validate input fields
  const title = sanitizeString(input.title, 120);
  if (!title || title.length < 3) {
    errors.push('Title must be between 3 and 120 characters.');
  }

  const eventType = input.eventType as EventType;
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    errors.push(`Invalid eventType "${input.eventType}". Must be one of: ${VALID_EVENT_TYPES.join(', ')}.`);
  }

  const dateStr = String(input.date || '').trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    errors.push('Date must be formatted as YYYY-MM-DD.');
  } else {
    const [y, m, d] = dateStr.split('-').map(Number);
    const parsedDate = new Date(`${dateStr}T00:00:00Z`);
    if (
      m < 1 ||
      m > 12 ||
      d < 1 ||
      d > 31 ||
      y < 2000 ||
      y > 2100 ||
      isNaN(parsedDate.getTime()) ||
      parsedDate.getUTCDate() !== d ||
      parsedDate.getUTCMonth() + 1 !== m
    ) {
      errors.push('Date is out of acceptable calendar range or invalid.');
    } else {
      // Check if event date is in the past (more than 1 day ago)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const targetDate = new Date(parsedDate);
      targetDate.setUTCHours(0, 0, 0, 0);
      const diffMs = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        errors.push('Event date cannot be in the past.');
      }
    }
  }

  const city = sanitizeString(input.city, 80);
  if (!city || city.length < 2) {
    errors.push('City is required and must be between 2 and 80 characters.');
  }

  const budgetINR = Number(input.budgetINR);
  if (isNaN(budgetINR) || !Number.isFinite(budgetINR) || budgetINR < 1000 || budgetINR > 1000000000) {
    errors.push('budgetINR must be a finite number between ₹1,000 and ₹1,00,00,00,000.');
  }

  const guestCount = Number(input.guestCount);
  if (isNaN(guestCount) || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > 50000) {
    errors.push('guestCount must be an integer between 1 and 50,000.');
  }

  const venuePreference = input.venuePreference as VenuePreference;
  if (!VALID_VENUE_PREFS.includes(venuePreference)) {
    errors.push(`Invalid venuePreference "${input.venuePreference}". Must be one of: ${VALID_VENUE_PREFS.join(', ')}.`);
  }

  const theme = sanitizeString(input.theme, 100);
  const specialRequirements = sanitizeString(input.specialRequirements, 500, true);

  // Validate budget fields
  const totalBudgetINR = Number(budget.totalINR ?? budgetINR);
  if (isNaN(totalBudgetINR) || !Number.isFinite(totalBudgetINR) || totalBudgetINR < 0) {
    errors.push('Budget totalINR must be a valid non-negative finite number.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const sanitizedInput: PlanInput = {
    title,
    eventType,
    date: dateStr,
    city,
    budgetINR,
    guestCount,
    theme: theme || 'Celebration',
    venuePreference,
    specialRequirements,
  };

  return {
    isValid: true,
    errors: [],
    sanitizedInput,
    sanitizedBudget: {
      totalINR: totalBudgetINR,
      categories: Array.isArray(budget.categories) ? budget.categories.slice(0, 10) : [],
    },
  };
}

export interface SanitizedChatHistoryItem {
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

export interface ChatValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedMessage?: string;
  sanitizedPlanContext?: any;
  sanitizedHistory?: SanitizedChatHistoryItem[];
}

/**
 * Strict server-side runtime validator for POST /api/gemini/chat
 */
export function validateChatApiRequest(body: unknown): ChatValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  if (containsPrototypePollution(body)) {
    return { isValid: false, errors: ['Malicious object properties detected.'] };
  }

  const { message, planContext, history } = body as any;

  if (typeof message !== 'string') {
    errors.push('Field "message" must be a non-empty string.');
  } else if (message.length > 1000) {
    errors.push('Message exceeds maximum allowed length of 1,000 characters.');
  }

  const sanitizedMessage = sanitizeString(message, 500, true);
  if (!sanitizedMessage || sanitizedMessage.length === 0) {
    errors.push('Message cannot be empty.');
  }

  // Validate chat history if provided
  let sanitizedHistory: SanitizedChatHistoryItem[] = [];
  if (history !== undefined && history !== null) {
    if (!Array.isArray(history)) {
      errors.push('Field "history" must be an array of chat messages.');
    } else if (history.length > 25) {
      errors.push('Chat history exceeds maximum limit of 25 messages.');
    } else {
      for (let i = 0; i < history.length; i++) {
        const item = history[i];
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          errors.push(`History item at index ${i} must be a valid object.`);
          break;
        }
        if (containsPrototypePollution(item)) {
          errors.push(`Malicious properties detected in history item at index ${i}.`);
          break;
        }
        const sender = item.sender;
        if (sender !== 'user' && sender !== 'assistant') {
          errors.push(`History item at index ${i} has invalid sender "${sender}". Must be "user" or "assistant".`);
          break;
        }
        if (typeof item.text !== 'string') {
          errors.push(`History item at index ${i} must have a text string.`);
          break;
        }
        if (item.text.length > 2000) {
          errors.push(`History item at index ${i} exceeds maximum length of 2,000 characters.`);
          break;
        }
        sanitizedHistory.push({
          sender,
          text: sanitizeString(item.text, 500, true),
          timestamp: typeof item.timestamp === 'string' ? sanitizeString(item.timestamp, 30) : undefined,
        });
      }
    }
  }

  // Validate plan context if provided
  let sanitizedPlanContext: any = undefined;
  if (planContext !== undefined && planContext !== null) {
    if (typeof planContext !== 'object' || Array.isArray(planContext)) {
      errors.push('Field "planContext" must be a valid object.');
    } else {
      const input = planContext.input || {};
      sanitizedPlanContext = {
        input: {
          title: sanitizeString(input.title, 100),
          eventType: VALID_EVENT_TYPES.includes(input.eventType) ? input.eventType : 'celebration',
          city: sanitizeString(input.city, 50),
          budgetINR: Number.isFinite(Number(input.budgetINR)) && Number(input.budgetINR) > 0 ? Number(input.budgetINR) : 0,
          guestCount: Number.isInteger(Number(input.guestCount)) && Number(input.guestCount) > 0 ? Number(input.guestCount) : 0,
          theme: sanitizeString(input.theme, 100),
          venuePreference: VALID_VENUE_PREFS.includes(input.venuePreference)
            ? input.venuePreference
            : 'indoor',
        },
      };
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedMessage,
    sanitizedPlanContext,
    sanitizedHistory,
  };
}

/**
 * Strict schema validator and sanitizer for Gemini model output.
 * Ensures malformed, partial, or injection-laden model output never crashes the UI.
 */
export function validateAndSanitizeGeminiPlanResponse(
  raw: unknown,
  fallback: GeminiCreativeInsights
): GeminiCreativeInsights {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fallback;
  }

  const obj = raw as any;

  const tagline = sanitizeString(obj.tagline || fallback.tagline, 150);
  const conceptNarrative = sanitizeString(
    obj.conceptNarrative || fallback.conceptNarrative,
    1500,
    true
  );

  // Validate curatedMenu
  const rawMenu = obj.curatedMenu && typeof obj.curatedMenu === 'object' && !Array.isArray(obj.curatedMenu)
    ? obj.curatedMenu
    : {};
  const sanitizeList = (arr: unknown, fallbackArr: string[], maxLen: number) => {
    if (!Array.isArray(arr) || arr.length === 0) return fallbackArr;
    return arr
      .map((item) => sanitizeString(item, maxLen))
      .filter((s) => s.length > 0)
      .slice(0, 8);
  };

  const welcomeDrinks = sanitizeList(
    rawMenu.welcomeDrinks,
    fallback.curatedMenu.welcomeDrinks,
    100
  );
  const appetizers = sanitizeList(rawMenu.appetizers, fallback.curatedMenu.appetizers, 120);
  const mains = sanitizeList(rawMenu.mains, fallback.curatedMenu.mains, 120);
  const desserts = sanitizeList(rawMenu.desserts, fallback.curatedMenu.desserts, 100);
  const culturalNotes = sanitizeString(
    rawMenu.culturalNotes || fallback.curatedMenu.culturalNotes,
    400,
    true
  );

  // Validate decor & ambience
  const rawDecor =
    obj.decorAndAmbience && typeof obj.decorAndAmbience === 'object' && !Array.isArray(obj.decorAndAmbience)
      ? obj.decorAndAmbience
      : {};
  let colorPalette = fallback.decorAndAmbience.colorPalette;
  if (Array.isArray(rawDecor.colorPalette) && rawDecor.colorPalette.length > 0) {
    const validColors = rawDecor.colorPalette
      .filter((c: any) => c && typeof c === 'object' && typeof c.hex === 'string')
      .map((c: any) => ({
        name: sanitizeString(c.name || 'Accent', 30),
        hex: /^#[0-9A-Fa-f]{6}$/.test(String(c.hex).trim()) ? String(c.hex).trim() : '#6366f1',
      }))
      .slice(0, 5);

    if (validColors.length >= 3) {
      colorPalette = validColors;
    }
  }

  const stylingHighlights = sanitizeList(
    rawDecor.stylingHighlights,
    fallback.decorAndAmbience.stylingHighlights,
    200
  );
  const diyCostSavingIdeas = sanitizeList(
    rawDecor.diyCostSavingIdeas,
    fallback.decorAndAmbience.diyCostSavingIdeas,
    200
  );

  // Validate entertainment
  const rawEnt =
    obj.entertainmentAndActivities &&
    typeof obj.entertainmentAndActivities === 'object' &&
    !Array.isArray(obj.entertainmentAndActivities)
      ? obj.entertainmentAndActivities
      : {};
  const highlights = sanitizeList(
    rawEnt.highlights,
    fallback.entertainmentAndActivities.highlights,
    200
  );
  const runOfShowTips = sanitizeList(
    rawEnt.runOfShowTips,
    fallback.entertainmentAndActivities.runOfShowTips,
    200
  );

  const citySpecificAdvice = sanitizeString(
    obj.citySpecificAdvice || fallback.citySpecificAdvice,
    500,
    true
  );

  return {
    tagline: tagline || fallback.tagline,
    conceptNarrative: conceptNarrative || fallback.conceptNarrative,
    curatedMenu: {
      welcomeDrinks,
      appetizers,
      mains,
      desserts,
      culturalNotes,
    },
    decorAndAmbience: {
      colorPalette,
      stylingHighlights,
      diyCostSavingIdeas,
    },
    entertainmentAndActivities: {
      highlights,
      runOfShowTips,
    },
    citySpecificAdvice,
  };
}
