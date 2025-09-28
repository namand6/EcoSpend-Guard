# backend/server.py
from __future__ import annotations

import io
import os
import re
import json
import statistics
from typing import Dict, Any, List, Optional

import pandas as pd
from fastapi import FastAPI, UploadFile, File, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- Load .env from REPO ROOT BEFORE importing providers ---
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

# --- Providers: Gemini + optional OpenAI refine ---
from .providers import gemini_classify, gemini_coach, openai_refine

# Try to import agents; fall back to no-op if not present
try:
    from .agents import plan as agent_plan, apply as agent_apply
    _AGENTS_AVAILABLE = True
except Exception:
    _AGENTS_AVAILABLE = False
    def agent_plan(ctx: dict, target_percent: float) -> dict:
        return {
            "target_percent": target_percent,
            "chosen": [],
            "achieved_kg": 0,
            "target_kg": 0,
            "meets_target": False,
            "note": "agents module not available"
        }
    def agent_apply(actions: list) -> dict:
        return {"ics": [], "emails": [], "links": [], "notes": [], "note": "agents module not available"}

# ----------------- FastAPI app & CORS -----------------
app = FastAPI(title="EcoSpend Guard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("ALLOW_ORIGIN", "http://localhost:5173"),
        "http://127.0.0.1:5173",
        "*",  # permissive for hackathon demo
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Load factors & aliases -----------------
BASE_DIR = os.path.dirname(__file__)

def _load_json(fname: str, default: dict) -> dict:
    path = os.path.join(BASE_DIR, fname)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default

FACTORS = _load_json("factors.json", {
    "grid_assumption": "US-average",
    "spend_factors_kg_per_usd": {
        "air_travel": 0.60, "ride_hail": 0.25, "restaurants": 0.20, "electronics": 0.15,
        "clothing": 0.12, "groceries": 0.08, "streaming": 0.05, "delivery_shipping": 0.07,
        "general_retail": 0.10
    }
})
SPEND_F = FACTORS["spend_factors_kg_per_usd"]

ALIASES = _load_json("merchant_alias.json", {
    "UBER|LYFT": "ride_hail",
    "NETFLIX|YOUTUBE|SPOTIFY|HULU|DISNEY": "streaming",
    "AMAZON": "delivery_shipping",
    "MCDONALD|STARBUCKS|CHIPOTLE|PANERA": "restaurants",
    "BEST BUY|APPLE|MICRO CENTER|NEWEGG": "electronics",
    "DELTA AIR|SOUTHWEST AIR": "air_travel",
})

# ----------------- Helpers -----------------
def mask(text: str) -> str:
    if not text:
        return text
    t = re.sub(r"\d{4,}", "####", text)  # hide long number runs
    return t[:2] + "****" + t[-3:] if len(t) > 8 else t

def bucket(merchant: str) -> str:
    m = (merchant or "").upper()
    for pattern, cat in ALIASES.items():
        if re.search(pattern, m):
            return cat
    out = gemini_classify(merchant)
    return out if out in SPEND_F else "general_retail"

# ----------------- Health -----------------
@app.get("/healthz")
def healthz():
    return {"ok": True, "agents": _AGENTS_AVAILABLE}

# ----------------- Analyze (CSV) -----------------
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)) -> Dict[str, Any]:
    raw = (await file.read()).decode("utf-8", errors="ignore")
    df = pd.read_csv(io.StringIO(raw))
    df.columns = [c.strip().lower() for c in df.columns]

    items: List[Dict[str, Any]] = []
    by_cat: Dict[str, Dict[str, float]] = {}
    by_merch_amounts: Dict[str, List[float]] = {}
    by_merch_dates: Dict[str, List[str]] = {}

    for _, r in df.iterrows():
        amt = abs(float(r.get("amount", 0)))
        merch = str(r.get("merchant") or "UNKNOWN").strip()
        cat = str(r.get("category") or "").lower()
        if cat not in SPEND_F:
            cat = bucket(merch)
        kg = amt * SPEND_F.get(cat, SPEND_F["general_retail"])

        item = {
            "date_iso": str(r.get("date")),
            "merchant_raw": merch,
            "merchant_masked": mask(merch),
            "amount_usd": round(amt, 2),
            "category": cat,
            "co2e_kg": round(kg, 3),
        }
        items.append(item)

        by_cat.setdefault(cat, {"usd": 0.0, "co2e_kg": 0.0})
        by_cat[cat]["usd"] += amt
        by_cat[cat]["co2e_kg"] += kg

        by_merch_amounts.setdefault(merch, []).append(amt)
        by_merch_dates.setdefault(merch, []).append(item["date_iso"])

    # Duplicates: same masked merchant & same amount
    seen = set()
    duplicates = []
    for it in items:
        key = (it["merchant_masked"], round(it["amount_usd"], 2))
        if key in seen:
            duplicates.append(it)
        else:
            seen.add(key)

    # Spikes: per-merchant z-score > 2.5
    spikes = []
    for m, amts in by_merch_amounts.items():
        if len(amts) >= 4:
            mu = statistics.mean(amts)
            sigma = statistics.pstdev(amts) or 1.0
            thr = mu + 2.5 * sigma
            spikes.extend([i for i in items if i["merchant_raw"] == m and i["amount_usd"] > thr])

    # Subscriptions: >=3 occurrences for same merchant (simple cadence proxy)
    subscriptions = []
    for m, dates in by_merch_dates.items():
        if len(dates) >= 3:
            subscriptions.append({"merchant_masked": mask(m), "count": len(dates)})

    summary = {
        "by_category": {k: {"usd": round(v["usd"], 2), "co2e_kg": round(v["co2e_kg"], 2)} for k, v in by_cat.items()},
        "duplicates": duplicates[:5],
        "subscriptions": subscriptions[:5],
        "spikes": spikes[:5],
    }

    return {
        "items": items[:200],
        "summary": summary,
        "methodology": {
            "factor_source": "EPA USEEIO-style spend factors (demo, pinned version in README)",
            "grid_assumption": FACTORS.get("grid_assumption", "US-average"),
        },
    }

# ----------------- Chat (Gemini coach + optional OpenAI refine) -----------------
class ChatReq(BaseModel):
    message: str
    mode: str = "normal"  # "normal" | "absurd"
    context: dict | None = None  # expects { by_category, duplicates, subscriptions, spikes }

@app.post("/chat")
def chat(req: ChatReq) -> Dict[str, str]:
    if not req.context:
        return {"reply": "Upload a CSV first so I can see your categories and suggest a plan."}

    by_cat = req.context.get("by_category", {})
    top3 = sorted(
        [{"cat": k, "usd": v.get("usd", 0), "kg": v.get("co2e_kg", 0)} for k, v in by_cat.items()],
        key=lambda x: x["kg"], reverse=True,
    )[:3]

    digest = {
        "top_emitters": top3,
        "totals": {
            "usd": round(sum(v.get("usd", 0) for v in by_cat.values()), 2),
            "kg": round(sum(v.get("co2e_kg", 0) for v in by_cat.values()), 2),
        },
        "anomalies": {
            "duplicates": len(req.context.get("duplicates", [])),
            "subscriptions": len(req.context.get("subscriptions", [])),
            "spikes": len(req.context.get("spikes", [])),
        },
        "assumptions": {
            "factor_source": "EPA USEEIO (average-data method, GHG Protocol-aligned)",
        },
    }

    prompt_ctx = json.dumps(digest, ensure_ascii=False)
    reply = gemini_coach(prompt_ctx, req.message, req.mode)

    # Optional OpenAI editorial polish
    if os.environ.get("OPENAI_API_KEY"):
        reply = openai_refine(reply)

    return {"reply": reply}

# ----------------- Agents (plan/apply) -----------------
class PlanReq(BaseModel):
    target_percent: float
    context: dict

@app.post("/agent/plan")
def agent_plan_endpoint(req: PlanReq):
    return agent_plan(req.context, req.target_percent)

class ApplyReq(BaseModel):
    actions: list

@app.post("/agent/apply")
def agent_apply_endpoint(req: ApplyReq):
    return agent_apply(req.actions)

# ----------------- Extension endpoints (register/ingest/summary) -----------------
from uuid import uuid4

EXT_DB: dict[str, list[dict]] = {}

@app.post("/ext/register")
def ext_register():
    tok = uuid4().hex[:24]
    EXT_DB[tok] = []
    return {"token": tok}

class IngestReq(BaseModel):
    events: list[dict]
    token: Optional[str] = None  # fallback: allow token in body

@app.post("/ext/ingest")
def ext_ingest(
    req: IngestReq,
    authorization: Optional[str] = Header(None),  # optional header: "Bearer <token>"
    token: Optional[str] = Query(None),           # also allow ?token=...
):
    # Accept token from header OR body OR query (in that order)
    tok = (authorization or "").replace("Bearer", "").strip() or req.token or token
    if not tok or tok not in EXT_DB:
        return {"ok": False, "error": "invalid token"}

    for e in req.events:
        EXT_DB[tok].append({
            "date": e.get("date_iso"),
            "merchant": e.get("merchant", "AMAZON Mktp US"),
            "amount": float(e.get("amount_usd", 0.0) or 0.0),
            "category": e.get("category", "delivery_shipping"),
        })
    return {"ok": True, "count": len(req.events)}

@app.get("/ext/summary/{token}")
def ext_summary(token: str):
    rows = EXT_DB.get(token, [])
    items: List[Dict[str, Any]] = []
    by_cat: Dict[str, Dict[str, float]] = {}
    by_merch_amounts: Dict[str, List[float]] = {}
    by_merch_dates: Dict[str, List[str]] = {}

    for r in rows:
        amt = abs(float(r.get("amount", 0)))
        merch = str(r.get("merchant") or "UNKNOWN").strip()
        cat = str(r.get("category") or "").lower()
        if cat not in SPEND_F:
            cat = bucket(merch)
        kg = amt * SPEND_F.get(cat, SPEND_F["general_retail"])

        it = {
            "date_iso": str(r.get("date")),
            "merchant_raw": merch,
            "merchant_masked": mask(merch),
            "amount_usd": round(amt, 2),
            "category": cat,
            "co2e_kg": round(kg, 3),
        }
        items.append(it)

        by_cat.setdefault(cat, {"usd": 0.0, "co2e_kg": 0.0})
        by_cat[cat]["usd"] += amt
        by_cat[cat]["co2e_kg"] += kg
        by_merch_amounts.setdefault(merch, []).append(amt)
        by_merch_dates.setdefault(merch, []).append(it["date_iso"])

    # quick anomalies (same logic as /analyze)
    seen, duplicates = set(), []
    for it in items:
        key = (it["merchant_masked"], round(it["amount_usd"], 2))
        if key in seen:
            duplicates.append(it)
        else:
            seen.add(key)

    spikes = []
    for m, amts in by_merch_amounts.items():
        if len(amts) >= 4:
            mu = statistics.mean(amts)
            sigma = statistics.pstdev(amts) or 1.0
            thr = mu + 2.5 * sigma
            spikes.extend([i for i in items if i["merchant_raw"] == m and i["amount_usd"] > thr])

    subscriptions = []
    for m, dates in by_merch_dates.items():
        if len(dates) >= 3:
            subscriptions.append({"merchant_masked": mask(m), "count": len(dates)})

    return {
        "items": items[:200],
        "summary": {
            "by_category": {
                k: {"usd": round(v["usd"], 2), "co2e_kg": round(v["co2e_kg"], 2)}
                for k, v in by_cat.items()
            },
            "duplicates": duplicates[:5],
            "subscriptions": subscriptions[:5],
            "spikes": spikes[:5],
        },
    }

# Handy debug endpoint (optional for demos)
@app.get("/ext/debug")
def ext_debug():
    return {"tokens": list(EXT_DB.keys()), "counts": {k: len(v) for k, v in EXT_DB.items()}}
