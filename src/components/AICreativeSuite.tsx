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
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI-Synthesized Creative Direction</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-indigo-100">
            "{aiInsights.tagline}"
          </h3>

          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            {aiInsights.conceptNarrative}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-indigo-200/80">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Theme: <strong>{input.theme}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Location: <strong>{input.city} ({input.venuePreference})</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette Swatches */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
              <Palette className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Celebration Color Palette & Swatches
            </h4>
          </div>
          <span className="text-xs text-slate-400">Click any swatch to copy HEX</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {aiInsights.decorAndAmbience.colorPalette.map((color, idx) => (
            <button
              key={idx}
              onClick={() => handleCopyHex(color.hex)}
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition text-left group flex flex-col justify-between h-28"
            >
              <div
                style={{ backgroundColor: color.hex }}
                className="w-full h-12 rounded-lg shadow-xs group-hover:scale-[1.02] transition"
              />
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {color.name}
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{color.hex}</span>
                  {copiedHex === color.hex ? (
                    <Check className="w-3 h-3 text-emerald-600" />
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Curated Regional Food & Beverage Menu
              </h4>
              <p className="text-xs text-slate-500">
                Tailored for {input.guestCount} guests in {input.city} based on catering budget allocation
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Welcome Drinks */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/80 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
              Welcome Refreshments
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {aiInsights.curatedMenu.welcomeDrinks.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Appetizers */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/80 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              Appetizers & Live Counters
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {aiInsights.curatedMenu.appetizers.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mains */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/80 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-800">
              Mains & Breads
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {aiInsights.curatedMenu.mains.map((m, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Desserts */}
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100/80 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800">
              Desserts & Mithai
            </span>
            <ul className="space-y-1.5 text-xs text-slate-700">
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
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Chef & Cultural Service Notes:</strong>{' '}
              {aiInsights.curatedMenu.culturalNotes}
            </div>
          </div>
        )}
      </div>

      {/* Decor & Entertainment Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Decor & Ambience */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Palette className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Decor & Lighting Highlights
            </h4>
          </div>

          <ul className="space-y-2 text-xs text-slate-700">
            {aiInsights.decorAndAmbience.stylingHighlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
              DIY & Cost-Saving Hacks
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Music className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Entertainment & Run-of-Show Tips
            </h4>
          </div>

          <ul className="space-y-2 text-xs text-slate-700">
            {aiInsights.entertainmentAndActivities.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Coordinator & Host Recommendations
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
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
        <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200/80 flex items-start gap-3 text-xs text-sky-900">
          <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Local City Advisory ({input.city}):</strong>{' '}
            {aiInsights.citySpecificAdvice}
          </div>
        </div>
      )}
    </div>
  );
};
