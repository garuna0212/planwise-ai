import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createRateLimiter } from './src/utils/rateLimiter.ts';
import {
  validatePlanApiRequest,
  validateChatApiRequest,
  validateAndSanitizeGeminiPlanResponse,
} from './src/utils/securityValidators.ts';
import { GeminiCreativeInsights } from './src/types/planwise.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security: Enforce tight 100KB request body limit to prevent memory/CPU exhaustion DoS
app.use(express.json({ limit: '100kb' }));

// Security: JSON parsing & payload-too-large error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err?.type === 'entity.too.large') {
    res.status(413).json({
      error: 'Payload too large. Maximum allowed request size is 100KB.',
      status: 413,
    });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Malformed JSON payload.',
      status: 400,
    });
    return;
  }
  next(err);
});

// Security Headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiters (protects server resources from abusive traffic)
// Architectural Note: Automatically hooks into Redis/Memorystore if REDIS_URL is provided,
// falling back to high-performance sliding-window in-memory store for single-instance or dev runtimes.
const planRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 15,
  keyPrefix: 'rl:plan:',
  message: 'Plan generation rate limit reached (max 15 per minute). Please wait a moment.',
});

const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 40,
  keyPrefix: 'rl:chat:',
  message: 'AI chat rate limit reached (max 40 per minute). Please slow down.',
});

// Lazy initialize Gemini client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    rateLimiterBackend: process.env.REDIS_URL || process.env.MEMORYSTORE_HOST ? 'distributed-redis' : 'sliding-memory',
  });
});

// Deterministic fallback generator for when Gemini API key is missing or offline
function generateFallbackCreativeInsights(input: any, budget: any): GeminiCreativeInsights {
  const city = input?.city || 'your city';
  const eventType = input?.eventType || 'celebration';
  const theme = input?.theme || 'Elegant Celebration';
  const guestCount = input?.guestCount || 100;

  return {
    tagline: `A captivating ${eventType} steeped in ${theme} in the heart of ${city}`,
    conceptNarrative: `Designed specifically for ${guestCount} guests in ${city}, this celebration blends traditional warmth with modern panache. Every element—from the welcoming aromas to the evening ambiance—is curated to maximize joy while remaining within your structured financial blueprint.`,
    curatedMenu: {
      welcomeDrinks: [
        `Kokum & Spiced Mint Cooler (Refreshing Local Favorite)`,
        `Rose Cardamom Sparkling Fizz (Celebratory Mocktail)`,
        `Fresh Pressed Seasonal Fruit Nectar`,
      ],
      appetizers: [
        `Paneer & Bell Pepper Tikka Skewers with Mint Chutney`,
        `Crispy Corn & Water Chestnut Tartlets`,
        `Mini Dahi Puri / Chaat Canapés with Tamarind Glaze`,
        `Amritsari Spiced Herb Cutlets with Coriander Dip`,
      ],
      mains: [
        `Signature Dal Makhani slow-cooked overnight with churned butter`,
        `Paneer Lababdar in rich tomato-cashew gravy`,
        `Subz Dum Biryani with caramelized onions and saffron raita`,
        `Assorted Tandoori Breads (Garlic Naan, Laccha Paratha, Missi Roti)`,
        `Crispy Garden Tossed Salad with roasted cumin dressing`,
      ],
      desserts: [
        `Warm Gulab Jamun served over artisanal rabdi`,
        `Kesar Pista Kulfi with falooda noodles and rose drizzle`,
        `Fresh Fruit Tartlets with vanilla bean glaze`,
      ],
      culturalNotes: `Menu curated with regional sensitivities appropriate for ${city}. All items prepared for easy buffet flow to prevent guest congestion during peak dinner hours.`,
    },
    decorAndAmbience: {
      colorPalette: [
        { name: 'Royal Crimson', hex: '#BE123C' },
        { name: 'Marigold Gold', hex: '#F59E0B' },
        { name: 'Warm Ivory', hex: '#FEF3C7' },
        { name: 'Peacock Emerald', hex: '#047857' },
        { name: 'Antique Brass', hex: '#B45309' },
      ],
      stylingHighlights: [
        `Dramatic floral entrance arch accented with fresh marigolds and jasmine tassels`,
        `Fairy light ceiling canopy with warm filament Edison bulbs for golden glow`,
        `Custom photo corner featuring a textured brass frame and personalized monogram backdrop`,
        `Low cocktail seating with velvet accent cushions and brass lantern centerpieces`,
      ],
      diyCostSavingIdeas: [
        `Repurpose entrance florals to frame the cake table / stage after guest arrivals conclude.`,
        `Use locally sourced brass urlis with floating candles and rose petals for high-impact low-cost table decor.`,
        `Create a digital welcome QR display instead of printing single-use card menus.`,
      ],
    },
    entertainmentAndActivities: {
      highlights: [
        `Grand Entry with live percussion / acoustic rhythm welcome`,
        `Interactive digital trivia about the guest of honor or community milestone`,
        `Curated dance playlist blending timeless classics with high-energy trending hits`,
        `Polaroid guestbook station where guests snap photos and write handwritten blessings`,
      ],
      runOfShowTips: [
        `Keep speeches and toasts under 4 minutes each to maintain vibrant party momentum.`,
        `Open food stations 15 minutes before the formal dinner announcement to avoid initial queue surges.`,
      ],
    },
    citySpecificAdvice: `In ${city}, factor in potential peak traffic around 6:30 PM to 8:00 PM for guest arrivals. Secure sound and DJ civic volume permissions in advance for outdoor venues.`,
  };
}

// POST /api/gemini/plan with runtime validation, rate limiting, and output schema enforcement
app.post('/api/gemini/plan', planRateLimiter, async (req: Request, res: Response): Promise<void> => {
  // 1. Strict runtime request validation
  const validation = validatePlanApiRequest(req.body);
  if (!validation.isValid) {
    res.status(400).json({
      error: 'Invalid celebration planning request payload.',
      details: validation.errors,
      status: 400,
    });
    return;
  }

  const { sanitizedInput, sanitizedBudget } = validation;
  const fallback = generateFallbackCreativeInsights(sanitizedInput, sanitizedBudget);

  try {
    const ai = getGeminiClient();

    // If Gemini key is not configured, safely return deterministic fallback
    if (!ai) {
      res.json({
        source: 'deterministic_engine',
        insights: fallback,
        notice: 'AI key not detected in server environment; high-fidelity deterministic plan generated.',
      });
      return;
    }

    const prompt = `You are PlanWise AI, an expert event planner specializing in Indian celebrations and global gatherings.
Generate creative and practical event concepts for the following celebration:
- Title: "${sanitizedInput!.title}"
- Event Type: "${sanitizedInput!.eventType}"
- Date: "${sanitizedInput!.date}"
- City: "${sanitizedInput!.city}"
- Budget: ₹${sanitizedInput!.budgetINR.toLocaleString('en-IN')}
- Guests: ${sanitizedInput!.guestCount}
- Theme & Vibe: "${sanitizedInput!.theme}"
- Venue Preference: "${sanitizedInput!.venuePreference}"
- Special Requirements: "${sanitizedInput!.specialRequirements || 'None'}"

CRITICAL INSTRUCTIONS:
Return a strictly valid JSON object matching the requested schema. Provide inspiring ideas tailored to ${sanitizedInput!.city}.`;

    // Security & Cost Controls:
    // 1. Strict schema definition via @google/genai Type enum
    // 2. Token limits (max 2048 tokens)
    // 3. 20-second timeout guard
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 20000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tagline: { type: Type.STRING },
            conceptNarrative: { type: Type.STRING },
            curatedMenu: {
              type: Type.OBJECT,
              properties: {
                welcomeDrinks: { type: Type.ARRAY, items: { type: Type.STRING } },
                appetizers: { type: Type.ARRAY, items: { type: Type.STRING } },
                mains: { type: Type.ARRAY, items: { type: Type.STRING } },
                desserts: { type: Type.ARRAY, items: { type: Type.STRING } },
                culturalNotes: { type: Type.STRING },
              },
              required: ['welcomeDrinks', 'appetizers', 'mains', 'desserts', 'culturalNotes'],
            },
            decorAndAmbience: {
              type: Type.OBJECT,
              properties: {
                colorPalette: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      hex: { type: Type.STRING },
                    },
                    required: ['name', 'hex'],
                  },
                },
                stylingHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                diyCostSavingIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['colorPalette', 'stylingHighlights', 'diyCostSavingIdeas'],
            },
            entertainmentAndActivities: {
              type: Type.OBJECT,
              properties: {
                highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                runOfShowTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['highlights', 'runOfShowTips'],
            },
            citySpecificAdvice: { type: Type.STRING },
          },
          required: [
            'tagline',
            'conceptNarrative',
            'curatedMenu',
            'decorAndAmbience',
            'entertainmentAndActivities',
            'citySpecificAdvice',
          ],
        },
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const rawText = response.text || '';
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(rawText.trim());
    } catch {
      // Clean possible markdown code fences if present
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    // Strict schema sanitization: ensures malformed Gemini output never breaks the frontend
    const validatedInsights = validateAndSanitizeGeminiPlanResponse(parsedData, fallback);

    res.json({
      source: 'gemini-3.8-flash',
      insights: validatedInsights,
    });
  } catch (error: any) {
    // Log minimal operational info on server; never expose stack traces or keys to client
    console.error('Error generating Gemini plan (safe log):', error?.status || error?.message || 'Operation error');
    res.json({
      source: 'fallback_after_error',
      insights: fallback,
      notice: 'AI service temporarily unavailable; loaded verified high-fidelity blueprint.',
    });
  }
});

// POST /api/gemini/chat with runtime validation, rate limiting, and output token cap
app.post('/api/gemini/chat', chatRateLimiter, async (req: Request, res: Response): Promise<void> => {
  // 1. Strict runtime request validation
  const validation = validateChatApiRequest(req.body);
  if (!validation.isValid) {
    res.status(400).json({
      error: 'Invalid chat request payload.',
      details: validation.errors,
      status: 400,
    });
    return;
  }

  const { sanitizedMessage, sanitizedPlanContext, sanitizedHistory } = validation;

  try {
    const ai = getGeminiClient();

    if (!ai) {
      res.json({
        reply: `Planning tip for "${sanitizedMessage}": For celebrations in ${sanitizedPlanContext?.input?.city || 'your area'}, consider locking in multi-purpose vendors (like a caterer providing linen & tableware) to save 12-15% of your logistics allocation. Feel free to adjust the category sliders in the Budget tab!`,
      });
      return;
    }

    const systemPrompt = `You are PlanWise AI, a helpful, polite, and precise Indian & international event planning consultant.
User event details:
- Title: ${sanitizedPlanContext?.input?.title || 'Event'}
- Type: ${sanitizedPlanContext?.input?.eventType || 'Celebration'}
- City: ${sanitizedPlanContext?.input?.city || 'City'}
- Total Budget: ₹${sanitizedPlanContext?.input?.budgetINR ? Number(sanitizedPlanContext.input.budgetINR).toLocaleString('en-IN') : 'N/A'}
- Guest Count: ${sanitizedPlanContext?.input?.guestCount || 'N/A'}
- Theme: ${sanitizedPlanContext?.input?.theme || 'Celebration'}
- Venue: ${sanitizedPlanContext?.input?.venuePreference || 'Indoor'}

Provide practical, courteous, context-aware advice for the user's inquiry.
Keep answers concise (under 180 words), structured with bullet points where helpful.
Never invent non-existent exact quotes. Emphasize realistic planning trade-offs.`;

    let conversationContext = '';
    if (sanitizedHistory && sanitizedHistory.length > 0) {
      // Include up to last 4 messages for conversational context
      const recent = sanitizedHistory.slice(-4);
      conversationContext = '\nRecent conversation:\n' +
        recent.map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
    }

    const chatContent = `${systemPrompt}${conversationContext}\n\nCurrent Question: ${sanitizedMessage}`;

    // Cost & Security Controls: Cap chat tokens to 512 tokens and add 15s timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Chat API call timed out')), 15000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContent,
      config: {
        maxOutputTokens: 512,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    res.json({
      reply: response.text || 'I have analyzed your event plan. What other details would you like to refine?',
    });
  } catch (error: any) {
    console.error('Error in chat endpoint (safe log):', error?.status || error?.message || 'Operation error');
    res.json({
      reply: `Regarding your query: To optimize your budget and logistics, check the Warnings tab for immediate feasibility advice, and refine vendor quotes in the Vendors tab.`,
    });
  }
});

// Vite Middleware mounting
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PlanWise AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
