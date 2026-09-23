"""Feature extraction — must match between training and runtime inference."""
from typing import Any, Dict, List

FEATURE_NAMES: List[str] = [
    "vehicle_count",
    "queue_length",
    "average_speed_kmh",
    "q_north",
    "q_south",
    "q_east",
    "q_west",
    "vc_north",
    "vc_south",
    "vc_east",
    "vc_west",
    "remaining_seconds",
    "traffic_mode_surge",
    "phase_ns_green",
    "phase_ew_green",
    "phase_yellow",
    "phase_all_red",
]

PHASE_FLAGS = {
    "NORTH_SOUTH_GREEN": (1, 0, 0, 0),
    "EAST_WEST_GREEN": (0, 1, 0, 0),
    "NORTH_SOUTH_YELLOW": (0, 0, 1, 0),
    "EAST_WEST_YELLOW": (0, 0, 1, 0),
    "ALL_RED": (0, 0, 0, 1),
}


def lane_map(traffic: Dict[str, Any]) -> Dict[str, Dict[str, int]]:
    out = {d: {"queue": 0, "count": 0} for d in ("north", "south", "east", "west")}
    for lane in traffic.get("lanes") or []:
        lid = (lane.get("id") or lane.get("direction") or "").lower()
        if lid in out:
            out[lid]["queue"] = int(lane.get("queueLength") or 0)
            out[lid]["count"] = int(lane.get("vehicleCount") or 0)
    return out


def build_feature_vector(
    traffic: Dict[str, Any],
    signals: Dict[str, Any],
    traffic_mode: str = "NORMAL",
) -> List[float]:
    lanes = lane_map(traffic)
    phase = signals.get("activePhase") or "EAST_WEST_GREEN"
    pf = PHASE_FLAGS.get(phase, (0, 1, 0, 0))
    return [
        float(traffic.get("vehicleCount") or 0),
        float(traffic.get("queueLength") or 0),
        float(traffic.get("averageSpeedKmh") or 0),
        float(lanes["north"]["queue"]),
        float(lanes["south"]["queue"]),
        float(lanes["east"]["queue"]),
        float(lanes["west"]["queue"]),
        float(lanes["north"]["count"]),
        float(lanes["south"]["count"]),
        float(lanes["east"]["count"]),
        float(lanes["west"]["count"]),
        float(signals.get("remainingSeconds") or 0),
        1.0 if traffic_mode == "SURGE" else 0.0,
        float(pf[0]),
        float(pf[1]),
        float(pf[2]),
        float(pf[3]),
    ]
