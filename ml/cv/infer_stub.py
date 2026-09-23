"""Placeholder CV inference — extend with ultralytics/YOLO when weights are available."""
import json
import sys

print(
    json.dumps(
        {
            "status": "model_not_loaded",
            "source": "cv_stub",
            "note": "Set CV_MODEL_PATH and implement detector adapter; use simulation adapter meanwhile.",
        }
    )
)
sys.exit(0)
