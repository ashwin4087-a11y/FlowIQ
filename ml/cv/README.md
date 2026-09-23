# Computer vision traffic pipeline

**Status:** SIMULATION ADAPTER (default) · YOLO hook optional via `CV_MODEL_PATH`

## Architecture

```
VIDEO / CAMERA  →  YOLO (optional)  →  filter  →  count  →  lane aggregate  →  traffic state schema
SIMULATION      →  cvTrafficService adapter  →  same schema
```

Server: `server/services/cvTrafficService.js`  
API: `GET /api/cv/status`, `GET /api/cv/observation`

## Evaluation

No Chennai-labelled detection dataset is bundled. Do not report mAP or precision without running evaluation on a real dataset.

## Optional model

Set `CV_MODEL_PATH` to a YOLO weights file. Inference script placeholder: `ml/cv/infer_stub.py` (returns `model_not_loaded` unless extended).
