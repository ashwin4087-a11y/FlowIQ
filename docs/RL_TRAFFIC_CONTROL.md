# RL traffic control

**Status:** NOT CONNECTED to SUMO · baseline simulator comparison only

## Planned

SUMO → observation → RL agent → signal controller → SUMO (see `simulation/sumo/README.md`).

## Current prototype

`ml/rl/baseline_compare.py` compares **NORMAL** vs **SURGE** traffic mode mean queue on `ml/surge/src/simulator.py`.

```bash
python ml/rl/baseline_compare.py
```

Output: `ml/rl/reports/compare.json`

This is **not** proof that RL beats fixed-time control. No Stable-Baselines3 policy is shipped.

## Reward (when SUMO is added)

Documented target: minimize average waiting time / queue length subject to minimum green and clearance constraints.
