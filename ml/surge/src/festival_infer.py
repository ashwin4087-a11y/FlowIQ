"""Festival long-horizon surge inference CLI."""
import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np

from festival_features import FEATURE_NAMES, build_festival_feature_vector, festival_by_id, junction_by_id

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = ROOT / "models" / "festival_surge_rf.joblib"
PEAK_STATS = ROOT / "data" / "festival_peak_stats.json"


def format_hour(h: int) -> str:
    return f"{h:02d}:00"


def predict_festival(payload: dict, model_path: Path) -> dict:
    if not model_path.exists():
        return {"status": "model_not_loaded", "message": str(model_path)}

    festival_id = payload.get("festivalId") or payload.get("festival_id")
    junction_id = payload.get("junctionListId") or payload.get("junction_id")
    festival_day = int(payload.get("festivalDay") or payload.get("festival_day") or 1)

    if not festival_id or not junction_id:
        return {"status": "error", "message": "festivalId and junctionListId required"}

    try:
        fest = festival_by_id(festival_id)
        junction = junction_by_id(str(junction_id))
    except KeyError as e:
        return {"status": "error", "message": str(e)}

    if festival_day < 1 or festival_day > int(fest["duration_days"]):
        return {
            "status": "error",
            "message": f"festivalDay must be 1..{fest['duration_days']}",
        }

    bundle = joblib.load(model_path)
    clf = bundle["model"]
    importances = bundle.get("feature_importance") or {}

    peak_hour = 18
    if PEAK_STATS.exists():
        stats = json.loads(PEAK_STATS.read_text(encoding="utf-8")).get("entries", {})
        key = f"{festival_id}:{junction_id}"
        if key in stats:
            peak_hour = int(stats[key]["median_peak_hour"])

    vec = np.array(
        [build_festival_feature_vector(str(junction_id), festival_id, festival_day, float(peak_hour))],
        dtype=np.float64,
    )
    pred = clf.predict(vec)[0]
    proba = clf.predict_proba(vec)[0]
    classes = list(clf.classes_)
    prob_map = {classes[i]: float(proba[i]) for i in range(len(classes))}

    forecast_period = None
    if PEAK_STATS.exists():
        stats = json.loads(PEAK_STATS.read_text(encoding="utf-8")).get("entries", {})
        key = f"{festival_id}:{junction_id}"
        if key in stats:
            s = stats[key]
            forecast_period = {
                "startLocal": format_hour(int(s["window_start_hour"])),
                "endLocal": format_hour(int(s["window_end_hour"])),
                "source": s["source"],
            }

    fi_sorted = sorted(importances.items(), key=lambda x: -x[1])[:8]

    return {
        "status": "ok",
        "horizon": "festival_long",
        "festival": {
            "id": festival_id,
            "name": fest["name"],
            "day": festival_day,
            "durationDays": int(fest["duration_days"]),
        },
        "junction": {"listId": str(junction_id), "name": junction["name"]},
        "predictedLevel": pred,
        "probabilities": prob_map,
        "confidence": None,
        "forecastPeriod": forecast_period,
        "warningLeadTimeHours": 24,
        "source": "festival_surge_model",
        "dataProvenance": "simulation_derived",
        "model": "RandomForestClassifier",
        "featureImportance": [{"feature": k, "importance": v} for k, v in fi_sorted],
        "note": "Long-horizon festival forecast from simulation-derived historical patterns. Class probabilities are not calibrated deployment confidence.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default=str(DEFAULT_MODEL))
    parser.add_argument("--file", type=str, default="")
    args = parser.parse_args()
    if args.file:
        payload = json.loads(Path(args.file).read_text(encoding="utf-8"))
    else:
        payload = json.loads(sys.stdin.read())
    print(json.dumps(predict_festival(payload, Path(args.model))))


if __name__ == "__main__":
    main()
