"""Print ml/surge/reports/metrics.json."""
import json
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "reports" / "metrics.json"
if not p.exists():
    raise SystemExit("Run train.py first")
print(p.read_text(encoding="utf-8"))
