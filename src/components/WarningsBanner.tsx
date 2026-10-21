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
      <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-emerald-800">
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-xs sm:text-sm">
          <span className="font-bold">All Planning Checks Passed:</span> Budget-to-guest ratios, lead times, and seasonal weather constraints appear balanced for your celebration.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Feasibility & Constraint Advisory ({warnings.length})</span>
        </h3>
        <span className="text-xs text-slate-500">
          Rule-based logic generated based on venue, date, and city factors
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {warnings.map((warn) => {
          const isDanger = warn.severity === 'danger';
          const isWarning = warn.severity === 'warning';

          const cardStyles = isDanger
            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
            : isWarning
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-sky-50/80 border-sky-200 text-sky-900';

          const iconColor = isDanger
            ? 'text-rose-600'
            : isWarning
            ? 'text-amber-600'
            : 'text-sky-600';

          const badgeBg = isDanger
            ? 'bg-rose-100 text-rose-800'
            : isWarning
            ? 'bg-amber-100 text-amber-800'
            : 'bg-sky-100 text-sky-800';

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
                    <span className="text-xs font-bold">{warn.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${badgeBg}`}>
                      {warn.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {warn.message}
                  </p>
                </div>
              </div>

              {warn.actionableTip && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">
                    <strong className="text-slate-900">Recommended Action:</strong>{' '}
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
