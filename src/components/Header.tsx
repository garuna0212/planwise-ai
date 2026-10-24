import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Sliders,
  Printer,
  Download,
  Share2,
  Check,
  Calendar,
  MapPin,
  Users,
} from 'lucide-react';
import { PlanWisePlan } from '../types/planwise.ts';
import { formatDate, getDaysUntil, formatCompactINR } from '../utils/formatters.ts';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle?: string;
  currentPlan: PlanWisePlan;
  onToggleMobileMenu: () => void;
  showQuickTuning: boolean;
  onToggleQuickTuning: () => void;
  onOpenAIChat: () => void;
  onExportJSON: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  pageSubtitle,
  currentPlan,
  onToggleMobileMenu,
  showQuickTuning,
  onToggleQuickTuning,
  onOpenAIChat,
  onExportJSON,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const daysUntil = getDaysUntil(currentPlan.input.date);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `PlanWise AI: ${currentPlan.input.title} (${currentPlan.input.eventType}) in ${currentPlan.input.city} on ${formatDate(currentPlan.input.date)}. Budget: ${formatCompactINR(currentPlan.input.budgetINR)} for ${currentPlan.input.guestCount} guests.`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 shadow-xs no-print">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger & Title / Context */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {pageTitle}
              </h1>
              <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">·</span>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px] md:max-w-[200px]">
                  {currentPlan.input.title}
                </span>
                <span>·</span>
                <span>{currentPlan.input.city}</span>
                <span>·</span>
                <span className="text-[#6D5EF8] dark:text-[#9B8FF9] font-medium">
                  {daysUntil < 0 ? 'Past' : daysUntil === 0 ? 'Today!' : `${daysUntil}d left`}
                </span>
              </div>
            </div>
            {pageSubtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                {pageSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Tuning Toggle */}
          <button
            onClick={onToggleQuickTuning}
            title="Instant Parameter Tuning (Budget, Guests, Venue, Date)"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showQuickTuning
                ? 'bg-[#EEECFE] dark:bg-[#6D5EF8]/20 border-[#6D5EF8]/40 text-[#6D5EF8] dark:text-[#9B8FF9]'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quick Tuning</span>
          </button>

          {/* Share Summary */}
          <button
            onClick={handleShare}
            title={copiedShare ? 'Copied to clipboard!' : 'Copy Event Summary'}
            aria-label="Share Event Summary"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          {/* Print PDF */}
          <button
            onClick={handlePrint}
            title="Print or Save PDF"
            aria-label="Print or Save PDF"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition hidden sm:inline-flex"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Export JSON */}
          <button
            onClick={onExportJSON}
            title="Export Plan as JSON"
            aria-label="Export Plan as JSON"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Ask AI Assistant */}
          <button
            onClick={onOpenAIChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#6D5EF8] hover:bg-[#5B4CE6] text-white shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Ask AI Planner</span>
            <span className="xs:hidden">AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
