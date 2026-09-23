"""Evaluate saved checkpoint; write reports/metrics.json (same schema as train.py)."""
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from torch.utils.data import DataLoader

from dataset import FlowIQAudioDataset
from model import SirenCNN
from train import run_epoch, evaluate_split, evaluate_by_source

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "siren_cnn.pt"
REPORT_PATH = ROOT / "reports" / "metrics.json"


def main():
    if not MODEL_PATH.exists():
        print(f"No model at {MODEL_PATH} — run train.py first")
        raise SystemExit(1)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = SirenCNN().to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))

    val_loader = DataLoader(FlowIQAudioDataset("val"), batch_size=32, shuffle=False)
    test_loader = DataLoader(FlowIQAudioDataset("test"), batch_size=32, shuffle=False)

    results = {"model_path": str(MODEL_PATH), "generated_by": "evaluate.py"}
    for name, loader in [("val", val_loader), ("test", test_loader)]:
        _, y, p, prob = run_epoch(model, loader, None, device, train=False)
        block = evaluate_split(name, y, p, prob)
        block["n_samples"] = int(len(y))
        block["class_support"] = {
            "NON_SIREN": int((y == 0).sum()),
            "SIREN": int((y == 1).sum()),
        }
        results[name] = block

    results["test_by_source"] = evaluate_by_source(model, device, "test")

    test_ds = FlowIQAudioDataset("test")
    results["dataset_note"] = {
        "test_total": len(test_ds.rows),
        "test_esc50": sum(1 for r in test_ds.rows if r["source"] == "esc50"),
        "test_sound": sum(1 for r in test_ds.rows if r["source"] == "sound"),
        "labels": ["NON_SIREN", "SIREN"],
        "mapping_tentative": "sound ambulance/firetruck → SIREN; traffic → NON_SIREN",
    }

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Wrote {REPORT_PATH}")


if __name__ == "__main__":
    main()
