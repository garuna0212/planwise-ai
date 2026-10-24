import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Palette,
  Compass,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { EventType, VenuePreference, PlanInput } from '../types/planwise.ts';
import { validatePlanInput } from '../utils/validation.ts';
import { formatINR } from '../utils/formatters.ts';
import { useFocusTrap } from '../utils/useFocusTrap.ts';

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (input: PlanInput, useGeminiAI: boolean) => Promise<void>;
  isGenerating: boolean;
}

const EVENT_TYPE_OPTIONS: { id: EventType; label: string; icon: string }[] = [
  { id: 'wedding', label: 'Wedding', icon: '💍' },
  { id: 'birthday', label: 'Birthday', icon: '🎂' },
  { id: 'community', label: 'Community', icon: '🤝' },
  { id: 'anniversary', label: 'Anniversary', icon: '🥂' },
  { id: 'corporate', label: 'Corporate Gala', icon: '👔' },
  { id: 'festival', label: 'Festival / Mela', icon: '🪔' },
];

const POPULAR_CITIES = [
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Jaipur',
  'Goa',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Udaipur',
];

export const EventCreationModal: React.FC<EventCreationModalProps> = ({
  isOpen,
  onClose,
  onCreatePlan,
  isGenerating,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap with focus restoration and Escape handler
  useFocusTrap(modalRef, {
    isOpen,
    onClose: isGenerating ? undefined : onClose,
    initialFocusRef: firstInputRef,
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDateStr = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [formData, setFormData] = useState<PlanInput>({
    title: '',
    eventType: 'wedding',
    date: defaultDateStr,
    city: 'Mumbai',
    budgetINR: 800000,
    guestCount: 150,
    theme: 'Royal Elegance & Warm Lanterns',
    venuePreference: 'hybrid',
    specialRequirements: '',
  });

  const [useAI, setUseAI] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePlanInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    await onCreatePlan(formData, useAI);
  };

  const handleQuickPreset = (type: EventType) => {
    if (type === 'wedding') {
      setFormData((prev) => ({
        ...prev,
        eventType: 'wedding',
        title: 'Aarav & Meera Wedding Celebration',
        budgetINR: 1500000,
        guestCount: 200,
        theme: 'Traditional Royal Rajputana with Marigold & Saffron Accents',
        venuePreference: 'hybrid',
        specialRequirements: 'Grand Baraat procession, pure veg multi-cuisine dinner buffet, live acoustic shehnai & flute.',
      }));
    } else if (type === 'birthday') {
      setFormData((prev) => ({
        ...prev,
        eventType: 'birthday',
        title: "Advik's 5th Dinosaur Jungle Safari Birthday",
        budgetINR: 75000,
        guestCount: 35,
        theme: 'Jungle Explorer & Dinosaur Footprints',
        venuePreference: 'indoor',
        specialRequirements: 'Kids activity entertainer, eggless themed cake, interactive balloon artist.',
      }));
    } else if (type === 'community') {
      setFormData((prev) => ({
        ...prev,
        eventType: 'community',
        title: 'Society Diwali & Cultural Harmony Night',
        budgetINR: 300000,
        guestCount: 250,
        theme: 'Folk Diyas, Rangoli & Live Dhol',
        venuePreference: 'outdoor',
        specialRequirements: 'Stage for youth performances, eco-friendly lights, sound permit up to 10 PM.',
      }));
    } else {
      setFormData((prev) => ({ ...prev, eventType: type }));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#6D5EF8] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Plan a New Celebration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic 100% budget, timeline, and Gemini AI insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Preset Buttons */}
          <fieldset>
            <legend className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Celebration Type
            </legend>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  aria-pressed={formData.eventType === opt.id}
                  onClick={() => handleQuickPreset(opt.id)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-[#6D5EF8] ${
                    formData.eventType === opt.id
                      ? 'border-[#6D5EF8] bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9] font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">{opt.icon}</span>
                  <span className="text-xs truncate w-full">{opt.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Title with accessible label association */}
          <div>
            <label
              htmlFor="create-event-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="create-event-title"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'create-event-title-error' : undefined}
              placeholder="e.g., Ananya & Kabir's Wedding Celebration"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden transition bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                errors.title
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 dark:border-slate-700 focus:border-[#6D5EF8] focus:ring-2 focus:ring-[#6D5EF8]/20'
              }`}
            />
            {errors.title && (
              <p id="create-event-title-error" role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                {errors.title}
              </p>
            )}
          </div>

          {/* Date & City Grid with accessible labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="create-event-date"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Event Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-event-date"
                type="date"
                required
                aria-required="true"
                min={todayStr}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? 'create-event-date-error' : undefined}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden transition bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                  errors.date
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 focus:border-[#6D5EF8] focus:ring-2 focus:ring-[#6D5EF8]/20'
                }`}
              />
              {errors.date && (
                <p id="create-event-date-error" role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.date}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="create-event-city"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                City / Location <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-event-city"
                type="text"
                required
                aria-required="true"
                list="create-city-options"
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? 'create-event-city-error' : undefined}
                placeholder="e.g., Mumbai, Jaipur, Bengaluru"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden transition bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                  errors.city
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 focus:border-[#6D5EF8] focus:ring-2 focus:ring-[#6D5EF8]/20'
                }`}
              />
              <datalist id="create-city-options">
                {POPULAR_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.city && (
                <p id="create-event-city-error" role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.city}
                </p>
              )}
            </div>
          </div>

          {/* Budget & Guest Count Grid with accessible labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="create-event-budget"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Total Budget (INR) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-mono font-bold text-[#6D5EF8] dark:text-[#9B8FF9] tabular-nums">
                  {formatINR(formData.budgetINR)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm" aria-hidden="true">₹</span>
                <input
                  id="create-event-budget"
                  type="number"
                  required
                  aria-required="true"
                  min={1000}
                  step={5000}
                  aria-invalid={!!errors.budgetINR}
                  aria-describedby={errors.budgetINR ? 'create-event-budget-error' : undefined}
                  value={formData.budgetINR || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetINR: Number(e.target.value) })
                  }
                  className={`w-full pl-8 pr-3.5 py-2 rounded-xl border text-sm focus:outline-hidden transition font-mono tabular-nums bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                    errors.budgetINR
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 dark:border-slate-700 focus:border-[#6D5EF8] focus:ring-2 focus:ring-[#6D5EF8]/20'
                  }`}
                />
              </div>
              {errors.budgetINR && (
                <p id="create-event-budget-error" role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.budgetINR}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="create-event-guests"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Guest Count <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  ~₹
                  {Math.round(
                    (formData.budgetINR || 0) / Math.max(1, formData.guestCount || 1)
                  ).toLocaleString('en-IN')}
                  /person
                </span>
              </div>
              <input
                id="create-event-guests"
                type="number"
                required
                aria-required="true"
                min={1}
                max={25000}
                aria-invalid={!!errors.guestCount}
                aria-describedby={errors.guestCount ? 'create-event-guests-error' : undefined}
                value={formData.guestCount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, guestCount: Number(e.target.value) })
                }
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden transition bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
                  errors.guestCount
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 dark:border-slate-700 focus:border-[#6D5EF8] focus:ring-2 focus:ring-[#6D5EF8]/20'
                }`}
              />
              {errors.guestCount && (
                <p id="create-event-guests-error" role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.guestCount}
                </p>
              )}
            </div>
          </div>

          {/* Theme & Venue Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="create-event-theme"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Theme / Vibe Concept
              </label>
              <input
                id="create-event-theme"
                type="text"
                placeholder="e.g. Bohemian Sunset, Royal Rajputana, Cyberpunk Neon"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#6D5EF8] focus:ring-2 focus:ring-[#6D5EF8]/20 transition"
              />
            </div>

            <fieldset>
              <legend className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Venue Preference
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(['indoor', 'outdoor', 'hybrid'] as VenuePreference[]).map((pref) => (
                  <button
                    type="button"
                    key={pref}
                    aria-pressed={formData.venuePreference === pref}
                    onClick={() => setFormData({ ...formData, venuePreference: pref })}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border capitalize transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8] ${
                      formData.venuePreference === pref
                        ? 'border-[#6D5EF8] bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Special Requirements */}
          <div>
            <label
              htmlFor="create-event-special"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Special Requirements & Preferences (Optional)
            </label>
            <textarea
              id="create-event-special"
              rows={2}
              placeholder="e.g. Pure Jain vegetarian catering, elderly wheelchair access, sound permit required till 11 PM, surprise anniversary montage video."
              value={formData.specialRequirements}
              onChange={(e) =>
                setFormData({ ...formData, specialRequirements: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#6D5EF8] focus:ring-2 focus:ring-[#6D5EF8]/20 transition resize-none"
            />
          </div>

          {/* Gemini AI toggle with accessible label */}
          <div className="p-3 bg-[#EEECFE]/40 dark:bg-[#6D5EF8]/10 rounded-xl border border-[#6D5EF8]/20 flex items-start gap-3">
            <input
              type="checkbox"
              id="create-ai-toggle"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#6D5EF8] focus:ring-[#6D5EF8] focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
            />
            <label htmlFor="create-ai-toggle" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-[#6D5EF8] dark:text-[#9B8FF9] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Synthesize Personalized Menus & Decor with Gemini AI
              </span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                Uses Google Gemini via secure server-side SDK to craft regional menus, color palettes, and entertainment flows.
              </p>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#6D5EF8] hover:bg-[#5B4CE6] text-white shadow-md shadow-[#6D5EF8]/20 disabled:opacity-60 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6D5EF8]"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                <span>Generating Blueprint...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Create Celebration Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
