"""Train festival surge Random Forest on simulation-derived dataset."""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import GroupShuffleSplit

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "festival_surge_dataset.csv"
MODEL = ROOT / "models" / "festival_surge_rf.joblib"
REPORT = ROOT / "reports" / "metrics.json"

FEATURES = [
    "historical_festival_index",
    "evening_peak_pattern",
    "junction_baseline",
    "prev_festival_behaviour",
    "festival_day",
    "hour",
]


def main():
    if not DATA.exists():
        raise SystemExit("Run generate_dataset.py first")
    df = pd.read_csv(DATA)
    X = df[FEATURES].astype(float).values
    y = df["predicted_level"].values
    groups = df["group_key"].values
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(splitter.split(X, y, groups))
    clf = RandomForestClassifier(n_estimators=120, random_state=42, class_weight="balanced")
    clf.fit(X[train_idx], y[train_idx])
    pred = clf.predict(X[test_idx])
    report = classification_report(y[test_idx], pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y[test_idx], pred, labels=list(clf.classes_))
    importances = dict(zip(FEATURES, clf.feature_importances_.tolist()))
    MODEL.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": clf, "features": FEATURES}, MODEL)
    metrics = {
        "model": "RandomForestClassifier",
        "model_path": str(MODEL),
        "data_source": "ml/festival_surge/data/festival_surge_dataset.csv",
        "provenance": "SIMULATION_DATA",
        "feature_names": FEATURES,
        "feature_importance": importances,
        "test": {
            "n_samples": int(len(test_idx)),
            "accuracy": float((pred == y[test_idx]).mean()),
            "report": report,
            "confusion_matrix": cm.tolist(),
            "classes_order": list(clf.classes_),
        },
    }
    REPORT.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps({"accuracy": metrics["test"]["accuracy"], "report_path": str(REPORT)}, indent=2))


if __name__ == "__main__":
    main()
