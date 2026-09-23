"""Festival surge inference — JSON stdin: {chennaiJunctionId, festivalId, festivalDay, hour}."""
import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = ROOT / "models" / "festival_surge_rf.joblib"
FESTIVALS = json.loads((ROOT / "data" / "festivals.json").read_text(encoding="utf-8"))


def festival_meta(festival_id: str):
    for f in FESTIVALS["festivals"]:
        if f["id"] == festival_id:
            return f
    return None


def build_features(payload: dict, fest: dict) -> list[float]:
    junction_id = str(payload.get("chennaiJunctionId") or payload.get("junction_id") or "1")
    day = int(payload.get("festivalDay") or payload.get("festival_day") or 1)
    hour = int(payload.get("hour") if payload.get("hour") is not None else 18)
    rng_base = 0.35 + (int(junction_id) % 5) * 0.04
    fest_boost = 0.25 if fest["id"] in ("pongal", "diwali") else 0.12
    day_boost = 0.08 * (day - 1)
    in_peak = fest["typical_peak_start_hour"] <= hour <= fest["typical_peak_end_hour"]
    return [
        fest_boost + day_boost,
        1.0 if in_peak else 0.0,
        rng_base,
        0.55,
        float(day),
        float(hour),
    ]


def predict(payload: dict, model_path: Path) -> dict:
    fest_id = payload.get("festivalId") or payload.get("festival") or "pongal"
    fest = festival_meta(fest_id)
    if not fest:
        return {"status": "error", "message": f"Unknown festival: {fest_id}"}
    junction_id = str(payload.get("chennaiJunctionId") or "1")
    day = int(payload.get("festivalDay") or 1)
    hour = int(payload.get("hour") if payload.get("hour") is not None else fest["typical_peak_start_hour"])

    if not model_path.exists():
        return {
            "status": "model_not_loaded",
            "source": "unavailable",
            "simulated": True,
            "note": "Train festival model: ml/festival_surge/src/generate_dataset.py && train.py",
        }

    bundle = joblib.load(model_path)
    clf = bundle["model"]
    feats = bundle.get("features") or []
    vec = np.array([build_features(payload, fest)], dtype=np.float64)
    level = clf.predict(vec)[0]
    importances = dict(zip(feats, clf.feature_importances_.tolist())) if feats else {}

    window_start = f"{fest['typical_peak_start_hour']:02d}:00"
    window_end = f"{fest['typical_peak_end_hour']:02d}:00"

    return {
        "status": "ok",
        "source": "festival_surge_model",
        "simulated": True,
        "dataProvenance": "SIMULATION_DATA",
        "model": "festival_surge_rf",
        "chennaiJunctionId": junction_id,
        "festival": fest["name"],
        "festivalId": fest["id"],
        "festivalDay": day,
        "forecastPeriod": f"Day {day} · hour {hour:02d}:00 local (prototype clock)",
        "predictedLevel": level,
        "confidence": None,
        "expectedWindow": {"start": window_start, "end": window_end},
        "featureImportance": importances,
        "horizon": "festival_long_horizon",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=str(DEFAULT_MODEL))
    args = parser.parse_args()
    payload = json.loads(sys.stdin.read())
    print(json.dumps(predict(payload, Path(args.model))))


if __name__ == "__main__":
    main()
