# Emergency control

## Pipeline

1. Audio: WAV → CNN → `audioCandidate` (no auto actuation)
2. Operator: **Confirm** → `confirmAudioEmergency()` → simulated green wave
3. Demo button: `POST /api/emergency/demo` → `activateDemoEmergency()`

## Event fields (simulation)

- `eventId` (e.g. `EMG-SIM-0001`)
- `status`: idle | candidate | active | clearing | restored
- `affectedJunctions`, `affectedSignals`, `greenWavePlan`

Clearing/restoration: `clearEmergency()` + signal state machine **CLEARING** / **RESTORING**.

Physical signals are **not** controlled.
