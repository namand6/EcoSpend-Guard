import axios from "axios";
import { getLiveSummary } from "./api";

const BASE = "http://localhost:8000";

export const analyzeCsv = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axios.post(`${BASE}/analyze`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const chatCoach = async (payload: {
  message: string;
  mode?: "normal" | "absurd";
  context: any; // pass summary from backend/analyze
}) => {
  const { data } = await axios.post(`${BASE}/chat`, payload);
  return data;
};
export async function agentPlan(targetPercent:number, context:any){
  const r = await fetch(`${BASE}/agent/plan`, {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ target_percent: targetPercent, context })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function agentApply(actions:any[]){
  const r = await fetch(`${BASE}/agent/apply`, {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ actions })
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function getLiveSummary(base = "http://127.0.0.1:8000", token: string) {
  const r = await fetch(`${base}/ext/summary/${token}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
