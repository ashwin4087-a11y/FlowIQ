"""RL policy inference — JSON stdin: FlowIQ traffic+signals snapshot."""
import argparse
import json
import sys
from pathlib import Path

import numpy as np

ACTIONS = ["HOLD", "EXTEND_NS_GREEN", "EXTEND_EW_GREEN", "NEXT_PHASE"]
PHASES = [
    "NORTH_SOUTH_GREEN",
    "NORTH_SOUTH_YELLOW",
    "ALL_RED",
    "EAST_WEST_GREEN",
    "EAST_WEST_YELLOW",
]


def build_obs(payload: dict) -> np.ndarray:
    traffic = payload.get("traffic") or {}
    signals = payload.get("signals") or {}
    lanes = {l.get("id"): l for l in traffic.get("lanes") or []}
    phase = signals.get("activePhase") or "EAST_WEST_GREEN"
    phase_idx = PHASES.index(phase) if phase in PHASES else 0
    rem = float(signals.get("remainingSeconds") or 0)
    mode = payload.get("trafficMode") or "NORMAL"
    return np.array(
        [
            float(traffic.get("queueLength") or 0) / 40.0,
            float(traffic.get("vehicleCount") or 0) / 50.0,
            float(lanes.get("north", {}).get("queueLength") or 0) / 20.0,
            float(lanes.get("south", {}).get("queueLength") or 0) / 20.0,
            float(lanes.get("east", {}).get("queueLength") or 0) / 20.0,
            float(lanes.get("west", {}).get("queueLength") or 0) / 20.0,
            phase_idx / 5.0,
            min(1.0, rem / 60.0),
            1.0 if mode == "SURGE" else 0.0,
        ],
        dtype=np.float32,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    args = parser.parse_args()
    model_path = Path(args.model)
    if not model_path.exists():
        print(json.dumps({"status": "model_not_loaded"}))
        return
    payload = json.loads(sys.stdin.read())
    obs = build_obs(payload)
    try:
        from stable_baselines3 import PPO

        model = PPO.load(str(model_path))
        action, _ = model.predict(obs, deterministic=True)
        act = ACTIONS[int(action)]
        print(json.dumps({"status": "ok", "action": act, "source": "rl_model"}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))


if __name__ == "__main__":
    main()
