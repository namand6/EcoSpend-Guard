// src/components/AgentPanel.tsx
import { useState } from "react";
import { agentPlan, agentApply } from "../api"; // add these calls

export default function AgentPanel({ context }: { context: any }) {
  const [target, setTarget] = useState(10);
  const [plan, setPlan] = useState<any|null>(null);
  const [artifacts, setArtifacts] = useState<any|null>(null);

  const run = async () => setPlan(await agentPlan(target, context));
  const apply = async () => setArtifacts(await agentApply(plan.chosen));

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="font-medium">Agent target:</div>
        <input type="range" min={5} max={40} value={target}
          onChange={e=>setTarget(+e.target.value)} />
        <div className="w-10 text-right">{target}%</div>
        <button onClick={run} className="rounded-md border px-3 py-1 text-sm">Run agent</button>
      </div>

      {plan && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Target: {plan.target_kg} kg • Achievable: {plan.achieved_kg} kg {plan.meets_target ? "✓" : "〰"}
          </div>
          <ul className="list-disc pl-5 text-sm">
            {plan.chosen.map((a:any)=>(
              <li key={a.id}><b>{a.title}</b> — ~{a.expected_kg_reduction} kg</li>
            ))}
          </ul>
          <button onClick={apply} className="rounded-md border px-3 py-1 text-sm">Apply plan</button>
        </div>
      )}

      {artifacts && (
        <div className="space-y-2 text-sm">
          {artifacts.ics?.map((f:any)=>(
            <a key={f.filename}
               href={URL.createObjectURL(new Blob([f.content], {type:"text/calendar"}))}
               download={f.filename}
               className="block underline">
              Download {f.filename}
            </a>
          ))}
          {artifacts.emails?.length > 0 && <div className="font-medium">Email drafts</div>}
          {artifacts.emails?.map((m:any, i:number)=>(
            <details key={i}><summary>{m.subject || "Draft email"}</summary>
              <pre className="whitespace-pre-wrap">{m.body}</pre>
            </details>
          ))}
          {artifacts.links?.length > 0 && <div className="font-medium">Quick links</div>}
          {artifacts.links?.map((l:any,i:number)=>(
            <a key={i} href={l.url} target="_blank" className="block underline">{l.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}
