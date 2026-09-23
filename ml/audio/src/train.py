"""Train baseline SIREN vs NON_SIREN CNN."""
import json
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import numpy as np

from dataset import FlowIQAudioDataset
from model import SirenCNN

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"


def run_epoch(model, loader, optimizer, device, train=True):
    criterion = nn.CrossEntropyLoss()
    model.train(train)
    total_loss = 0.0
    all_y, all_p, all_prob = [], [], []
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        if train:
            optimizer.zero_grad()
        logits = model(x)
        loss = criterion(logits, y)
        if train:
            loss.backward()
            optimizer.step()
        total_loss += loss.item() * x.size(0)
        probs = torch.softmax(logits, dim=1)[:, 1].detach().cpu().numpy()
        preds = logits.argmax(dim=1).detach().cpu().numpy()
        all_y.extend(y.cpu().numpy())
        all_p.extend(preds)
        all_prob.extend(probs)
    n = len(loader.dataset)
    return total_loss / max(n, 1), np.array(all_y), np.array(all_p), np.array(all_prob)


def evaluate_split(name, y, p, prob):
    report = classification_report(y, p, target_names=["NON_SIREN", "SIREN"], output_dict=True, zero_division=0)
    cm = confusion_matrix(y, p).tolist()
    auc = None
    if len(np.unique(y)) > 1:
        auc = float(roc_auc_score(y, prob))
    return {
        "split": name,
        "n_samples": int(len(y)),
        "class_support": {"NON_SIREN": int((y == 0).sum()), "SIREN": int((y == 1).sum())},
        "report": report,
        "confusion_matrix": cm,
        "roc_auc": auc,
    }


def evaluate_by_source(model, device, split_name: str):
    ds = FlowIQAudioDataset(split_name)
    loader = DataLoader(ds, batch_size=32, shuffle=False, num_workers=0)
    _, y, p, prob = run_epoch(model, loader, None, device, train=False)
    out = {}
    for source in ("esc50", "sound"):
        idx = [i for i, r in enumerate(ds.rows) if r["source"] == source]
        if not idx:
            continue
        ys, ps, prs = y[idx], p[idx], prob[idx]
        block = evaluate_split(f"{split_name}_{source}", ys, ps, prs)
        out[source] = block
    return out


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_ds = FlowIQAudioDataset("train")
    val_ds = FlowIQAudioDataset("val")
    test_ds = FlowIQAudioDataset("test")
    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=32, shuffle=False, num_workers=0)

    model = SirenCNN().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    best_val_f1 = 0.0
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    for epoch in range(5):
        tr_loss, _, _, _ = run_epoch(model, train_loader, optimizer, device, train=True)
        _, vy, vp, vprob = run_epoch(model, val_loader, optimizer, device, train=False)
        val_report = evaluate_split("val", vy, vp, vprob)
        f1 = val_report["report"]["SIREN"]["f1-score"]
        print(f"epoch {epoch+1} loss={tr_loss:.4f} val_siren_f1={f1:.4f}", flush=True)
        if f1 >= best_val_f1:
            best_val_f1 = f1
            torch.save(model.state_dict(), MODEL_DIR / "siren_cnn.pt")

    model.load_state_dict(torch.load(MODEL_DIR / "siren_cnn.pt", map_location=device))
    results = {}
    for name, loader in [("val", val_loader), ("test", test_loader)]:
        _, y, p, prob = run_epoch(model, loader, optimizer, device, train=False)
        results[name] = evaluate_split(name, y, p, prob)

    results["test_by_source"] = evaluate_by_source(model, device, "test")
    test_ds = FlowIQAudioDataset("test")
    results["dataset_note"] = {
        "test_total": len(test_ds.rows),
        "test_esc50": sum(1 for r in test_ds.rows if r["source"] == "esc50"),
        "test_sound": sum(1 for r in test_ds.rows if r["source"] == "sound"),
        "labels": ["NON_SIREN", "SIREN"],
        "mapping_tentative": "sound ambulance/firetruck → SIREN; traffic → NON_SIREN",
    }
    with (REPORT_DIR / "metrics.json").open("w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("Saved model and", REPORT_DIR / "metrics.json")


if __name__ == "__main__":
    main()
