"""Train PPO on JunctionSignalEnv (simulator-backed, not SUMO)."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"
TRAINING_REPORT = ROOT / "reports" / "training.json"


def main():
    status = {
        "provenance": "SIMULATION_DATA — ml/surge TrafficSimulator",
        "sumo": "NOT USED",
        "environment": "ml/rl/env_junction.py",
        "reward": "negative queue length minus 0.1 * vehicle count per step",
        "rl_policy_trained": False,
        "training_executed": False,
        "error": None,
    }
    try:
        from stable_baselines3 import PPO

        from env_junction import JunctionSignalEnv

        env = JunctionSignalEnv(seed=42)
        model = PPO("MlpPolicy", env, verbose=0, seed=42)
        model.learn(total_timesteps=8000)
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        out = MODEL_DIR / "junction_ppo.zip"
        model.save(str(out))
        status["rl_policy_trained"] = True
        status["training_executed"] = True
        status["model_path"] = str(out)
        status["timesteps"] = 8000
        status["random_seed"] = 42
    except ImportError as e:
        status["error"] = f"Missing dependency: {e}. pip install gymnasium stable-baselines3"
    except Exception as e:
        status["error"] = str(e)

    TRAINING_REPORT.parent.mkdir(parents=True, exist_ok=True)
    TRAINING_REPORT.write_text(json.dumps(status, indent=2), encoding="utf-8")
    print(json.dumps(status, indent=2))
    sys.exit(0 if status["rl_policy_trained"] else 1)


if __name__ == "__main__":
    main()
