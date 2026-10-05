import React from 'react';

interface ToleranceMeterProps {
  deviationPct: number;
  thresholdPct?: number;
  maxScale?: number;
  showLabels?: boolean;
}

export const ToleranceMeter: React.FC<ToleranceMeterProps> = ({
  deviationPct,
  thresholdPct = 2.0,
  maxScale = 6.0,
  showLabels = true
}) => {
  const isWithin = deviationPct <= thresholdPct;
  const clampedDev = Math.min(deviationPct, maxScale);
  const fillWidthPct = Math.min(100, Math.max(2, (clampedDev / maxScale) * 100));
  const thresholdMarkPct = (thresholdPct / maxScale) * 100;

  return (
    <div className="w-full">
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        {/* Safe threshold zone background */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-emerald-50/70 border-r border-emerald-300"
          style={{ width: `${thresholdMarkPct}%` }}
          title={`Safe Tolerance Zone (0 to ±${thresholdPct}%)`}
        />
        
        {/* Actual deviation bar */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isWithin ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${fillWidthPct}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 font-mono">
          <span>0.0%</span>
          <span className="text-emerald-700 font-medium">Threshold: ±{thresholdPct.toFixed(1)}%</span>
          <span>{maxScale.toFixed(1)}%+</span>
        </div>
      )}
    </div>
  );
};
