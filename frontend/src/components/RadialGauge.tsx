import React from "react";

export default function RadialGauge({
  label,
  valueKg,
  targetKg,
}: {
  label: string;
  valueKg: number;
  targetKg: number;
}) {
  const pct = Math.max(0, Math.min(100, targetKg ? (valueKg / targetKg) * 100 : 0));
  const gradient = `conic-gradient(#10b981 ${pct}%, rgba(16,185,129,.15) ${pct}% 100%)`;

  return (
    <div className="flex items-center gap-4">
      <div
        className="h-24 w-24 rounded-full grid place-items-center ring-1 ring-black/5 shadow-sm"
        style={{ background: gradient }}
        aria-label={`${label} ${valueKg.toFixed(0)} kg`}
      >
        <div className="h-20 w-20 rounded-full bg-white dark:bg-gray-900 grid place-items-center text-sm">
          <div className="text-center">
            <div className="font-semibold">{valueKg.toFixed(0)} kg</div>
            <div className="text-[11px] text-gray-500">of {targetKg.toFixed(0)} kg</div>
          </div>
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-xs text-gray-400">Lower is better — target is editable in Agent</div>
      </div>
    </div>
  );
}
