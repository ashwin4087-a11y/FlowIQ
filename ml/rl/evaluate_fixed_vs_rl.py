"""Compare fixed-time stepping vs trained PPO on JunctionSignalEnv — single evaluation artifact."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPORT = ROOT / "reports" / "compare.json"
MODEL = ROOT / "models" / "junction_ppo.zip"
EPISODES = 10
SEED_FIXED = 100
SEED_PPO = 200


def run_policy(env, episodes, policy_fn, seed_base):
    q_means = []
    wait_means = []
    for ep in range(episodes):
        obs, _ = env.reset(seed=seed_base + ep)
        qsum = 0
        wsum = 0
        n = 0
        done = False
        while not done:
            action = policy_fn(obs)
            obs, _, term, trunc, info = env.step(int(action))
            qsum += info.get("queue", 0)
            wsum += info.get("waiting", 0)
            n += 1
            done = term or trunc
        q_means.append(qsum / max(n, 1))
        wait_means.append(wsum / max(n, 1))

    def avg(xs):
        return sum(xs) / len(xs) if xs else None

    return {
        "mean_queue_per_step": avg(q_means),
        "mean_waiting_per_step": avg(wait_means),
        "throughput_per_step": "Not measured",
        "travel_time": "Not measured",
        "episodes": episodes,
        "random_seed_base": seed_base,
    }


def main():
    out = {
        "experiment": "Fixed-Time vs PPO",
        "label": "SIMULATION_DATA",
        "sumo": "NOT USED",
        "environment": "ml/rl/env_junction.py (TrafficSimulator-backed Gymnasium env)",
        "metric_primary": "mean_queue_per_step",
        "reward_documentation": (
            "Training reward: -queue_length - 0.1 * vehicle_count per env step (simulator only)."
        ),
        "evaluation_status": "not_executed",
        "rl_policy_trained": MODEL.exists(),
        "ppo_checkpoint": str(MODEL) if MODEL.exists() else None,
        "fixed_time_controller": None,
        "ppo_controller": None,
        "note": "Results are simulator-only; not real-world Chennai traffic improvement.",
    }
    try:
        from stable_baselines3 import PPO

        from env_junction import JunctionSignalEnv

        env = JunctionSignalEnv(seed=42)
        fixed = run_policy(env, EPISODES, policy_fn=lambda _obs: 0, seed_base=SEED_FIXED)
        out["fixed_time_controller"] = fixed
        if MODEL.exists():
            model = PPO.load(str(MODEL))
            ppo = run_policy(
                env,
                EPISODES,
                policy_fn=lambda obs: int(model.predict(obs, deterministic=True)[0]),
                seed_base=SEED_PPO,
            )
            out["ppo_controller"] = ppo
            if fixed["mean_queue_per_step"] is not None and ppo["mean_queue_per_step"] is not None:
                out["ppo_lower_mean_queue_than_fixed"] = (
                    ppo["mean_queue_per_step"] < fixed["mean_queue_per_step"]
                )
        out["evaluation_status"] = "executed"
        out["episodes_per_controller"] = EPISODES
    except Exception as e:
        out["evaluation_status"] = "error"
        out["error"] = str(e)

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2))
    sys.exit(0 if out["evaluation_status"] == "executed" else 1)


if __name__ == "__main__":
    main()
