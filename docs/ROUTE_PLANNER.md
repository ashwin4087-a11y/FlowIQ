# FlowIQ Route Planner

## Architecture

| Layer | Provider | Role |
|-------|----------|------|
| **Map** | MapTiler (`@maptiler/sdk` + MapLibre) | Interactive basemap, pan/zoom, controls |
| **Geocoding** | MapTiler Geocoding API | Search origin/destination |
| **Routing** | OSRM (OpenStreetMap road network) | Road-following route geometry + alternatives |
| **Intelligence** | FlowIQ backend | Simulated congestion scoring + junction surge forecast |

MapTiler Cloud does **not** expose a stable public Directions API on `api.maptiler.com` (verified 404). Routing therefore uses **OSRM** while the map remains **MapTiler**.

## API

`POST /api/routes/plan`

```json
{
  "from": { "lng": 80.282, "lat": 13.085 },
  "to": { "lng": 80.210, "lat": 13.088 }
}
```

Returns OSRM GeoJSON geometries and FlowIQ evaluation (`FLOWIQ_RECOMMENDED`, `FASTEST`, `ALTERNATIVE`).

## Scoring (transparent)

```
flowiqAdjustedDuration = routingDuration × (1 + surgePenalty + junctionLoad×0.08) × (1 + simCongestionScore/400)
```

- `surgePenalty`: from existing surge model output on junction state (`HIGH` / `MODERATE` / `LOW`) — simulator-derived, not live traffic.
- `junctionLoad`: `min(1, queueLength/40)` from in-memory junction simulation.
- `simCongestionScore`: deterministic hash of route geometry vertices (labeled **FLOWIQ SIMULATED TRAFFIC**).

## Environment

- `VITE_MAPTILER_API_KEY` — required for map + geocoding in the browser.
- `ROUTING_OSRM_URL` — optional backend override (default `https://router.project-osrm.org`).

## Removed (incorrect prototype)

The previous hard-coded junction graph (`routeService.js`, 3D line overlay, dashboard ROUTE INTELLIGENCE card) was **removed** — it did not use real road geometry.
