# PlanWise AI 🎊

> **AI-powered Celebration & Event Planner** — Context-Aware Budgeting, Feasibility Engine & Gemini Creative Suite.

PlanWise AI is an intelligent, context-aware celebration planning engine for weddings, birthdays, community gatherings, and milestone galas. It combines **deterministic TypeScript business logic** for 100% budget math, input validation, and feasibility warnings with **Google Gemini 3.8 Flash** for creative direction, regional menu curation, and chat-based revisions.

---

## 🌟 Key Features

1. **Context-Aware Event Creation**
   - Tailored for Weddings, Birthdays, Community Melas, Anniversaries, Corporate Galas, and Festivals.
   - Captures Event Type, Date, City, Total Budget in INR (₹), Guest Count, Theme/Vibe, Indoor/Outdoor preference, and Special Requirements.

2. **Deterministic 100% Budget Allocation Engine**
   - Mathematically enforces that category allocations (`Venue`, `Catering`, `Decorations`, `Entertainment`, `Logistics`, `Contingency`) strictly total **100.0%**.
   - Zero-loss integer rupee distribution: `Sum of category allocations === Total Budget (INR)` with exact parity.
   - Calculates real-time cost per guest and catering per plate metrics.
   - Interactive category sliders with instant auto-normalization to 100%.

3. **Rule-Based Feasibility & Warning System**
   - **Date validation:** Flags past dates and compressed lead-times (<7 days for general events, <30 days for weddings).
   - **Budget-to-guest constraints:** Warns when per-guest budget is insufficient for banquet venues or multi-course dining.
   - **Monsoon & seasonal weather alert:** Detects outdoor celebrations scheduled in monsoon-prone cities (e.g. Mumbai, Pune, Goa, Delhi in June–September) and recommends waterproof canopies and indoor hall fallbacks.
   - **Large-crowd logistics warnings:** Highlights crowd control, parking, sound permits, and power backup for gatherings >300 guests.

4. **Dynamic Preparation Timeline & Countdown**
   - Chronologically scheduled milestones structured backward from event day (90–60d, 60–30d, 30–14d, 14–3d, Day-of).
   - Interactive task checkboxes with completion velocity tracking and ability to add custom tasks.

5. **Vendor Checklist & Progress Pipeline**
   - Editable vendor list covering all major categories.
   - Tracks pipeline statuses (`Not Contacted`, `Contacted`, `Negotiating`, `Booked`, `Completed`) and payment statuses (`Unpaid`, `Deposit Paid`, `Fully Paid`).
   - Clearly labels unverified initial figures as **"(Estimate)"** while tracking committed actual quotes.

6. **Gemini 3.8 Flash AI Creative Suite & Chat**
   - Server-side integration using `@google/genai` TypeScript SDK.
   - Generates thematic narrative, color swatch hex codes, regional multi-course menus (welcome drinks, appetizers, mains, desserts), styling highlights, DIY cost-saving tips, and city-specific guidance.
   - Interactive AI chat drawer for natural language plan refinements (e.g. "How to save ₹20,000 on decor", "Suggest Jain vegetarian live counters").
   - Built-in deterministic fallback ensures 100% functionality even when offline or without an API key.

7. **Local-First & Account-Free**
   - Auto-saves all changes in browser `localStorage`.
   - Export and download full plans as clean `.json` files.
   - Print and save formatted PDF summaries.

8. **Built-in Automated Testing Suite**
   - Includes Vitest unit tests in `src/utils/__tests__/budgetEngine.test.ts`.
   - Features an in-app **"Run Tests"** modal button in the navbar so judges and users can verify the deterministic math, rounding parity, validation, and rules in real-time.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Canvas Confetti
- **Backend Runtime:** Node.js 22, Express
- **AI Engine:** Google Gemini 3.8 Flash (`@google/genai` SDK)
- **Testing:** Vitest

---

## 🔒 Security & Privacy

- `GEMINI_API_KEY` is kept **exclusively server-side** via `process.env.GEMINI_API_KEY`.
- No API keys are bundled or exposed to the client browser.
- All requests proxy through `/api/gemini/*` endpoints with telemetry header `'User-Agent': 'aistudio-build'`.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Provide Gemini API key in .env
echo "GEMINI_API_KEY=your_key_here" > .env

# 3. Start development server (serves on port 3000)
npm run dev

# 4. Run automated tests
npm test
```

Access the application in your browser at `http://localhost:3000`.
