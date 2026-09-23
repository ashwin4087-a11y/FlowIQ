"""CLI inference: JSON on stdin or --file path with {traffic, signals, trafficMode}."""
import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np

from features import FEATURE_NAMES, build_feature_vector

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = ROOT / "models" / "surge_rf.joblib"


def predict_payload(payload: dict, model_path: Path) -> dict:
    if not model_path.exists():
        return {"status": "model_not_loaded", "message": str(model_path)}
    bundle = joblib.load(model_path)
    clf = bundle["model"]
    traffic = payload.get("traffic") or {}
    signals = payload.get("signals") or {}
    mode = payload.get("trafficMode") or payload.get("traffic_mode") or "NORMAL"
    vec = np.array([build_feature_vector(traffic, signals, mode)], dtype=np.float64)
    pred = clf.predict(vec)[0]
    proba = clf.predict_proba(vec)[0]
    classes = list(clf.classes_)
    prob_map = {classes[i]: float(proba[i]) for i in range(len(classes))}
    high_p = prob_map.get("HIGH", 0.0)
    return {
        "status": "ok",
        "surgeLevel": pred,
        "probabilities": prob_map,
        "congestionProbability": high_p,
        "confidence": float(max(proba)),
        "source": "surge_model",
        "simulated": False,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=str, default="")
    parser.add_argument("--model", type=str, default=str(DEFAULT_MODEL))
    args = parser.parse_args()
    if args.file:
        payload = json.loads(Path(args.file).read_text(encoding="utf-8"))
    else:
        payload = json.loads(sys.stdin.read())
    print(json.dumps(predict_payload(payload, Path(args.model))))


if __name__ == "__main__":
    main()
