"""Festival long-horizon surge features — training and inference."""
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "festival_catalog.json"
JUNCTIONS_PATH = ROOT / "data" / "chennai_junction_baselines.json"

FEATURE_NAMES: List[str] = [
    "junction_vehicle_count",
    "junction_base_lane_a",
    "junction_base_lane_b",
    "status_critical",
    "status_warning",
    "festival_day_norm",
    "festival_duration_days",
    "festival_surge_intensity",
    "hour_sin",
    "hour_cos",
]

STATUS_FLAGS = {"critical": (1.0, 0.0), "warning": (0.0, 1.0), "normal": (0.0, 0.0)}


def load_catalog() -> Dict[str, Any]:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def load_junctions() -> List[Dict[str, Any]]:
    return json.loads(JUNCTIONS_PATH.read_text(encoding="utf-8"))["junctions"]


def junction_by_id(junction_id: str) -> Dict[str, Any]:
    for j in load_junctions():
        if j["id"] == str(junction_id):
            return j
    raise KeyError(f"Unknown junction id {junction_id}")


def festival_by_id(festival_id: str) -> Dict[str, Any]:
    for f in load_catalog()["festivals"]:
        if f["id"] == festival_id:
            return f
    raise KeyError(f"Unknown festival id {festival_id}")


def build_festival_feature_vector(
    junction_id: str,
    festival_id: str,
    festival_day: int,
    hour_of_day: float,
) -> List[float]:
    j = junction_by_id(junction_id)
    fest = festival_by_id(festival_id)
    sc, sw = STATUS_FLAGS.get(j.get("status", "normal"), (0.0, 0.0))
    duration = max(1, int(fest.get("duration_days", 1)))
    day_norm = (festival_day - 1) / max(1, duration - 1) if duration > 1 else 0.0
    hour_rad = (hour_of_day % 24) / 24.0 * 2.0 * math.pi
    return [
        float(j["vehicleCount"]),
        float(j["baseLaneA"]),
        float(j["baseLaneB"]),
        sc,
        sw,
        float(day_norm),
        float(duration),
        float(fest.get("surge_intensity", 0.5)),
        float(math.sin(hour_rad)),
        float(math.cos(hour_rad)),
    ]


def surge_label_from_queue(queue: float) -> str:
    if queue >= 14:
        return "HIGH"
    if queue >= 7:
        return "MODERATE"
    return "LOW"
