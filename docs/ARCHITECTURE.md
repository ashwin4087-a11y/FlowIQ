# FlowIQ Architecture

## Loop

**PREDICT → ADAPT → ACT**

| Layer | Implementation |
|-------|----------------|
| EYES | 3D digital twin + simulated CCTV (`SimCameraViewport`) |
| BRAIN | `server/services/brainService.js` — traffic, short + festival surge, emergency |
| ADAPT | Heuristic signal controller + `signalStateMachine.js` |
| ACT | Emergency green wave (simulation), operator confirmation for audio |

## Canonical state

Single source of truth: `server/services/flowiqState.js` (mirrored in `src/types/flowiq.ts`).

Socket.IO broadcasts `flowiq:state` each second after signal tick + brain persist.

## ML

| Model | Path | Horizon |
|-------|------|---------|
| Audio CNN | `ml/audio/` | SIREN detection |
| Short surge RF | `ml/surge/` | t+50 simulator |
| Festival surge RF | `ml/festival_surge/` | Festival day / peak window |

## NOT AVAILABLE (honest)

- SUMO-connected RL policy (see `ml/rl/`, `simulation/sumo/`)
- Live Chennai CV evaluation
- Physical signal actuation

See also: `docs/SURGE_PREDICTION.md`, `docs/RL_TRAFFIC_CONTROL.md`, `docs/COMPUTER_VISION.md`, `docs/EMERGENCY_CONTROL.md`, `docs/END_TO_END_DEMO.md`.
