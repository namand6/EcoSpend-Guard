# EcoSpend Guard 🌱

Track spend → CO₂e, detect anomalies, and auto-compose reduction plans.

## Features
- 🔌 Chrome extension: Scrapes Amazon orders, auto-ingests into backend.
- 📊 Dashboard: CSV upload or live token mode, category CO₂e breakdowns.
- 🤖 EcoFox Coach: LLM-powered advisor (Gemini + OpenAI fallback).
- 🕵️ Anomaly detection: Duplicates, spikes, subscriptions.
- 🎯 Reduction Agent: Auto-plan actions to meet targets.

## Tech Stack
- **Frontend**: React + Vite + Tailwind
- **Backend**: FastAPI + Pandas
- **AI**: Gemini + OpenAI
- **Extension**: Chrome MV3

## Run Locally
```bash
# Backend
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run dev
