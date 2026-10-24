import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { PlanningWarning } from '../types/planwise.ts';

interface WarningsBannerProps {
  warnings: PlanningWarning[];
}

export const WarningsBanner: React.FC<WarningsBannerProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return (
      <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="text-xs sm:text-sm">
          <span className="font-bold">All Planning Checks Passed:</span> Budget-to-guest ratios, lead times, and seasonal weather constraints appear balanced for your celebration.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Feasibility & Constraint Advisory ({warnings.length})</span>
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Rule-based logic generated based on venue, date, and city factors
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {warnings.map((warn) => {
          const isDanger = warn.severity === 'danger';
          const isWarning = warn.severity === 'warning';

          const cardStyles = isDanger
            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
            : isWarning
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
            : 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-900/60 text-sky-950 dark:text-sky-200';

          const iconColor = isDanger
            ? 'text-rose-600 dark:text-rose-400'
            : isWarning
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-sky-600 dark:text-sky-400';

          const badgeBg = isDanger
            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300'
            : isWarning
            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
            : 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300';

          return (
            <div
              key={warn.id}
              className={`p-4 rounded-xl border ${cardStyles} flex flex-col justify-between space-y-2.5 shadow-xs`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 ${iconColor} shrink-0`}>
                  {isDanger ? (
                    <AlertOctagon className="w-5 h-5" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{warn.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${badgeBg}`}>
                      {warn.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {warn.message}
                  </p>
                </div>
              </div>

              {warn.actionableTip && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-start gap-1.5 text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    <strong className="text-slate-900 dark:text-slate-100">Recommended Action:</strong>{' '}
                    {warn.actionableTip}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
