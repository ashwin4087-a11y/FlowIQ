"""Lightweight traffic simulator aligned with simulation/digital-twin/trafficSimulation.ts (data generation only)."""
import random
from dataclasses import dataclass, field
from typing import Dict, List, Literal

Density = Literal["LOW", "MEDIUM", "HIGH"]
Mode = Literal["NORMAL", "SURGE"]
Phase = Literal[
    "NORTH_SOUTH_GREEN",
    "NORTH_SOUTH_YELLOW",
    "ALL_RED",
    "EAST_WEST_GREEN",
    "EAST_WEST_YELLOW",
]

DENSITY_RATES = {"LOW": 0.15, "MEDIUM": 0.45, "HIGH": 0.9}
CAP = {"LOW": 14, "MEDIUM": 28, "HIGH": 48}


@dataclass
class Vehicle:
    lane_id: str
    path_t: float = 0.0
    speed: float = 2.0
    max_speed: float = 6.0
    priority: bool = False
    state: str = "APPROACHING"


@dataclass
class TrafficSimulator:
    density: Density = "MEDIUM"
    traffic_mode: Mode = "NORMAL"
    signal_phase: Phase = "EAST_WEST_GREEN"
    remaining_seconds: int = 30
    vehicles: List[Vehicle] = field(default_factory=list)
    spawn_cooldown: float = 0.0
    rng: random.Random = field(default_factory=random.Random)

    def metrics(self) -> Dict:
        lanes = ["north", "south", "east", "west"]
        lane_metrics = []
        for lid in lanes:
            vs = [v for v in self.vehicles if v.lane_id == lid]
            queue = sum(1 for v in vs if v.state in ("STOPPED", "QUEUED"))
            avg = sum(v.speed for v in vs) / len(vs) if vs else 0.0
            lane_metrics.append(
                {
                    "id": lid,
                    "vehicleCount": len(vs),
                    "queueLength": queue,
                    "averageSpeedKmh": round(avg * 8),
                }
            )
        vehicle_count = len(self.vehicles)
        queue_length = sum(l["queueLength"] for l in lane_metrics)
        avg_speed = (
            round(sum(v.speed for v in self.vehicles) / vehicle_count * 8) if vehicle_count else 0
        )
        if queue_length > 12:
            congestion = "high"
        elif queue_length > 6:
            congestion = "moderate"
        else:
            congestion = "low"
        return {
            "lanes": lane_metrics,
            "vehicleCount": vehicle_count,
            "queueLength": queue_length,
            "averageSpeedKmh": avg_speed,
            "congestionLevel": congestion,
        }

    def _can_move(self, lane_id: str) -> bool:
        p = self.signal_phase
        if p in ("ALL_RED", "NORTH_SOUTH_YELLOW", "EAST_WEST_YELLOW"):
            return False
        if p == "NORTH_SOUTH_GREEN":
            return lane_id in ("north", "south")
        if p == "EAST_WEST_GREEN":
            return lane_id in ("east", "west")
        return False

    def tick(self, dt: float) -> None:
        rate = DENSITY_RATES[self.density] * (1.8 if self.traffic_mode == "SURGE" else 1.0)
        cap = CAP[self.density]
        self.spawn_cooldown -= dt
        if self.spawn_cooldown <= 0 and len(self.vehicles) < cap:
            lane = self.rng.choice(["north", "south", "east", "west"])
            self.vehicles.append(
                Vehicle(
                    lane_id=lane,
                    path_t=self.rng.uniform(0, 0.15),
                    speed=self.rng.uniform(2, 4),
                    max_speed=self.rng.uniform(6, 10),
                )
            )
            self.spawn_cooldown = 1.0 / rate

        for v in self.vehicles:
            allowed = v.priority or self._can_move(v.lane_id)
            near_stop = v.path_t < 0.4
            if not allowed and near_stop and not v.priority:
                v.speed = max(0.0, v.speed - 12 * dt)
                v.state = "STOPPED" if v.speed < 0.2 else "QUEUED"
            else:
                v.speed = min(v.max_speed, v.speed + 8 * dt)
                v.state = "CROSSING" if v.path_t > 0.5 else "ACCELERATING"
            v.path_t += v.speed * dt * 0.04
        self.vehicles = [v for v in self.vehicles if v.path_t < 1.05]

    def surge_label_from_metrics(self, m: Dict) -> str:
        q = m["queueLength"]
        if q >= 14:
            return "HIGH"
        if q >= 7:
            return "MODERATE"
        return "LOW"
