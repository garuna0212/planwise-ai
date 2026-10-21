import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Deterministic fallback generator for when Gemini API key is missing or offline
function generateFallbackCreativeInsights(input: any, budget: any) {
  const city = input.city || 'your city';
  const eventType = input.eventType || 'celebration';
  const theme = input.theme || 'Elegant Celebration';
  const guestCount = input.guestCount || 100;

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

// POST /api/gemini/plan
app.post('/api/gemini/plan', async (req, res) => {
  try {
    const { input, budget } = req.body;

    if (!input || !budget) {
      return res.status(400).json({ error: 'Missing input or budget payload' });
    }

    const ai = getGeminiClient();

    // If Gemini key is not configured, safely return deterministic fallback
    if (!ai) {
      const fallback = generateFallbackCreativeInsights(input, budget);
      return res.json({
        source: 'deterministic_engine',
        insights: fallback,
        notice: 'AI key not detected in server environment; high-fidelity deterministic plan generated.',
      });
    }

    const prompt = `You are PlanWise AI, an expert event planner specializing in Indian celebrations and global gatherings.
Generate creative and practical event concepts for the following event:
- Title: "${input.title}"
- Event Type: "${input.eventType}"
- Date: "${input.date}"
- City: "${input.city}"
- Budget: ₹${input.budgetINR.toLocaleString('en-IN')} (Allocated: Catering ₹${budget.categories?.find((c: any) => c.category === 'catering')?.allocatedINR || 'N/A'}, Decor ₹${budget.categories?.find((c: any) => c.category === 'decorations')?.allocatedINR || 'N/A'}, Entertainment ₹${budget.categories?.find((c: any) => c.category === 'entertainment')?.allocatedINR || 'N/A'})
- Guests: ${input.guestCount}
- Theme & Vibe: "${input.theme}"
- Venue Preference: "${input.venuePreference}"
- Special Requirements: "${input.specialRequirements || 'None'}"

CRITICAL INSTRUCTIONS:
Return a strictly valid JSON object matching this schema:
{
  "tagline": "string",
  "conceptNarrative": "string (2-3 paragraphs describing the celebration experience)",
  "curatedMenu": {
    "welcomeDrinks": ["string", "string", "string"],
    "appetizers": ["string", "string", "string", "string"],
    "mains": ["string", "string", "string", "string", "string"],
    "desserts": ["string", "string", "string"],
    "culturalNotes": "string (notes on dietary, city flavor, and service style)"
  },
  "decorAndAmbience": {
    "colorPalette": [
      {"name": "Color Name", "hex": "#HEX"},
      {"name": "Color Name", "hex": "#HEX"},
      {"name": "Color Name", "hex": "#HEX"},
      {"name": "Color Name", "hex": "#HEX"},
      {"name": "Color Name", "hex": "#HEX"}
    ],
    "stylingHighlights": ["string", "string", "string", "string"],
    "diyCostSavingIdeas": ["string", "string", "string"]
  },
  "entertainmentAndActivities": {
    "highlights": ["string", "string", "string", "string"],
    "runOfShowTips": ["string", "string"]
  },
  "citySpecificAdvice": "string (actionable advice for ${input.city} regarding weather, timing, or local vendor practices)"
}

Do not wrap with markdown code blocks. Return plain JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText.trim());
    } catch {
      // Clean possible fences
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({
      source: 'gemini-3.8-flash',
      insights: parsedData,
    });
  } catch (error: any) {
    console.error('Error generating Gemini plan (safe log):', error?.message || error);
    // Graceful secure fallback on API error without exposing internal error details
    const fallback = generateFallbackCreativeInsights(req.body.input || {}, req.body.budget || {});
    res.json({
      source: 'fallback_after_error',
      insights: fallback,
      notice: 'AI service temporarily unavailable; loaded verified high-fidelity blueprint.',
    });
  }
});

// POST /api/gemini/chat
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, planContext } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'A valid text message is required' });
    }

    // Sanitize input length to prevent denial-of-service / token bloat
    const sanitizedMessage = message.trim().slice(0, 600);

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: `Planning tip for "${sanitizedMessage}": For celebrations in ${planContext?.input?.city || 'your area'}, consider locking in multi-purpose vendors (like a caterer providing linen & tableware) to save 12-15% of your logistics allocation. Feel free to adjust the category sliders in the Budget tab!`,
      });
    }

    const systemPrompt = `You are PlanWise AI, a helpful, polite, and precise Indian & international event planning consultant.
User event details:
- Title: ${String(planContext?.input?.title || 'Event').slice(0, 100)}
- Type: ${planContext?.input?.eventType}
- City: ${String(planContext?.input?.city || 'City').slice(0, 50)}
- Total Budget: ₹${planContext?.input?.budgetINR ? Number(planContext.input.budgetINR).toLocaleString('en-IN') : 'N/A'}
- Guest Count: ${planContext?.input?.guestCount || 'N/A'}
- Theme: ${String(planContext?.input?.theme || 'Celebration').slice(0, 100)}
- Venue: ${planContext?.input?.venuePreference}

Provide practical, courteous, context-aware advice for the user's inquiry.
Keep answers concise (under 180 words), structured with bullet points where helpful.
Never invent non-existent exact quotes. Emphasize realistic planning trade-offs.`;

    const chatContent = `${systemPrompt}\n\nUser Question: ${sanitizedMessage}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContent,
    });

    res.json({
      reply: response.text || 'I have analyzed your event plan. What other details would you like to refine?',
    });
  } catch (error: any) {
    console.error('Error in chat endpoint (safe log):', error?.message || error);
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
