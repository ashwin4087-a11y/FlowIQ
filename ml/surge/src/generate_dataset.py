"""Generate reproducible surge dataset from the FlowIQ traffic simulator."""
import json
import random
from pathlib import Path

import pandas as pd

from features import FEATURE_NAMES, build_feature_vector
from simulator import TrafficSimulator

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "surge_dataset.csv"
HORIZON_TICKS = 50
DT = 0.05
EPISODES = 400
SEED = 42


def run_episode(ep_id: int, rng: random.Random) -> list[dict]:
    density = rng.choice(["LOW", "MEDIUM", "HIGH"])
    mode = rng.choice(["NORMAL", "SURGE"])
    phase = rng.choice(
        [
            "NORTH_SOUTH_GREEN",
            "EAST_WEST_GREEN",
            "ALL_RED",
            "NORTH_SOUTH_YELLOW",
        ]
    )
    sim = TrafficSimulator(
        density=density,
        traffic_mode=mode,
        signal_phase=phase,
        remaining_seconds=rng.randint(5, 45),
        rng=random.Random(rng.randint(0, 2**31 - 1)),
    )
    snapshots = []
    for _ in range(200):
        m = sim.metrics()
        signals = {
            "activePhase": sim.signal_phase,
            "remainingSeconds": sim.remaining_seconds,
        }
        snapshots.append((build_feature_vector(m, signals, mode), m))
        sim.tick(DT)

    rows = []
    for i in range(len(snapshots) - HORIZON_TICKS):
        if i % 3 != 0:
            continue
        feats, _ = snapshots[i]
        future_m = snapshots[i + HORIZON_TICKS][1]
        label = sim.surge_label_from_metrics(future_m)
        rows.append(
            {
                "episode_id": ep_id,
                "tick": i,
                **{FEATURE_NAMES[j]: feats[j] for j in range(len(FEATURE_NAMES))},
                "label": label,
                "future_queue": future_m["queueLength"],
            }
        )
    return rows


def main():
    rng = random.Random(SEED)
    all_rows = []
    for ep in range(EPISODES):
        all_rows.extend(run_episode(ep, rng))
    df = pd.DataFrame(all_rows)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    meta = {
        "episodes": EPISODES,
        "seed": SEED,
        "horizon_ticks": HORIZON_TICKS,
        "dt": DT,
        "rows": len(df),
        "label_counts": df["label"].value_counts().to_dict(),
        "target": "surge_level at t+H from simulator queue thresholds (HIGH>=14, MOD>=7)",
    }
    (ROOT / "data" / "dataset_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"Wrote {len(df)} rows to {OUT}")


if __name__ == "__main__":
    main()
