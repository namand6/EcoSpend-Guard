import { useState } from "react";
import { analyzeCsv } from "../api";

export default function Upload({ onData }: { onData: (data:any) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV</label>
      <input
        type="file"
        accept=".csv"
        onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setBusy(true); setErr(null);
          try { const data = await analyzeCsv(f); onData(data); }
          catch (e:any) { setErr(e?.message ?? "Upload failed"); }
          finally { setBusy(false); }
        }}
        className="block w-full cursor-pointer rounded-md border p-2"
      />
      {busy && <div className="mt-2 text-sm text-gray-500">Analyzing…</div>}
      {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
    </div>
  );
}
