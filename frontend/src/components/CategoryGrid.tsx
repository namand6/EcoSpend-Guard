import React from "react";

type CatAgg = Record<string, { usd: number; co2e_kg: number }>;

const ICONS: Record<string, string> = {
  air_travel: "✈️",
  ride_hail: "🚗",
  restaurants: "🍽️",
  electronics: "💻",
  clothing: "👕",
  groceries: "🛒",
  streaming: "📺",
  delivery_shipping: "📦",
  general_retail: "🏬",
};

export default function CategoryGrid({ byCategory }: { byCategory: CatAgg }) {
  const entries = Object.entries(byCategory)
    .map(([k, v]) => ({ k, ...v }))
    .sort((a, b) => b.co2e_kg - a.co2e_kg)
    .slice(0, 6);

  const max = Math.max(1, ...entries.map((e) => e.co2e_kg));

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {entries.map((e) => (
        <div key={e.k} className="rounded-xl p-4 ring-1 ring-black/5 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{ICONS[e.k] || "•"}</span>
              <div className="font-medium capitalize">{e.k.replaceAll("_", " ")}</div>
            </div>
            <div className="text-sm tabular-nums text-gray-600">
              {e.co2e_kg.toFixed(0)} kg
            </div>
          </div>

          <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden ring-1 ring-black/5">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(e.co2e_kg / max) * 100}%` }}
            />
          </div>

          <div className="mt-1 text-xs text-gray-500">Spend ${e.usd.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}
