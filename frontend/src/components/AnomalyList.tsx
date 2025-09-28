type Item = { date_iso: string; merchant_masked: string; amount_usd: number; co2e_kg?: number; category?: string };

export default function AnomalyList({
  duplicates = [],
  subscriptions = [],
  spikes = [],
}: {
  duplicates?: Item[];
  subscriptions?: { merchant_masked: string; count: number }[];
  spikes?: Item[];
}) {
  const hasAny = duplicates.length + subscriptions.length + spikes.length > 0;
  if (!hasAny) {
    return <div className="text-sm text-gray-500">No critical signals detected. Nice work! ✅</div>;
  }

  return (
    <div className="space-y-4">
      {duplicates.length > 0 && (
        <Section title="Potential duplicates" color="amber">
          {duplicates.map((d, i) => (
            <Row key={`dupe-${i}`} dot="amber">
              <span className="font-medium">{d.merchant_masked}</span>
              <span className="text-gray-600">${d.amount_usd.toFixed(2)}</span>
              <span className="text-xs text-gray-500">{d.date_iso}</span>
            </Row>
          ))}
        </Section>
      )}
      {subscriptions.length > 0 && (
        <Section title="Recurring charges" color="sky">
          {subscriptions.map((s, i) => (
            <Row key={`sub-${i}`} dot="sky">
              <span className="font-medium">{s.merchant_masked}</span>
              <span className="text-gray-600">{s.count}× this period</span>
            </Row>
          ))}
        </Section>
      )}
      {spikes.length > 0 && (
        <Section title="Spend spikes" color="rose">
          {spikes.map((s, i) => (
            <Row key={`spike-${i}`} dot="rose">
              <span className="font-medium">{s.merchant_masked}</span>
              <span className="text-gray-600">${s.amount_usd.toFixed(2)}</span>
              <span className="text-xs text-gray-500">{s.date_iso}</span>
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, color, children }: any) {
  const ring = `ring-${color}-200`;
  const bg = `bg-${color}-50`;
  return (
    <div className={`rounded-xl ${bg} ring-1 ${ring} p-3`}>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ children, dot }: any) {
  const c = `bg-${dot}-500`;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <span className={`inline-block size-2 rounded-full ${c}`} />
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
