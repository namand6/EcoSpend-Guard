# backend/providers.py
from __future__ import annotations

import os
from typing import Literal

from dotenv import load_dotenv

# Load the repo-root .env ( …/backend/../.env )
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

# ---- Google Gemini (official SDK) ----
from google import genai

# ---- Optional OpenAI refine ----
import requests

__all__ = ["gemini_classify", "gemini_coach", "openai_refine"]

# Closed-set labels your app understands (must match factors.json keys)
_ALLOWED = {
    "air_travel",
    "ride_hail",
    "restaurants",
    "electronics",
    "clothing",
    "groceries",
    "streaming",
    "delivery_shipping",
    "general_retail",
}

# ----------------- Errors -----------------
class GeminiError(RuntimeError):
    pass


class OpenAIError(RuntimeError):
    pass


# ----------------- Gemini client (lazy singleton) -----------------
_client: genai.Client | None = None


def _gem_client() -> genai.Client:
    """Create a Gemini client once, reading GEMINI_API_KEY from env."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise GeminiError("GEMINI_API_KEY not set")
        _client = genai.Client(api_key=api_key)
    return _client


def _gen(prompt: str) -> str:
    """
    Call Gemini with a plain text prompt. Try 2.5-flash first, fall back to 1.5-flash-latest.
    Returns the first text candidate. Raises GeminiError on failure.
    """
    client = _gem_client()
    last_err: Exception | None = None
    for model in ("gemini-2.5-flash", "gemini-1.5-flash-latest"):
        try:
            # SDK accepts str directly for contents
            resp = client.models.generate_content(model=model, contents=prompt)
            text = (getattr(resp, "text", None) or "").strip()
            if text:
                return text
        except Exception as e:
            last_err = e
            continue
    raise GeminiError(f"Gemini call failed: {last_err!r}")


# ----------------- Public functions -----------------
def gemini_classify(merchant: str) -> str:
    """
    Map a merchant string to ONE closed-set label (lowercase).
    Falls back to 'general_retail' if the model returns anything unexpected.
    """
    prompt = (
        "Map the merchant name below to EXACTLY ONE of these labels:\n"
        "air_travel, ride_hail, restaurants, electronics, clothing, groceries, "
        "streaming, delivery_shipping, general_retail.\n"
        "Return ONLY the label in lowercase. No extra words.\n\n"
        f"merchant: {merchant}\n"
    )
    out = _gen(prompt)

    # defensive parsing
    label = (
        out.strip()
        .strip("`")
        .replace(".", " ")
        .split()[0]
        .lower()
    )

    return label if label in _ALLOWED else "general_retail"


def gemini_coach(
    context_json: str, message: str, mode: Literal["normal", "absurd"] = "normal"
) -> str:
    """
    Format a short, concrete coaching plan using the already-computed context.
    The LLM writes text only; numbers come from backend context (not invented).
    """
    prompt = f"""
You are EcoFox, a concise, upbeat sustainability coach for personal finance.

Context (JSON):
{context_json}

User message:
{message}

Mode: {mode}

Write <= 180 words. Return:
- 3 specific reduction actions with rough kg CO2e effects (use context; don't invent categories)
- A 7-day micro-challenge (measurable)
- One-line encouragement

Rules:
- Respect the given categories and their relative sizes from the context.
- If mode is "absurd", add ONE humorous, over-engineered eco tip at the end.
- No disclaimers, no markdown headings.
"""
    return _gen(prompt)


# ----------------- Optional: OpenAI editorial refine -----------------
_OPENAI_URL = "https://api.openai.com/v1/chat/completions"
_OPENAI_MODEL = "gpt-4o-mini"


def openai_refine(text: str) -> str:
    """
    Tighten formatting + clarity of the Gemini text.
    - No new claims; do not change numbers.
    - If OPENAI_API_KEY is missing or the call fails, return the original text.
    """
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        return text

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": _OPENAI_MODEL,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": "Edit for clarity and structure. Keep bullets tight. Do NOT invent facts or change numbers.",
            },
            {"role": "user", "content": text},
        ],
    }
    try:
        r = requests.post(_OPENAI_URL, headers=headers, json=body, timeout=25)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        return text
