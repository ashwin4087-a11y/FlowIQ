"""Train festival long-horizon surge classifier."""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import GroupShuffleSplit

from festival_features import FEATURE_NAMES

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "festival_surge_dataset.csv"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"
PEAK_STATS = ROOT / "data" / "festival_peak_stats.json"


def compute_peak_stats(df: pd.DataFrame) -> dict:
    stats = {}
    for (fest, jid), g in df.groupby(["festival_id", "junction_id"]):
        hours = g["peak_hour"].astype(int)
        start = int(hours.quantile(0.25))
        end = int(hours.quantile(0.75))
        if end <= start:
            end = min(23, start + 2)
        stats[f"{fest}:{jid}"] = {
            "festival_id": fest,
            "junction_id": jid,
            "window_start_hour": start,
            "window_end_hour": end,
            "median_peak_hour": int(hours.median()),
            "n_episodes": int(len(g)),
            "source": "training_data_distribution",
        }
    return {"entries": stats, "provenance": "simulation_derived"}


def main():
    if not DATA.exists():
        raise SystemExit("Run generate_festival_dataset.py first")

    df = pd.read_csv(DATA)
    X = df[FEATURE_NAMES].values
    y = df["label"].values
    groups = df["episode_id"].values

    gss = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=44)
    train_idx, test_idx = next(gss.split(X, y, groups))
    gss2 = GroupShuffleSplit(n_splits=1, test_size=0.15 / 0.85, random_state=45)
    tr_rel, val_rel = next(gss2.split(X[train_idx], y[train_idx], groups[train_idx]))
    train_i = train_idx[tr_rel]
    val_i = train_idx[val_rel]

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        class_weight="balanced",
        random_state=44,
        n_jobs=-1,
    )
    clf.fit(X[train_i], y[train_i])

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / "festival_surge_rf.joblib"
    importances = dict(zip(FEATURE_NAMES, clf.feature_importances_.tolist()))
    joblib.dump(
        {
            "model": clf,
            "features": FEATURE_NAMES,
            "classes": list(clf.classes_),
            "feature_importance": importances,
        },
        model_path,
    )

    peak_stats = compute_peak_stats(df)
    PEAK_STATS.write_text(json.dumps(peak_stats, indent=2), encoding="utf-8")

    results = {
        "model_path": str(model_path),
        "model_type": "RandomForestClassifier",
        "horizon": "festival_long",
        "feature_names": FEATURE_NAMES,
        "feature_importance": importances,
        "data_provenance": "simulation_derived",
        "dataset": str(DATA),
    }
    for name, idx in [("train", train_i), ("val", val_i), ("test", test_idx)]:
        pred = clf.predict(X[idx])
        proba = clf.predict_proba(X[idx])
        report = classification_report(y[idx], pred, output_dict=True, zero_division=0)
        high = report.get("HIGH", {})
        results[name] = {
            "n_samples": int(len(idx)),
            "accuracy": float((pred == y[idx]).mean()),
            "macro_f1": float(f1_score(y[idx], pred, average="macro", zero_division=0)),
            "high_precision": float(high.get("precision", 0) or 0),
            "high_recall": float(high.get("recall", 0) or 0),
            "high_f1": float(high.get("f1-score", 0) or 0),
            "report": report,
            "confusion_matrix": confusion_matrix(y[idx], pred, labels=list(clf.classes_)).tolist(),
            "classes_order": list(clf.classes_),
            "mean_max_proba": float(proba.max(axis=1).mean()),
        }
        y_true = y[idx]
        pred_arr = pred
        high_mask = y_true == "HIGH"
        if high_mask.any():
            missed_high = float((pred_arr[high_mask] != "HIGH").mean())
        else:
            missed_high = None
        false_high = float(((pred_arr == "HIGH") & (y_true != "HIGH")).mean())
        results[name]["missed_high_rate"] = missed_high
        results[name]["false_high_alarm_rate"] = false_high

    (REPORT_DIR / "festival_metrics.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Test macro F1: {results['test']['macro_f1']:.4f}")
    print(f"Saved {model_path} and festival_metrics.json")


if __name__ == "__main__":
    main()
