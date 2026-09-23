"""Train surge level classifier (LOW / MODERATE / HIGH)."""
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import GroupShuffleSplit

from features import FEATURE_NAMES

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "surge_dataset.csv"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"


def main():
    if not DATA.exists():
        raise SystemExit("Run generate_dataset.py first")

    df = pd.read_csv(DATA)
    X = df[FEATURE_NAMES].values
    y = df["label"].values
    groups = df["episode_id"].values

    gss = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    gss2 = GroupShuffleSplit(n_splits=1, test_size=0.15 / 0.85, random_state=43)
    tr_rel, val_rel = next(gss2.split(X[train_idx], y[train_idx], groups[train_idx]))
    train_i = train_idx[tr_rel]
    val_i = train_idx[val_rel]

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X[train_i], y[train_i])

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODEL_DIR / "surge_rf.joblib"
    joblib.dump({"model": clf, "features": FEATURE_NAMES, "classes": list(clf.classes_)}, model_path)

    results = {"model_path": str(model_path), "feature_names": FEATURE_NAMES}
    for name, idx in [("train", train_i), ("val", val_i), ("test", test_idx)]:
        pred = clf.predict(X[idx])
        proba = clf.predict_proba(X[idx])
        report = classification_report(y[idx], pred, output_dict=True, zero_division=0)
        results[name] = {
            "n_samples": int(len(idx)),
            "accuracy": float((pred == y[idx]).mean()),
            "macro_f1": float(f1_score(y[idx], pred, average="macro", zero_division=0)),
            "report": report,
            "confusion_matrix": confusion_matrix(y[idx], pred, labels=list(clf.classes_)).tolist(),
            "classes_order": list(clf.classes_),
        }
        if hasattr(clf, "predict_proba"):
            results[name]["mean_max_proba"] = float(proba.max(axis=1).mean())

    (REPORT_DIR / "metrics.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Test macro F1: {results['test']['macro_f1']:.4f}")
    print(f"Saved {model_path} and metrics.json")


if __name__ == "__main__":
    main()
