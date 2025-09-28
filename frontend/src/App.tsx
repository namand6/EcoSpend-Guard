import { useEffect, useMemo, useState } from "react";

// Shell + base UI
import AppShell from "./components/AppShell";
import Hero from "./components/Hero";
import { Card, Stat, SectionTitle } from "./components/ui";

// Visuals / sections
import RadialGauge from "./components/RadialGauge";
import CategoryGrid from "./components/CategoryGrid";
import AnomalyList from "./components/AnomalyList";
import { Empty } from "./components/Empty";

// Feature components
import Upload from "./components/Upload";
import CategoryChart from "./components/CategoryChart";
import HealthTabs from "./components/HealthTabs";
import EcoFoxChat from "./components/EcoFoxChat";
import MethodologyModal from "./components/MethodologyModal";
import DemoDataLoader from "./components/DemoDataLoader";
import NudgeCards from "./components/NudgeCards";
import Exports from "./components/Exports";
import AgentPanel from "./components/AgentPanel";

type CatAgg = Record<string, { usd: number; co2e_kg: number }>;

async function getLiveSummary(base: string, token: string) {
  const r = await fetch(`${base}/ext/summary/${token}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // { items, summary }
}

export default function App() {
  const [resp, setResp] = useState<any | null>(null);
  const [liveToken, setLiveToken] = useState<string>("");

  const byCategory: CatAgg = useMemo(
    () => resp?.summary?.by_category ?? resp?.by_category ?? {},
    [resp]
  );

  const totals = useMemo(() => {
    let usd = 0,
      kg = 0;
    for (const k of Object.keys(byCategory)) {
      usd += Number(byCategory[k]?.usd || 0);
      kg += Number(byCategory[k]?.co2e_kg || 0);
    }
    return { usd: +usd.toFixed(2), kg: +kg.toFixed(2) };
  }, [byCategory]);

  // Live-mode polling (token from extension or swagger /ext/register)
  useEffect(() => {
    if (!liveToken) return;
    const base = (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8000";
    const id = setInterval(async () => {
      try {
        const data = await getLiveSummary(base, liveToken);
        setResp(data);
      } catch {
        // ignore transient errors
      }
    }, 3000);
    return () => clearInterval(id);
  }, [liveToken]);

  return (
    <AppShell>
      <Hero />

      {/* Top-right actions */}
      <div className="flex items-center justify-end gap-2">
        <MethodologyModal methodology={resp?.methodology} />
        {resp && <Exports byCategory={byCategory} />}
      </div>

      {/* Live token banner */}
      <Card className="p-4 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-gray-600">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Live mode (extension)
        </span>
        <input
          className="px-3 py-2 border rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          placeholder="Paste token from /ext/register or Options"
          value={liveToken}
          onChange={(e) => setLiveToken(e.target.value.trim())}
        />
      </Card>

      {/* Upload + sample data */}
      <Card className="p-6">
        <SectionTitle>Upload or simulate</SectionTitle>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Upload onData={(data) => setResp(data)} />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Or load sample personas</div>
            <DemoDataLoader onData={(d) => setResp(d)} />
          </div>
        </div>
      </Card>

      {!resp ? (
        <Card className="p-10">
          <Empty
            title="No data yet"
            subtitle="Upload a CSV or enable Live mode with a token."
          />
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4">
            <Stat label="Total Spend (scanned)" value={`$${totals.usd}`} />
            <Stat label="Estimated CO₂e" value={`${totals.kg} kg`} />
            <Card className="p-5 flex items-center">
              <RadialGauge label="This period vs target" valueKg={totals.kg} targetKg={1000} />
            </Card>
          </div>

          {/* Category overview */}
          <Card className="p-6">
            <SectionTitle>Where emissions happen</SectionTitle>
            <CategoryGrid byCategory={byCategory} />
            <div className="mt-6">
              <CategoryChart byCategory={byCategory} />
            </div>
          </Card>

          {/* Sponsor-aligned nudges */}
          <NudgeCards byCategory={byCategory} />

          {/* Signals (compact list) */}
          <Card className="p-6">
            <SectionTitle>Signals & anomalies</SectionTitle>
            <AnomalyList
              duplicates={resp.summary?.duplicates ?? []}
              subscriptions={resp.summary?.subscriptions ?? []}
              spikes={resp.summary?.spikes ?? []}
            />
          </Card>

          {/* (Optional) Keep the detailed tabs view if you like both */}
          <Card className="p-6">
            <HealthTabs
              duplicates={resp.summary?.duplicates ?? []}
              subscriptions={resp.summary?.subscriptions ?? []}
              spikes={resp.summary?.spikes ?? []}
            />
          </Card>

          {/* Coach */}
          <Card className="p-6">
            <SectionTitle>EcoFox Coach</SectionTitle>
            <EcoFoxChat context={resp.summary ?? resp} />
          </Card>

          {/* Planner Agent */}
          <Card className="p-6">
            <SectionTitle>Reduction Plan (Agent)</SectionTitle>
            <AgentPanel context={resp.summary ?? resp} />
          </Card>
        </>
      )}
    </AppShell>
  );
}
