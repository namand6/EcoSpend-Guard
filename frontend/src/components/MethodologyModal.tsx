import { useState } from "react";

export default function MethodologyModal({ methodology }: { methodology?: any }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={()=>setOpen(true)}
        className="rounded-md border px-3 py-1 text-sm">Methodology</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">How numbers are computed</h3>
              <button onClick={()=>setOpen(false)} className="text-gray-500">✕</button>
            </div>
            <div className="mt-3 space-y-3 text-sm text-gray-700">
              <p>
                We use a <b>GHG Protocol “average-data” approach</b>: map each transaction to a sector
                and multiply spend by a sector-level <b>kg CO₂e / $</b> factor (USEEIO-style demo factors).
              </p>
              <ul className="list-disc pl-5">
                <li>LLM is <i>not</i> used for math—only for labeling and coaching text.</li>
                <li>Duplicates/subscriptions/spikes use simple rules (same amount repeats; monthly cadence; z-score &gt; 2.5).</li>
                <li>Assumption: grid = {methodology?.grid_assumption ?? "US-average"}; factors pinned in code.</li>
              </ul>
              <p className="text-xs text-gray-500">
                Screening-grade only; not a product LCA. Great for trend insights and reduction nudges.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
