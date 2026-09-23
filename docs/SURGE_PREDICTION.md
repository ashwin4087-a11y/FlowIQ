# FlowIQ Surge Prediction

## Purpose (project brief)

The **Festival Surge Predictor** is part of the **BRAIN** layer in **PREDICT → ADAPT → ACT**. It uses **past festival patterns** (simulation-derived in this prototype) to forecast **heavy traffic / festival congestion in advance**, support **early commuter warning**, and inform **signal plan preparation** before the surge.

It is **not** the same as the **short-horizon (t+50) queue surge model** in `ml/surge/`.

## Models

| Model | Horizon | Path | UI label |
|-------|---------|------|----------|
| Festival surge RF | Long (festival day / peak window) | `ml/festival_surge/` | PREDICT — Festival Surge |
| Short-horizon RF | t+50 simulator ticks | `ml/surge/` | Short-horizon (t+50) |

## Data provenance

> **The current prototype uses simulation-derived data.** Results demonstrate the prediction pipeline and **do not establish real-world Chennai forecasting accuracy.**

- Festival calendar: `ml/festival_surge/data/festivals.json` (Pongal, Diwali, Republic Day)
- Training data: `ml/festival_surge/data/festival_surge_dataset.csv` from `generate_dataset.py`
- Chennai junction IDs: canonical list in `src/data/chennaiJunctions.ts` / `server/data/chennai_junctions.json`

## API

- `GET /api/prediction/festival?chennaiJunctionId=&festivalId=&festivalDay=` — long-horizon forecast; `confidence` is **null** (not calibrated)
- `GET /api/prediction` — short-horizon state
- `GET /api/prediction/festivals` — supported festivals from dataset
- `GET /api/ml/festival-surge-metrics` — evaluation artifact (404 if not trained)

## Training

```bash
python ml/festival_surge/src/generate_dataset.py
python ml/festival_surge/src/train.py
```

Short-horizon model (unchanged):

```bash
python ml/surge/src/generate_dataset.py
python ml/surge/src/train.py
```

## UI interpretation

- **Arc indicator** shows predicted **class** (LOW / MODERATE / HIGH), not a calibrated probability.
- **Model features** panel shows RF feature importance — **not causation**.
- **PREDICT → ADAPT** connector shows **RECOMMENDATION** only; RL does not auto-adapt signals.

## Limitations

- No live Chennai traffic history in training
- No guaranteed “night before” lead-time measurement until real timestamps are wired
- No junction graph for surge spread animation (not invented in UI)
