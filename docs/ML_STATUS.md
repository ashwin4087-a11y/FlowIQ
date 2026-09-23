# ML Status

## Audio (SIREN vs NON_SIREN)

See `ml/audio/reports/metrics.json` after running the audio pipeline.

## Surge (LOW / MODERATE / HIGH)

**Artifact:** `ml/surge/models/surge_rf.joblib`  
**Metrics:** `ml/surge/reports/metrics.json`

### Test split (held-out episodes, n=3000)

| Class | Precision | Recall | F1 | Support |
|-------|-----------|--------|-----|---------|
| HIGH | 1.000 | 1.000 | 1.000 | 70 |
| LOW | 0.986 | 0.956 | 0.971 | 2477 |
| MODERATE | 0.795 | 0.925 | 0.855 | 453 |

- **Accuracy:** 0.953  
- **Macro F1:** 0.942  

**Confusion matrix** (rows true, cols pred — order HIGH, LOW, MODERATE):

```
[[ 70,   0,   0],
 [  0, 2369, 108],
 [  0,   34, 419]]
```

### Limitations

- Training data is **simulator-generated** (same family as the browser digital twin), not real city traffic.
- High test scores reflect predictable simulator dynamics; **not** proof of real-world festival forecasting.
- `FESTIVAL SURGE (SIM)` only changes traffic influx in the sim; the forecast panel uses the **model** (`source: surge_model`).

### Backend

- Updates on `POST /api/simulation/sync` and `POST /api/prediction/refresh`
- Requires Python + `joblib` + trained model on the server host
