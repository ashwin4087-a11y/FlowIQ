"""Generate festival long-horizon surge dataset (simulation-derived, leakage-safe groups)."""
import json
import random
from pathlib import Path

import pandas as pd

from festival_features import (
    FEATURE_NAMES,
    build_festival_feature_vector,
    load_catalog,
    load_junctions,
    surge_label_from_queue,
)
from simulator import TrafficSimulator

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "festival_surge_dataset.csv"
SEED = 44
EPISODES_PER_CELL = 12
DT = 0.05
WINDOW_TICKS = 400


def peak_queue_in_window(sim: TrafficSimulator, ticks: int) -> tuple[float, int]:
    max_q = 0.0
    peak_tick = 0
    for t in range(ticks):
        m = sim.metrics()
        q = float(m["queueLength"])
        if q > max_q:
            max_q = q
            peak_tick = t
        sim.tick(DT)
    peak_hour = (peak_tick * DT) % 24
    hour_of_day = 17.0 + (peak_hour % 5)
    return max_q, int(hour_of_day) % 24


def main():
    rng = random.Random(SEED)
    catalog = load_catalog()
    junctions = load_junctions()
    rows = []
    episode_id = 0
    for fest in catalog["festivals"]:
        for j in junctions:
            for day in range(1, int(fest["duration_days"]) + 1):
                for _ in range(EPISODES_PER_CELL):
                    density = rng.choice(["MEDIUM", "HIGH"])
                    intensity = float(fest.get("surge_intensity", 0.8))
                    mode = "SURGE" if intensity >= 0.5 else "NORMAL"
                    sim = TrafficSimulator(
                        density=density,
                        traffic_mode=mode,
                        signal_phase=rng.choice(["EAST_WEST_GREEN", "NORTH_SOUTH_GREEN"]),
                        remaining_seconds=rng.randint(10, 40),
                        rng=random.Random(rng.randint(0, 2**31 - 1)),
                    )
                    max_q, peak_hour = peak_queue_in_window(sim, WINDOW_TICKS)
                    label = surge_label_from_queue(max_q)
                    feats = build_festival_feature_vector(j["id"], fest["id"], day, float(peak_hour))
                    rows.append(
                        {
                            "episode_id": episode_id,
                            "festival_id": fest["id"],
                            "junction_id": j["id"],
                            "festival_day": day,
                            "peak_hour": peak_hour,
                            "peak_queue": max_q,
                            "label": label,
                            **{FEATURE_NAMES[i]: feats[i] for i in range(len(FEATURE_NAMES))},
                        }
                    )
                    episode_id += 1

    df = pd.DataFrame(rows)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    meta = {
        "seed": SEED,
        "rows": len(df),
        "label_counts": df["label"].value_counts().to_dict(),
        "target": "peak queue surge level during festival-window simulation",
        "provenance": "simulation_derived",
    }
    (ROOT / "data" / "festival_dataset_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"Wrote {len(df)} rows to {OUT}")


if __name__ == "__main__":
    main()
