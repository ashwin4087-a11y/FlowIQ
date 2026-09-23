"""
Fixed-time vs surge-mode traffic load on the surge TrafficSimulator (NOT SUMO).
Documents baseline comparison until SUMO + RL policy is connected.
"""
import json
import random
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
REPORT = ROOT / "reports" / "compare.json"
sys.path.insert(0, str(ROOT.parent / "surge" / "src"))
from simulator import TrafficSimulator  # noqa: E402


def run_episode(mode: str, seed: int) -> dict:
    sim = TrafficSimulator()
    sim.rng = random.Random(seed)
    sim.traffic_mode = "SURGE" if mode == "surge" else "NORMAL"
    queues = []
    for _ in range(80):
        sim.tick(0.05)
        queues.append(sim.metrics()["queueLength"])
    return {"mean_queue": sum(queues) / len(queues), "max_queue": max(queues)}


def main():
    fixed = [run_episode("normal", s) for s in range(20, 40)]
    surge = [run_episode("surge", s) for s in range(40, 60)]
    f_mean = sum(e["mean_queue"] for e in fixed) / len(fixed)
    s_mean = sum(e["mean_queue"] for e in surge) / len(surge)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    out = {
        "provenance": "SIMULATION_DATA — ml/surge TrafficSimulator",
        "sumo_connected": False,
        "rl_policy_trained": False,
        "comparison": "NORMAL traffic mode vs SURGE traffic mode (open-loop)",
        "episodes_per_condition": len(fixed),
        "normal_mode_mean_queue": f_mean,
        "surge_mode_mean_queue": s_mean,
        "note": "Train RL with SUMO when installed; see docs/RL_TRAFFIC_CONTROL.md",
    }
    REPORT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
