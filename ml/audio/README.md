# FlowIQ Audio ML (SIREN vs NON_SIREN)

## Label mapping (tentative)

| Source | Original | FlowIQ |
|--------|----------|--------|
| ESC-50 | siren | SIREN |
| ESC-50 | *other* | NON_SIREN |
| sound.zip | ambulance, firetruck | SIREN (tentative) |
| sound.zip | traffic | NON_SIREN |

No POLICE class.

## Splits

- ESC-50: folds 1–3 train, 4 val, 5 test
- sound.zip: MD5 dedupe, stratified 70/15/15

## Commands

```bash
cd ml/audio
pip install -r requirements.txt
python src/build_manifest.py
python src/split_manifest.py
python src/train.py
```

Set `FLOWIQ_ESC50_ZIP` and `FLOWIQ_SOUND_ZIP` to local zip paths (not committed).
