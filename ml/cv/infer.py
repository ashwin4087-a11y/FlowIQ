"""
CV inference: YOLO when ultralytics + weights available, else explicit not_loaded.
Output schema matches cvTrafficService aggregation.
"""
import argparse
import json
import sys
from pathlib import Path

# COCO vehicle-related classes when using default YOLO
VEHICLE_NAMES = {"car", "motorcycle", "bus", "truck", "bicycle"}


def aggregate_by_vertical_zones(boxes, img_w, img_h):
    """Map detections to N/S/E/W approach buckets by image quadrants (prototype)."""
    zones = {"north": 0, "south": 0, "east": 0, "west": 0}
    for box in boxes:
        x1, y1, x2, y2 = box["xyxy"]
        cy = (y1 + y2) / 2
        cx = (x1 + x2) / 2
        if cy < img_h * 0.35:
            zones["north"] += 1
        elif cy > img_h * 0.65:
            zones["south"] += 1
        elif cx > img_w * 0.55:
            zones["east"] += 1
        elif cx < img_w * 0.45:
            zones["west"] += 1
    return zones


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--model", default="")
    args = parser.parse_args()
    img_path = Path(args.image)
    if not img_path.exists():
        print(json.dumps({"status": "error", "message": "image not found"}))
        return

    model_path = args.model.strip()
    try:
        from ultralytics import YOLO
    except ImportError:
        print(
            json.dumps(
                {
                    "status": "model_not_loaded",
                    "source": "cv_adapter",
                    "note": "pip install ultralytics and set CV_MODEL_PATH to weights",
                }
            )
        )
        return

    weights = model_path if model_path and Path(model_path).exists() else "yolov8n.pt"
    try:
        model = YOLO(weights)
        results = model.predict(str(img_path), verbose=False)[0]
        boxes = []
        img_h, img_w = results.orig_shape
        for b in results.boxes:
            name = results.names[int(b.cls[0])].lower()
            if name not in VEHICLE_NAMES:
                continue
            xyxy = b.xyxy[0].tolist()
            boxes.append({"class": name, "conf": float(b.conf[0]), "xyxy": xyxy})
        zones = aggregate_by_vertical_zones(boxes, img_w, img_h)
        total = sum(zones.values())
        lanes = [
            {"id": k, "direction": k.upper(), "vehicleCount": v, "queueLength": max(0, v - 1)}
            for k, v in zones.items()
        ]
        print(
            json.dumps(
                {
                    "status": "ok",
                    "source": "cv_model",
                    "simulated": False,
                    "vehicleCount": total,
                    "queueLength": sum(l["queueLength"] for l in lanes),
                    "lanes": lanes,
                    "detections": len(boxes),
                    "confidence": None,
                    "model": str(weights),
                }
            )
        )
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))


if __name__ == "__main__":
    main()
