type CatAgg = Record<string, { usd:number; co2e_kg:number }>;

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}

export default function Exports({ byCategory }: { byCategory: CatAgg }) {
  const rows = Object.entries(byCategory).map(([cat, v]) => ({
    category: cat,
    usd: Number(v.usd.toFixed(2)),
    co2e_kg: Number(v.co2e_kg.toFixed(2)),
    kg_per_usd: Number(((v.co2e_kg || 0) / (v.usd || 1)).toFixed(4)),
  }));
  return (
    <button
      onClick={() => downloadCsv("sector_rollup.csv", rows)}
      className="rounded-md border px-3 py-1 text-sm"
    >
      Download sector_rollup.csv
    </button>
  );
}
