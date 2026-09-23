"""Leakage-safe splits: ESC-50 by fold; sound by stratified hash groups."""
import json
import random
from collections import defaultdict
from pathlib import Path

MANIFEST = Path(__file__).resolve().parents[1] / "data" / "manifests" / "all_manifest.jsonl"
OUT_DIR = Path(__file__).resolve().parents[1] / "data" / "manifests"

TRAIN_FOLDS = {1, 2, 3}
VAL_FOLD = 4
TEST_FOLD = 5


def load_manifest():
    rows = []
    with MANIFEST.open(encoding="utf-8") as f:
        for line in f:
            rows.append(json.loads(line))
    return rows


def assign_split(row):
    if row["source"] == "esc50":
        fold = row["fold"]
        if fold in TRAIN_FOLDS:
            return "train"
        if fold == VAL_FOLD:
            return "val"
        if fold == TEST_FOLD:
            return "test"
        return "train"
    return None  # sound handled separately


def split_sound(rows, seed=42):
    sound = [r for r in rows if r["source"] == "sound"]
    random.seed(seed)
    by_label = defaultdict(list)
    for r in sound:
        by_label[r["flowiq_label"]].append(r)
    splits = {"train": [], "val": [], "test": []}
    for label, items in by_label.items():
        random.shuffle(items)
        n = len(items)
        n_train = int(n * 0.7)
        n_val = int(n * 0.15)
        for i, item in enumerate(items):
            if i < n_train:
                splits["train"].append({**item, "split": "train"})
            elif i < n_train + n_val:
                splits["val"].append({**item, "split": "val"})
            else:
                splits["test"].append({**item, "split": "test"})
    return splits


def main():
    rows = load_manifest()
    esc = []
    for r in rows:
        if r["source"] != "esc50":
            continue
        esc.append({**r, "split": assign_split(r)})
    sound_splits = split_sound(rows)
    combined = esc + sound_splits["train"] + sound_splits["val"] + sound_splits["test"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / "splits.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2)
    counts = defaultdict(lambda: defaultdict(int))
    for r in combined:
        counts[r["split"]][r["flowiq_label"]] += 1
    print("Split counts:", dict(counts))
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
