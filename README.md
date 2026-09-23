# FlowIQ — Adaptive Urban Traffic Intelligence System

**PREDICT → ADAPT → ACT**

Prototype junction stack: sensing (planned) → backend state → 3D digital twin + commuter dashboard.

## Current capabilities

| Area | Status |
|------|--------|
| 3D digital twin (lane paths, signals) | **IMPLEMENTED** (simulation) |
| Express API + Socket.IO state | **IMPLEMENTED** |
| Heuristic signal controller | **IMPLEMENTED** (labeled DEMO / HEURISTIC) |
| Audio ML pipeline (ESC-50 + sound.zip) | **IMPLEMENTED** (train locally) |
| Audio API inference | **PARTIAL** (requires trained `ml/audio/models/siren_cnn.pt`) |
| RL / SUMO / MQTT / hardware | **PLANNED** |

## Run locally

```bash
# Frontend
npm install
npm run dev

# Backend (separate terminal)
cd server && npm install && npm run dev

# Or both
npm run dev:all
```

Open http://localhost:5173 — legacy UI: `VITE_LEGACY_APP=true npm run dev`

## Audio ML

Place `ESC-50-master.zip` and `sound.zip` in repo root (not committed). See `ml/audio/README.md`.

## Environment

Copy `.env.example` to `.env` / `server/.env`.

## Docs

- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/DEMO.md`
- `docs/ML_STATUS.md`
