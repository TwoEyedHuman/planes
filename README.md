# planes.brandonlocke.xyz

> A minimalist, fullscreen live flight tracker showing aircraft overhead — dark, cinematic, no clutter.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Environment Strategy](#environment-strategy)
5. [Pre-Flight Checklist](#pre-flight-checklist)
6. [Implementation Stories](#implementation-stories)
7. [Definition of Done](#definition-of-done)

---

## Architecture Overview

```
Browser
│
├── MapLibre GL JS          ← fullscreen dark map, Stadia Alidade Smooth Dark tiles
├── OpenSky REST API        ← polled every 10s directly from the browser (CORS-friendly)
│   └── /api/states/all?lamin=&lomin=&lamax=&lomax=   ← bounded by current map viewport
│
├── Position Interpolator   ← linear interpolation between poll cycles using speed + heading
├── Plane Icon Layer        ← SVG icons rotated per heading, rendered as MapLibre markers
│
├── localStorage            ← persists last map center (lat/lng) across sessions
│
└── Lookup Bundles (static JSON, bundled at build time)
    ├── icao-aircraft.json  ← ICAO24 hex → manufacturer + model
    └── icao-airlines.json  ← airline ICAO prefix → full airline name
```

### Key Design Decisions

- **No backend:** OpenSky's public API is called directly from the browser — no proxy, no server, no cold start latency. Fly.io serves only the static `dist/` folder.
- **Static JSON lookups:** Aircraft type and airline name data is bundled at build time rather than fetched at runtime, keeping the detail card instantaneous and offline-resilient.
- **Interpolation over raw polling:** Planes are moved smoothly between 10s poll snapshots using their reported speed and heading, preventing the jarring "jump" of raw ADS-B data.
- **localStorage for location persistence:** Last viewed center is stored in `localStorage` so returning users land where they left off; first-time users are offered geolocation, falling back to Radnor, PA.

---

## Repository Structure

```
planes/
├── README.md
├── .gitignore
├── fly.toml                  ← Fly.io static site config
├── Makefile
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.js               ← entry point, wires everything together
    ├── map.js                ← MapLibre init, tile config, dark style
    ├── opensky.js            ← API polling, viewport bounds extraction
    ├── interpolator.js       ← per-plane position interpolation between polls
    ├── markers.js            ← SVG plane icon creation, rotation, click handling
    ├── detail-card.js        ← selected plane UI card
    ├── location.js           ← geolocation, localStorage persistence, Radnor fallback
    ├── style.css             ← minimal global styles, detail card, dark overrides
    │
    └── data/
        ├── icao-aircraft.json   ← ICAO24 → { manufacturer, model }
        └── icao-airlines.json   ← ICAO airline prefix → airline name
```

---

## Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Build tool | Vite | Fast cold starts, zero-config static bundling |
| Map | MapLibre GL JS | Open source, smooth WebGL rendering, no account required |
| Map tiles | Stadia Alidade Smooth Dark | Free tier, dark aesthetic, minimal labels |
| Flight data | OpenSky Network public API | Free, no API key, CORS-open, global ADS-B coverage |
| Aircraft lookup | Bundled ICAO JSON | Zero-latency detail card, no runtime dependency |
| State | localStorage | Persists last center, no backend needed |
| Hosting | Fly.io (static) | Spins to zero, fast cold start for static assets |
| DNS | planes.brandonlocke.xyz | Cloudflare DNS assumed |

---

## Environment Strategy

| | Local | Production |
|---|---|---|
| Domain | `localhost:5173` | `planes.brandonlocke.xyz` |
| TLS | none | Fly.io managed |
| Deploy | `npm run dev` | `fly deploy` (manual or GitHub Actions) |
| Secrets | none — no API keys needed | none |

---

## Pre-Flight Checklist

Run before first deploy and after any environment change:

```bash
# Node is available
node -v && echo "✓ Node found" || echo "✗ Install Node 18+"

# Dependencies installed
test -d node_modules && echo "✓ node_modules present" || echo "✗ Run npm install"

# Vite builds cleanly
npm run build && echo "✓ Build succeeded" || echo "✗ Fix build errors before deploy"

# Fly CLI authenticated
fly auth whoami && echo "✓ Fly authenticated" || echo "✗ Run fly auth login"

# App exists on Fly
fly status --app planes-brandonlocke && echo "✓ App found" || echo "✗ Run fly launch"
```

---

## Implementation Stories

### Story 1.1 — Project scaffold + map baseline

**Context:** Empty repo. This story creates the Vite project, installs MapLibre, and renders a fullscreen dark map centered on Radnor, PA with no UI chrome.

**Assumptions:**
- Node 18+ installed locally
- Fly CLI installed and authenticated
- `planes.brandonlocke.xyz` DNS points to Fly.io

**Tasks:**
- `npm create vite@latest planes -- --template vanilla` and install `maplibre-gl`
- Configure `vite.config.js` with no base path overrides (serves from `/`)
- Create `src/map.js`: init MapLibre with Stadia Alidade Smooth Dark tiles, fullscreen, no default controls
- Create `src/location.js`: read `localStorage('planes:center')`; if present use it; else try `navigator.geolocation`; else fall back to Radnor, PA `{ lat: 40.0409, lng: -75.3599 }`
- Wire `src/main.js` to call `location.js` then `map.js`
- Add `src/style.css`: `body/html { margin:0; overflow:hidden }`, map fills viewport
- Add `fly.toml` configured as a static site serving `dist/`
- Create `Makefile` with `dev`, `build`, `deploy` targets

**Out of Scope:** Planes, polling, any UI beyond the map

**Acceptance Criteria:**
- [ ] `npm run dev` → dark fullscreen map loads at localhost, centered correctly
- [ ] Reloading after panning retains last center via localStorage
- [ ] `npm run build` produces a clean `dist/`
- [ ] `fly deploy` serves the map at the production domain

---

### Story 1.2 — OpenSky polling + raw plane markers

**Context:** Dark map is live. This story fetches live flight data from OpenSky and renders a plane icon at each aircraft's reported position.

**Assumptions:**
- Story 1.1 complete; map renders and centers correctly
- OpenSky public API accessible (no auth required)

**Tasks:**
- Create `src/opensky.js`: export `fetchPlanes(bounds)` that GETs `/api/states/all` with `lamin/lomin/lamax/lomax` derived from current MapLibre viewport bounds
- Create `src/markers.js`: export `upsertMarkers(planes, map)` — for each plane, create or update a `maplibregl.Marker` using an inline SVG airplane icon rotated to `true_track` heading; remove markers for planes no longer in response
- Wire polling in `src/main.js`: on map `moveend` and every 10s, call `fetchPlanes` then `upsertMarkers`
- SVG icon: simple top-down aircraft silhouette, white fill, ~24px, `transform-origin: center`
- Store active markers in a `Map<icao24, marker>` for diffing

**Out of Scope:** Interpolation, click handling, detail card

**Acceptance Criteria:**
- [ ] Planes appear on the map within 10s of load
- [ ] Plane icons point in their direction of travel
- [ ] Panning/zooming triggers a re-fetch and markers update correctly
- [ ] Planes that leave the viewport are removed from the DOM

---

### Story 1.3 — Position interpolation

**Context:** Planes appear but jump every 10s poll. This story adds smooth linear interpolation between poll snapshots so planes glide continuously.

**Assumptions:**
- Story 1.2 complete; raw markers rendering

**Tasks:**
- Create `src/interpolator.js`:
  - Store previous snapshot `{ icao24 → { lat, lon, velocity, true_track, timestamp } }`
  - On each new poll, diff against previous snapshot and store `{ prev, next, pollTime }`
  - Export `getInterpolatedPositions(now)`: for each tracked plane, compute elapsed fraction `t = (now - pollTime) / 10000`, clamp to `[0,1]`, linearly interpolate `lat` and `lon` using `velocity` + `true_track` (dead reckoning: `Δlat = velocity * cos(heading) * t * 10`, `Δlon = velocity * sin(heading) * t * 10 / cos(lat)`)
- In `src/main.js`: run a `requestAnimationFrame` loop calling `getInterpolatedPositions(Date.now())` and `upsertMarkers` each frame instead of only on poll
- Markers update position each frame via `marker.setLngLat([lon, lat])`

**Out of Scope:** Heading interpolation (heading stays at last known value)

**Acceptance Criteria:**
- [ ] Planes move smoothly between poll cycles with no visible jump
- [ ] New planes (not in previous snapshot) appear at their reported position immediately
- [ ] Planes that drop out of a poll response fade out — add a 5s grace period before removing

---

### Story 1.4 — Click-to-select detail card

**Context:** Planes move smoothly. This story adds a detail card that appears when a plane is clicked, showing airline name and aircraft make/model.

**Assumptions:**
- Story 1.3 complete
- ICAO aircraft and airline lookup JSON files exist at `src/data/`

**Tasks:**
- Source and bundle lookup data:
  - `src/data/icao-aircraft.json`: map of `icao24 hex → { manufacturer, model }` (source from OpenSky aircraft metadata or a curated subset)
  - `src/data/icao-airlines.json`: map of `callsign prefix (3-char ICAO) → airline name` (e.g. `"UAL" → "United Airlines"`)
- Create `src/detail-card.js`:
  - `showCard(plane)`: populate and show a fixed-position card with airline name (looked up from callsign prefix) and aircraft make/model (looked up from `icao24`); fall back to raw callsign / ICAO type if not found
  - `hideCard()`: hide/remove the card
- In `src/markers.js`: attach click listener to each marker element; on click, call `showCard(plane)` and add an `.selected` CSS class to the icon; clicking map background calls `hideCard()`
- Style the card in `src/style.css`: bottom-left or bottom-center, dark translucent background, monospaced data, no border radius — cockpit readout aesthetic

**Out of Scope:** Flight history, route display, external links

**Acceptance Criteria:**
- [ ] Clicking a plane shows the card with airline and aircraft type
- [ ] Unknown planes show graceful fallbacks (raw callsign, "Unknown type")
- [ ] Clicking elsewhere dismisses the card
- [ ] Card is readable on mobile viewport widths

---

## Definition of Done

A story is done when:
- [ ] All acceptance criteria are checked
- [ ] `npm run build` succeeds with no warnings
- [ ] The feature works at `planes.brandonlocke.xyz` after `fly deploy`
- [ ] No API keys or secrets are committed
- [ ] No `console.error` output in normal operation
