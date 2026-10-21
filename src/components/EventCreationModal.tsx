import React, { useState } from 'react';
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

  React.useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isGenerating) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isGenerating, onClose]);

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
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-slate-900">
                Plan a New Celebration
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic 100% budget, timeline, and Gemini AI insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Select Celebration Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => handleQuickPreset(opt.id)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    formData.eventType === opt.id
                      ? 'border-indigo-600 bg-indigo-50/90 text-indigo-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs truncate w-full">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Ananya & Kabir's Wedding Celebration"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 transition ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
          </div>

          {/* Date & City Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 transition ${
                    errors.date
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
              </div>
              {errors.date && <p className="text-xs text-rose-600 mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="city-options"
                placeholder="e.g., Mumbai, Jaipur, Bengaluru"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 transition ${
                  errors.city
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              <datalist id="city-options">
                {POPULAR_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.city && <p className="text-xs text-rose-600 mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* Budget & Guest Count Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Total Budget (INR) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {formatINR(formData.budgetINR)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  min={1000}
                  step={5000}
                  value={formData.budgetINR || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetINR: Number(e.target.value) })
                  }
                  className={`w-full pl-8 pr-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 transition font-mono ${
                    errors.budgetINR
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
              </div>
              {errors.budgetINR && <p className="text-xs text-rose-600 mt-1">{errors.budgetINR}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Guest Count <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-500">
                  ~₹
                  {Math.round(
                    (formData.budgetINR || 0) / Math.max(1, formData.guestCount || 1)
                  ).toLocaleString('en-IN')}
                  /person
                </span>
              </div>
              <input
                type="number"
                required
                min={1}
                max={25000}
                value={formData.guestCount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, guestCount: Number(e.target.value) })
                }
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-hidden focus:ring-2 transition ${
                  errors.guestCount
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              {errors.guestCount && (
                <p className="text-xs text-rose-600 mt-1">{errors.guestCount}</p>
              )}
            </div>
          </div>

          {/* Theme & Venue Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Theme / Vibe Concept
              </label>
              <input
                type="text"
                placeholder="e.g. Bohemian Sunset, Royal Rajputana, Cyberpunk Neon"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Venue Preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['indoor', 'outdoor', 'hybrid'] as VenuePreference[]).map((pref) => (
                  <button
                    type="button"
                    key={pref}
                    onClick={() => setFormData({ ...formData, venuePreference: pref })}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border capitalize transition ${
                      formData.venuePreference === pref
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Special Requirements & Preferences (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Pure Jain vegetarian catering, elderly wheelchair access, sound permit required till 11 PM, surprise anniversary montage video."
              value={formData.specialRequirements}
              onChange={(e) =>
                setFormData({ ...formData, specialRequirements: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition resize-none"
            />
          </div>

          {/* Gemini AI toggle */}
          <div className="p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-100 flex items-start gap-3">
            <input
              type="checkbox"
              id="ai-toggle"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="ai-toggle" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Synthesize Personalized Menus & Decor with Gemini AI
              </span>
              <p className="text-slate-600 mt-0.5">
                Uses Google Gemini 3.8 Flash via secure server-side SDK to craft regional menus, color palettes, and entertainment flows.
              </p>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 disabled:opacity-60 transition"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Blueprint...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Celebration Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
