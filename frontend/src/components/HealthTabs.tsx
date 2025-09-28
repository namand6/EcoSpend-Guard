import { useMemo, useState } from "react";

type Txn = {
  date_iso: string;
  merchant_masked: string;
  amount_usd: number;
  category: string;
  co2e_kg: number;
};

type Subs = { merchant_masked: string; count: number };

export default function HealthTabs({
  duplicates = [],
  subscriptions = [],
  spikes = [],
}: {
  duplicates?: Txn[];
  subscriptions?: Subs[];
  spikes?: Txn[];
}) {
  const [tab, setTab] = useState<"dup" | "sub" | "spike">("dup");

  const counts = useMemo(
    () => ({
      dup: duplicates.length,
      sub: subscriptions.length,
      spike: spikes.length,
    }),
    [duplicates, subscriptions, spikes]
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab("dup")}
          className={`rounded-md border px-3 py-1 text-sm ${tab === "dup" ? "bg-gray-100" : ""}`}
        >
          Duplicates ({counts.dup})
        </button>
        <button
          onClick={() => setTab("sub")}
          className={`rounded-md border px-3 py-1 text-sm ${tab === "sub" ? "bg-gray-100" : ""}`}
        >
          Subscriptions ({counts.sub})
        </button>
        <button
          onClick={() => setTab("spike")}
          className={`rounded-md border px-3 py-1 text-sm ${tab === "spike" ? "bg-gray-100" : ""}`}
        >
          Spikes ({counts.spike})
        </button>
      </div>

      {tab === "dup" && (
        <List
          rows={duplicates}
          empty="No likely duplicates detected."
          render={(r: Txn) => (
            <Row
              left={`${r.date_iso} • ${r.merchant_masked}`}
              mid={r.category}
              right={`$${r.amount_usd.toFixed(2)}`}
              sub={`${r.co2e_kg} kg CO₂e`}
            />
          )}
        />
      )}

      {tab === "sub" && (
        <List
          rows={subscriptions}
          empty="No recurring subscriptions detected."
          render={(r: Subs) => (
            <Row
              left={`${r.merchant_masked}`}
              mid="subscription"
              right={`${r.count} charges`}
              sub=""
            />
          )}
        />
      )}

      {tab === "spike" && (
        <List
          rows={spikes}
          empty="No unusual spikes detected."
          render={(r: Txn) => (
            <Row
              left={`${r.date_iso} • ${r.merchant_masked}`}
              mid={r.category}
              right={`$${r.amount_usd.toFixed(2)}`}
              sub={`${r.co2e_kg} kg CO₂e`}
            />
          )}
        />
      )}
    </div>
  );
}

function List<T>({
  rows,
  render,
  empty,
}: {
  rows: T[];
  render: (r: T) => JSX.Element;
  empty: string;
}) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-gray-500">{empty}</p>;
  }
  return (
    <div className="divide-y">
      {rows.map((r, i) => (
        <div key={i} className="py-2">
          {render(r)}
        </div>
      ))}
    </div>
  );
}

function Row({
  left,
  mid,
  right,
  sub,
}: {
  left: string;
  mid: string;
  right: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{left}</div>
        <div className="text-sm text-gray-500">{mid}</div>
        <div className="text-right font-semibold">{right}</div>
      </div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

