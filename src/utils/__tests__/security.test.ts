import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePlanApiRequest,
  validateChatApiRequest,
  validateAndSanitizeGeminiPlanResponse,
  containsPrototypePollution,
  sanitizeString,
  stripHtmlAndScripts,
} from '../securityValidators.ts';
import { MemoryRateLimiterStore } from '../rateLimiter.ts';
import { GeminiCreativeInsights, PlanInput } from '../../types/planwise.ts';

const MOCK_FALLBACK_INSIGHTS: GeminiCreativeInsights = {
  tagline: 'A Majestic Royal Celebration',
  conceptNarrative: 'An enchanting evening curated for your guests with timeless warmth.',
  curatedMenu: {
    welcomeDrinks: ['Kokum Cooler', 'Rose Cardamom Fizz', 'Fruit Punch'],
    appetizers: ['Paneer Tikka', 'Corn Tartlets', 'Dahi Puri Canapes', 'Spiced Cutlets'],
    mains: ['Dal Makhani', 'Paneer Lababdar', 'Subz Biryani', 'Assorted Naan', 'Garden Salad'],
    desserts: ['Gulab Jamun with Rabdi', 'Kesar Pista Kulfi', 'Fruit Tartlet'],
    culturalNotes: 'All recipes prepared with regional authenticity and dietary flexibility.',
  },
  decorAndAmbience: {
    colorPalette: [
      { name: 'Crimson', hex: '#BE123C' },
      { name: 'Gold', hex: '#F59E0B' },
      { name: 'Ivory', hex: '#FEF3C7' },
      { name: 'Emerald', hex: '#047857' },
      { name: 'Brass', hex: '#B45309' },
    ],
    stylingHighlights: ['Floral entrance arch', 'Fairy light canopy', 'Photo booth frame'],
    diyCostSavingIdeas: ['Repurpose ceremony florals', 'Brass urlis with floating candles'],
  },
  entertainmentAndActivities: {
    highlights: ['Live acoustic percussion', 'Digital trivia game', 'Curated dance playlist'],
    runOfShowTips: ['Keep toasts under 4 minutes', 'Open buffet 15 mins early'],
  },
  citySpecificAdvice: 'Secure sound permits before 10 PM in the chosen municipal zone.',
};

describe('Security & Reliability - Plan API Request Validation', () => {
  const validPayload = {
    input: {
      title: 'Aanya & Kabir Wedding Gala',
      eventType: 'wedding',
      date: '2026-11-20',
      city: 'Mumbai',
      budgetINR: 1500000,
      guestCount: 250,
      theme: 'Royal Heritage',
      venuePreference: 'hybrid',
      specialRequirements: 'Wheelchair access and Jain food counters',
    },
    budget: {
      totalINR: 1500000,
      categories: [],
    },
  };

  it('accepts valid, well-formed plan request payloads', () => {
    const res = validatePlanApiRequest(validPayload);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.sanitizedInput?.title).toBe('Aanya & Kabir Wedding Gala');
    expect(res.sanitizedInput?.budgetINR).toBe(1500000);
  });

  it('rejects non-object or null request bodies', () => {
    expect(validatePlanApiRequest(null).isValid).toBe(false);
    expect(validatePlanApiRequest(undefined).isValid).toBe(false);
    expect(validatePlanApiRequest([]).isValid).toBe(false);
    expect(validatePlanApiRequest('string').isValid).toBe(false);
  });

  it('rejects missing or corrupted input or budget containers', () => {
    expect(validatePlanApiRequest({ input: null, budget: {} }).isValid).toBe(false);
    expect(validatePlanApiRequest({ input: {}, budget: null }).isValid).toBe(false);
  });

  it('rejects invalid event types', () => {
    const malicious = JSON.parse(JSON.stringify(validPayload));
    malicious.input.eventType = 'unsupported_party_type';
    const res = validatePlanApiRequest(malicious);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('Invalid eventType'))).toBe(true);
  });

  it('rejects invalid venue preferences', () => {
    const malicious = JSON.parse(JSON.stringify(validPayload));
    malicious.input.venuePreference = 'outer_space';
    const res = validatePlanApiRequest(malicious);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('Invalid venuePreference'))).toBe(true);
  });

  it('rejects past dates or malformed calendar formats', () => {
    const past = JSON.parse(JSON.stringify(validPayload));
    past.input.date = '2020-05-10';
    const pastRes = validatePlanApiRequest(past);
    expect(pastRes.isValid).toBe(false);
    expect(pastRes.errors.some((e) => e.includes('past'))).toBe(true);

    const malformed = JSON.parse(JSON.stringify(validPayload));
    malformed.input.date = 'invalid-date';
    const malformedRes = validatePlanApiRequest(malformed);
    expect(malformedRes.isValid).toBe(false);
  });

  it('rejects out-of-range or negative budgets', () => {
    const tooLow = JSON.parse(JSON.stringify(validPayload));
    tooLow.input.budgetINR = 500; // Below ₹1,000 min
    expect(validatePlanApiRequest(tooLow).isValid).toBe(false);

    const negative = JSON.parse(JSON.stringify(validPayload));
    negative.input.budgetINR = -50000;
    expect(validatePlanApiRequest(negative).isValid).toBe(false);

    const tooHigh = JSON.parse(JSON.stringify(validPayload));
    tooHigh.input.budgetINR = 999999999999; // Exceeds 1 billion
    expect(validatePlanApiRequest(tooHigh).isValid).toBe(false);
  });

  it('rejects zero or excessive guest counts', () => {
    const zeroGuests = JSON.parse(JSON.stringify(validPayload));
    zeroGuests.input.guestCount = 0;
    expect(validatePlanApiRequest(zeroGuests).isValid).toBe(false);

    const negativeGuests = JSON.parse(JSON.stringify(validPayload));
    negativeGuests.input.guestCount = -10;
    expect(validatePlanApiRequest(negativeGuests).isValid).toBe(false);

    const excessiveGuests = JSON.parse(JSON.stringify(validPayload));
    excessiveGuests.input.guestCount = 100000; // > 50,000
    expect(validatePlanApiRequest(excessiveGuests).isValid).toBe(false);
  });

  it('rejects oversized input strings and arrays (DoS protection)', () => {
    const oversizedTitle = JSON.parse(JSON.stringify(validPayload));
    oversizedTitle.input.title = 'A'.repeat(250); // > 200 chars
    const res1 = validatePlanApiRequest(oversizedTitle);
    expect(res1.isValid).toBe(false);
    expect(res1.errors.some((e) => e.includes('maximum allowed length'))).toBe(true);

    const oversizedCategories = JSON.parse(JSON.stringify(validPayload));
    oversizedCategories.budget.categories = new Array(50).fill({ category: 'venue', allocatedINR: 100 });
    const res2 = validatePlanApiRequest(oversizedCategories);
    expect(res2.isValid).toBe(false);
    expect(res2.errors.some((e) => e.includes('exceeds maximum limit of 30'))).toBe(true);
  });

  it('rejects prototype pollution attempts in plan requests', () => {
    const maliciousPayload = JSON.parse('{"__proto__": {"isAdmin": true}, "input": {}, "budget": {}}');
    const res = validatePlanApiRequest(maliciousPayload);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('Malicious object properties'))).toBe(true);
  });
});

describe('Security & Reliability - Chat API Request Validation', () => {
  it('accepts valid chat request with message, context, and bounded history', () => {
    const body = {
      message: 'Can you recommend live food station ideas?',
      planContext: {
        input: {
          title: 'Birthday Gala',
          eventType: 'birthday',
          city: 'Bengaluru',
          budgetINR: 100000,
          guestCount: 50,
          theme: 'Retro Disco',
          venuePreference: 'indoor',
        },
      },
      history: [
        { sender: 'user', text: 'Hello', timestamp: '10:00 AM' },
        { sender: 'assistant', text: 'Hi! Ready to help plan your event.', timestamp: '10:01 AM' },
      ],
    };

    const res = validateChatApiRequest(body);
    expect(res.isValid).toBe(true);
    expect(res.sanitizedMessage).toBe('Can you recommend live food station ideas?');
    expect(res.sanitizedHistory?.length).toBe(2);
  });

  it('rejects empty or whitespace-only messages', () => {
    expect(validateChatApiRequest({ message: '' }).isValid).toBe(false);
    expect(validateChatApiRequest({ message: '   ' }).isValid).toBe(false);
    expect(validateChatApiRequest({ message: null }).isValid).toBe(false);
  });

  it('rejects oversized chat messages (> 1000 characters)', () => {
    const hugeMessage = 'A'.repeat(1200);
    const res = validateChatApiRequest({ message: hugeMessage });
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('1,000 characters'))).toBe(true);
  });

  it('rejects malformed chat history structures', () => {
    // Non-array history
    const badHistory1 = validateChatApiRequest({
      message: 'Help me',
      history: 'not-an-array',
    });
    expect(badHistory1.isValid).toBe(false);

    // Invalid sender in history
    const badHistory2 = validateChatApiRequest({
      message: 'Help me',
      history: [{ sender: 'admin_hacker', text: 'Injecting role' }],
    });
    expect(badHistory2.isValid).toBe(false);
    expect(badHistory2.errors.some((e) => e.includes('invalid sender'))).toBe(true);

    // Excessive history count (> 25 messages)
    const hugeHistory = new Array(30).fill({ sender: 'user', text: 'Ping' });
    const badHistory3 = validateChatApiRequest({
      message: 'Help me',
      history: hugeHistory,
    });
    expect(badHistory3.isValid).toBe(false);
    expect(badHistory3.errors.some((e) => e.includes('exceeds maximum limit'))).toBe(true);
  });
});

describe('Security & Reliability - Malformed AI Output Handling & Sanitization', () => {
  it('safely handles non-object, null, or corrupted AI responses without throwing', () => {
    expect(validateAndSanitizeGeminiPlanResponse(null, MOCK_FALLBACK_INSIGHTS)).toEqual(MOCK_FALLBACK_INSIGHTS);
    expect(validateAndSanitizeGeminiPlanResponse(undefined, MOCK_FALLBACK_INSIGHTS)).toEqual(MOCK_FALLBACK_INSIGHTS);
    expect(validateAndSanitizeGeminiPlanResponse('random string', MOCK_FALLBACK_INSIGHTS)).toEqual(MOCK_FALLBACK_INSIGHTS);
    expect(validateAndSanitizeGeminiPlanResponse([], MOCK_FALLBACK_INSIGHTS)).toEqual(MOCK_FALLBACK_INSIGHTS);
    expect(validateAndSanitizeGeminiPlanResponse(12345, MOCK_FALLBACK_INSIGHTS)).toEqual(MOCK_FALLBACK_INSIGHTS);
  });

  it('safely fills missing nested properties from fallback blueprint', () => {
    const partialAIOutput = {
      tagline: 'Custom AI Tagline for Celebration',
      // curatedMenu missing entirely
      // decorAndAmbience missing entirely
    };

    const sanitized = validateAndSanitizeGeminiPlanResponse(partialAIOutput, MOCK_FALLBACK_INSIGHTS);
    expect(sanitized.tagline).toBe('Custom AI Tagline for Celebration');
    expect(sanitized.curatedMenu.welcomeDrinks.length).toBeGreaterThan(0);
    expect(sanitized.decorAndAmbience.colorPalette.length).toBe(5);
  });

  it('sanitizes XSS payloads and script injection from AI generated strings', () => {
    const maliciousAIOutput = {
      tagline: 'Festive Vibes <script>alert("XSS")</script>',
      conceptNarrative: 'An evening with <iframe src="evil.com"></iframe> and javascript:void(0) links.',
      curatedMenu: {
        welcomeDrinks: ['Cooler <script>stealCookies()</script>'],
        appetizers: ['Chaat with <b onmouseover="alert(1)">Crispy Papdi</b>'],
        mains: ['Biryani'],
        desserts: ['Kulfi'],
        culturalNotes: 'Notes',
      },
    };

    const sanitized = validateAndSanitizeGeminiPlanResponse(maliciousAIOutput, MOCK_FALLBACK_INSIGHTS);
    expect(sanitized.tagline).not.toContain('<script>');
    expect(sanitized.tagline).toBe('Festive Vibes');
    expect(sanitized.conceptNarrative).not.toContain('<iframe');
    expect(sanitized.conceptNarrative).not.toContain('javascript:');
    expect(sanitized.curatedMenu.welcomeDrinks[0]).toBe('Cooler');
    expect(sanitized.curatedMenu.appetizers[0]).not.toContain('onmouseover');
  });

  it('validates color palettes and rejects non-hex values', () => {
    const badColorsAIOutput = {
      decorAndAmbience: {
        colorPalette: [
          { name: 'Red', hex: 'not-a-hex' },
          { name: 'Green', hex: 'rgba(0,0,0,1)' },
          { name: 'Blue', hex: '#123456' },
        ],
      },
    };

    const sanitized = validateAndSanitizeGeminiPlanResponse(badColorsAIOutput, MOCK_FALLBACK_INSIGHTS);
    // Non-hex strings are normalized to safe defaults without crashing
    for (const color of sanitized.decorAndAmbience.colorPalette) {
      expect(/^#[0-9A-Fa-f]{6}$/.test(color.hex)).toBe(true);
    }
  });
});

describe('Security & Reliability - Sliding Window Rate Limiter Store', () => {
  let store: MemoryRateLimiterStore;

  beforeEach(() => {
    store = new MemoryRateLimiterStore();
  });

  it('accurately increments request hits within window', async () => {
    const res1 = await store.increment('ip:192.168.1.1', 60000);
    expect(res1.count).toBe(1);

    const res2 = await store.increment('ip:192.168.1.1', 60000);
    expect(res2.count).toBe(2);

    const res3 = await store.increment('ip:192.168.1.1', 60000);
    expect(res3.count).toBe(3);
  });

  it('isolates rate limits by client key', async () => {
    await store.increment('ip:client-A', 60000);
    await store.increment('ip:client-A', 60000);

    const clientB = await store.increment('ip:client-B', 60000);
    expect(clientB.count).toBe(1);
  });

  it('resets hit count after window expiry', async () => {
    // 50ms window
    await store.increment('ip:temp', 50);
    await store.increment('ip:temp', 50);

    await new Promise((resolve) => setTimeout(resolve, 60));

    const afterExpire = await store.increment('ip:temp', 50);
    expect(afterExpire.count).toBe(1);
  });

  it('supports explicit reset for a key', async () => {
    await store.increment('ip:reset-me', 60000);
    await store.increment('ip:reset-me', 60000);
    await store.reset('ip:reset-me');

    const fresh = await store.increment('ip:reset-me', 60000);
    expect(fresh.count).toBe(1);
  });
});

describe('Security & Reliability - String Sanitization Utilities', () => {
  it('strips null bytes and control characters', () => {
    const inputWithNull = 'Celebration\x00\x08Title';
    expect(sanitizeString(inputWithNull, 50)).toBe('CelebrationTitle');
  });

  it('enforces string length constraints', () => {
    const longString = 'Super long celebratory name that goes on forever and ever';
    expect(sanitizeString(longString, 10)).toBe('Super long');
  });

  it('strips dangerous HTML tags and event handlers', () => {
    const xss = '<img src=x onerror=alert(1)>Special <b>Theme</b>';
    expect(stripHtmlAndScripts(xss)).toBe('Special Theme');
  });
});
