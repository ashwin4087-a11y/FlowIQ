# End-to-end demo

## Run the stack

```bash
# Terminal 1
cd server && npm start

# Terminal 2
npm run dev
```

Open **OVERVIEW**. Use **RUN FLOWIQ SCENARIO** (left column):

1. **FlowIQ end-to-end (simulation)** — start, then **Advance step** through festival forecast, surge traffic, adapt, emergency, restore.
2. **Reset** clears scenario and emergency.

## What updates

- Backend `flowiqState` (canonical)
- Socket.IO → dashboard PREDICT / ADAPT / ACT
- 3D twin via frontend simulation sync
- Commuter alerts when festival forecast is HIGH

All steps are labelled **SIMULATION**.
