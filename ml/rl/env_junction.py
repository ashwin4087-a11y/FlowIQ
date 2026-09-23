"""Gymnasium junction env using ml/surge TrafficSimulator (SUMO not required)."""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "surge" / "src"))
from simulator import TrafficSimulator  # noqa: E402

try:
    import gymnasium as gym
    from gymnasium import spaces
except ImportError:
    gym = None
    spaces = None

ACTIONS = ["HOLD", "EXTEND_NS_GREEN", "EXTEND_EW_GREEN", "NEXT_PHASE"]
PHASES = [
    "NORTH_SOUTH_GREEN",
    "NORTH_SOUTH_YELLOW",
    "ALL_RED",
    "EAST_WEST_GREEN",
    "EAST_WEST_YELLOW",
]


class JunctionSignalEnv(gym.Env if gym else object):
    metadata = {"render_modes": []}

    def __init__(self, seed: int = 42):
        if gym is None:
            raise RuntimeError("gymnasium not installed")
        super().__init__()
        self.sim = TrafficSimulator()
        self.sim.rng.seed(seed)
        self.action_space = spaces.Discrete(len(ACTIONS))
        self.observation_space = spaces.Box(low=0, high=1, shape=(9,), dtype=np.float32)
        self._step = 0
        self._max_steps = 120

    def _obs(self):
        m = self.sim.metrics()
        lanes = {l["id"]: l for l in m["lanes"]}
        phase_idx = PHASES.index(self.sim.signal_phase) if self.sim.signal_phase in PHASES else 0
        return np.array(
            [
                m["queueLength"] / 40.0,
                m["vehicleCount"] / 50.0,
                lanes.get("north", {}).get("queueLength", 0) / 20.0,
                lanes.get("south", {}).get("queueLength", 0) / 20.0,
                lanes.get("east", {}).get("queueLength", 0) / 20.0,
                lanes.get("west", {}).get("queueLength", 0) / 20.0,
                phase_idx / 5.0,
                min(1.0, self.sim.remaining_seconds / 60.0),
                1.0 if self.sim.traffic_mode == "SURGE" else 0.0,
            ],
            dtype=np.float32,
        )

    def _apply_action(self, action: int):
        name = ACTIONS[action]
        if name == "EXTEND_NS_GREEN" and self.sim.signal_phase == "NORTH_SOUTH_GREEN":
            self.sim.remaining_seconds = min(90, self.sim.remaining_seconds + 4)
        elif name == "EXTEND_EW_GREEN" and self.sim.signal_phase == "EAST_WEST_GREEN":
            self.sim.remaining_seconds = min(90, self.sim.remaining_seconds + 4)
        elif name == "NEXT_PHASE":
            self.sim.remaining_seconds = 0

    def _tick_signal(self):
        if self.sim.remaining_seconds > 0:
            self.sim.remaining_seconds -= 1
        else:
            order = PHASES + ["ALL_RED"]
            idx = order.index(self.sim.signal_phase) if self.sim.signal_phase in order else 0
            self.sim.signal_phase = order[(idx + 1) % len(order)]
            self.sim.remaining_seconds = 30

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        if seed is not None:
            self.sim.rng.seed(seed)
        self.sim.vehicles.clear()
        self._step = 0
        return self._obs(), {}

    def step(self, action):
        self._apply_action(int(action))
        self.sim.tick(0.1)
        self._tick_signal()
        m = self.sim.metrics()
        reward = -float(m["queueLength"]) - 0.1 * float(m["vehicleCount"])
        waiting = float(m.get("queueLength") or 0) * 2.0
        throughput_delta = len(getattr(self.sim, "exited_ids", []) or [])
        self._step += 1
        terminated = self._step >= self._max_steps
        return self._obs(), reward, terminated, False, {
            "queue": m["queueLength"],
            "waiting": waiting,
            "throughput_delta": throughput_delta,
        }
