import React, { useState } from 'react';
import {
  Sparkles,
  UtensilsCrossed,
  Palette,
  Music,
  MapPin,
  Check,
  Copy,
  Lightbulb,
  Compass,
} from 'lucide-react';
import { PlanWisePlan } from '../types/planwise.ts';

interface AICreativeSuiteProps {
  plan: PlanWisePlan;
}

export const AICreativeSuite: React.FC<AICreativeSuiteProps> = ({ plan }) => {
  const { aiInsights, input } = plan;
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Theme Concept Hero */}
      <div className="bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#2E1065] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden border border-[#6D5EF8]/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6D5EF8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6D5EF8]/20 text-[#EEECFE] border border-[#6D5EF8]/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#9B8FF9]" />
            <span>AI-Synthesized Creative Direction</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-slate-100">
            "{aiInsights.tagline}"
          </h3>

          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            {aiInsights.conceptNarrative}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#9B8FF9]" />
              <span>Theme: <strong>{input.theme}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#9B8FF9]" />
              <span>Location: <strong>{input.city} ({input.venuePreference})</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Fit: Why Each Recommendation Fits Your Situation */}
      {aiInsights.whyThisFitsContext && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Context-Aware Rationale: Why These Recommendations Fit Your Situation
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explicit reasoning grounded in your celebration type, city climate, attendee scale, and budget.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <div className="text-[11px] font-bold text-[#6D5EF8] dark:text-[#9B8FF9] uppercase tracking-wider flex items-center gap-1.5">
                <span>🎯 Event Type Focus ({input.eventType})</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {aiInsights.whyThisFitsContext.eventTypeRationale}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <div className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🌤️ City & Seasonality ({input.city})</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {aiInsights.whyThisFitsContext.cityAndSeasonRationale}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <div className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>👥 Attendee Scale ({input.guestCount} Guests)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {aiInsights.whyThisFitsContext.guestScaleRationale}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>💰 Budget Distribution Math</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {aiInsights.whyThisFitsContext.budgetEfficiencyRationale}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Color Palette Swatches */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
              <Palette className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Celebration Color Palette & Swatches
            </h4>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">Click swatch to copy HEX</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {aiInsights.decorAndAmbience.colorPalette.map((color, idx) => (
            <button
              key={idx}
              onClick={() => handleCopyHex(color.hex)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#6D5EF8] dark:hover:border-[#6D5EF8] hover:shadow-xs transition text-left group flex flex-col justify-between h-28 bg-white dark:bg-slate-800/60"
            >
              <div
                style={{ backgroundColor: color.hex }}
                className="w-full h-12 rounded-lg shadow-xs group-hover:scale-[1.02] transition"
              />
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {color.name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>{color.hex}</span>
                  {copiedHex === color.hex ? (
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Curated Food & Beverage Menu */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Curated Regional Food & Beverage Menu
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailored for {input.guestCount} guests in {input.city} based on catering budget allocation
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Welcome Drinks */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/40 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Welcome Refreshments
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {aiInsights.curatedMenu.welcomeDrinks.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Appetizers */}
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Appetizers & Live Counters
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {aiInsights.curatedMenu.appetizers.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mains */}
          <div className="p-4 rounded-xl bg-[#EEECFE]/50 dark:bg-[#6D5EF8]/10 border border-[#6D5EF8]/20 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6D5EF8] dark:text-[#9B8FF9]">
              Mains & Breads
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {aiInsights.curatedMenu.mains.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#6D5EF8] font-bold">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Desserts */}
          <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/40 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300">
              Desserts & Mithai
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              {aiInsights.curatedMenu.desserts.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {aiInsights.curatedMenu.culturalNotes && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-slate-200">Chef & Cultural Service Notes:</strong>{' '}
              {aiInsights.curatedMenu.culturalNotes}
            </div>
          </div>
        )}
      </div>

      {/* Decor & Entertainment Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Decor & Ambience */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]">
              <Palette className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Decor & Lighting Highlights
            </h4>
          </div>

          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {aiInsights.decorAndAmbience.stylingHighlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6D5EF8] mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2">
              DIY & Cost-Saving Hacks
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {aiInsights.decorAndAmbience.diyCostSavingIdeas.map((idea, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{idea}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Entertainment & Host Flow */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Music className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Entertainment & Run-of-Show Tips
            </h4>
          </div>

          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            {aiInsights.entertainmentAndActivities.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Coordinator & Host Recommendations
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {aiInsights.entertainmentAndActivities.runOfShowTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* City Specific Advisory */}
      {aiInsights.citySpecificAdvice && (
        <div className="bg-sky-50/70 dark:bg-sky-950/30 p-4 rounded-2xl border border-sky-200/80 dark:border-sky-900/60 flex items-start gap-3 text-xs text-sky-900 dark:text-sky-200">
          <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Local City Advisory ({input.city}):</strong>{' '}
            {aiInsights.citySpecificAdvice}
          </div>
        </div>
      )}
    </div>
  );
};
