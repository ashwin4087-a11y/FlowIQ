"""Simulation-derived festival surge dataset (leakage-safe by junction/festival-day groups)."""
import json
import random
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = DATA / "festival_surge_dataset.csv"
META = DATA / "festival_dataset_meta.json"
FESTIVALS = json.loads((DATA / "festivals.json").read_text(encoding="utf-8"))

# Chennai junction list ids 1-8 (FlowIQ canonical registry)
JUNCTION_IDS = [str(i) for i in range(1, 9)]


def row_for(junction_id: str, festival: dict, day: int, hour: int, rng: random.Random) -> dict:
    base = 0.35 + (int(junction_id) % 5) * 0.04
    fest_boost = 0.25 if festival["id"] in ("pongal", "diwali") else 0.12
    day_boost = 0.08 * (day - 1)
    in_peak = festival["typical_peak_start_hour"] <= hour <= festival["typical_peak_end_hour"]
    peak_boost = 0.35 if in_peak else 0.0
    noise = rng.uniform(-0.08, 0.08)
    score = base + fest_boost + day_boost + peak_boost + noise
    if score >= 0.82:
        level = "HIGH"
    elif score >= 0.55:
        level = "MODERATE"
    else:
        level = "LOW"
    return {
        "chennai_junction_id": junction_id,
        "festival_id": festival["id"],
        "festival_name": festival["name"],
        "festival_day": day,
        "hour": hour,
        "historical_festival_index": fest_boost + day_boost,
        "evening_peak_pattern": 1.0 if in_peak else 0.0,
        "junction_baseline": base,
        "prev_festival_behaviour": rng.uniform(0.2, 0.9),
        "predicted_level": level,
        "group_key": f"{festival['id']}_d{day}_{junction_id}",
    }


def main(seed: int = 42):
    rng = random.Random(seed)
    rows = []
    for festival in FESTIVALS["festivals"]:
        for day in range(1, festival["days"] + 1):
            for junction_id in JUNCTION_IDS:
                for hour in range(0, 24):
                    rows.append(row_for(junction_id, festival, day, hour, rng))
    df = pd.DataFrame(rows)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    META.write_text(
        json.dumps(
            {
                "provenance": FESTIVALS["provenance"],
                "rows": len(df),
                "seed": seed,
                "target": "predicted_level from simulation-derived festival/peak features",
                "split": "group-aware by group_key recommended",
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {OUT} ({len(df)} rows)")


if __name__ == "__main__":
    main()
