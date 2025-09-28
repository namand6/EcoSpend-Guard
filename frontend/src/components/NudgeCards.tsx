type CatAgg = Record<string, { usd:number; co2e_kg:number }>;

export default function NudgeCards({ byCategory }: { byCategory: CatAgg }) {
  const ds = byCategory["delivery_shipping"]?.usd ?? 0;
  const elec = byCategory["electronics"]?.usd ?? 0;
  const ride = byCategory["ride_hail"]?.usd ?? 0;

  const cards: {title:string; body:string}[] = [];
  if (ds > 40) {
    cards.push({
      title: "Bundle deliveries (Amazon Day)",
      body: "Consolidate shipments to one weekly delivery window to cut last-mile trips. Increases on-time delivery and reduces packaging touches."
    });
    cards.push({
      title: "Shop Climate Pledge Friendly",
      body: "Prefer items with trusted eco-labels (Climate Pledge Friendly) and select 'ships in fewer boxes' where available."
    });
  }
  if (elec > 80) {
    cards.push({
      title: "Stretch device lifetimes",
      body: "Delay upgrades; choose ENERGY STAR/EPEAT Gold. Refurb and trade-in reduce embodied emissions."
    });
  }
  if (ride > 40) {
    cards.push({
      title: "Shift short trips",
      body: "Swap ride-hail &lt;3 miles for transit, bike, or pooled rides 2x/week."
    });
  }

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((c,i)=>(
        <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">{c.title}</div>
          <div className="mt-1 text-sm text-gray-600">{c.body}</div>
        </div>
      ))}
    </div>
  );
}
