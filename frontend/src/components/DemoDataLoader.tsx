import { analyzeCsv } from "../api";

export default function DemoDataLoader({ onData }: { onData: (d:any)=>void }) {
  const load = async (name: string) => {
    const res = await fetch(`/${name}.csv`);
    const text = await res.text();
    const file = new File([text], `${name}.csv`, { type: "text/csv" });
    const data = await analyzeCsv(file);
    onData(data.summary ?? data);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {["student_budget","new_grad_commuter","frequent_traveler","family_household"].map(n => (
        <button key={n}
          onClick={() => load(n)}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Load {n.replaceAll("_"," ")}
        </button>
      ))}
    </div>
  );
}
