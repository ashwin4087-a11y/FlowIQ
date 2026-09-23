"""Build FlowIQ audio manifest from local ESC-50 and sound.zip (paths via env)."""
import csv
import hashlib
import io
import json
import os
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ESC_ZIP = Path(os.environ.get("FLOWIQ_ESC50_ZIP", ROOT / "ESC-50-master.zip"))
SOUND_ZIP = Path(os.environ.get("FLOWIQ_SOUND_ZIP", ROOT / "sound.zip"))
OUT = Path(__file__).resolve().parents[1] / "data" / "manifests" / "all_manifest.jsonl"

URBAN_NEG = {"car_horn", "engine", "train", "airplane", "helicopter"}


def esc50_rows():
    if not ESC_ZIP.exists():
        raise FileNotFoundError(f"ESC-50 zip not found: {ESC_ZIP}")
    z = zipfile.ZipFile(ESC_ZIP)
    text = z.read("ESC-50-master/meta/esc50.csv").decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    for r in rows:
        cat = r["category"]
        label = "SIREN" if cat == "siren" else "NON_SIREN"
        yield {
            "id": f"esc50_{r['filename']}",
            "path": f"zip://{ESC_ZIP}!ESC-50-master/audio/{r['filename']}",
            "source": "esc50",
            "original_label": cat,
            "flowiq_label": label,
            "fold": int(r["fold"]),
            "split_group": f"esc50_fold_{r['fold']}",
        }
    z.close()


def sound_rows():
    if not SOUND_ZIP.exists():
        raise FileNotFoundError(f"sound.zip not found: {SOUND_ZIP}")
    z = zipfile.ZipFile(SOUND_ZIP)
    seen = {}
    for name in sorted(z.namelist()):
        if not name.endswith(".wav"):
            continue
        cls = name.split("/")[1]
        if cls not in ("ambulance", "firetruck", "traffic"):
            continue
        data = z.read(name)
        md5 = hashlib.md5(data).hexdigest()
        if md5 in seen:
            continue
        seen[md5] = name
        label = "SIREN" if cls in ("ambulance", "firetruck") else "NON_SIREN"
        yield {
            "id": f"sound_{name.replace('/', '_')}",
            "path": f"zip://{SOUND_ZIP}!{name}",
            "source": "sound",
            "original_label": cls,
            "flowiq_label": label,
            "fold": None,
            "split_group": f"sound_{cls}_{md5[:8]}",
            "md5": md5,
        }
    z.close()


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    items = list(esc50_rows()) + list(sound_rows())
    with OUT.open("w", encoding="utf-8") as f:
        for row in items:
            f.write(json.dumps(row) + "\n")
    print(f"Wrote {len(items)} manifest rows to {OUT}")


if __name__ == "__main__":
    main()
