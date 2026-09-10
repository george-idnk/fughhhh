# God's Eye View — Local Setup

Setup notes and a helper script for running
[bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view)
locally: a browser-based, photorealistic 3D globe with live aircraft, ships,
satellites, earthquakes, traffic, and public cameras, plus optional
voice-controlled AI features.

This directory does not vendor the app's source — `setup.sh` clones the
upstream repo into `gods-eye-view-app/` (gitignored) alongside this file.

## Prerequisites

- **Node.js 24.x (24.14.0+) or 26.x** — the app's own `npm run doctor`
  script checks this and warns on unsupported versions.
- **npm** (ships with Node).
- **git**.
- Optional: [Pinokio](https://pinokio.computer) 8.2+ for a one-click,
  non-terminal install (Windows/macOS/Linux).

## Quick start

```bash
cd gods-eye-view
./setup.sh
cd gods-eye-view-app
npm run dev
```

Then open `http://localhost:4173`.

`setup.sh` will:
1. Check your Node version, and install Node 24 via `nvm` if needed.
2. Clone (or update) the upstream repo into `./gods-eye-view-app`.
3. Run `npm ci` and `npm run doctor` to confirm the environment is ready.

## Running keyless (default)

No API keys are required to start. Keyless mode gives you:

- Esri satellite imagery + OSM fallback basemap
- Live flight tracking (11,000+ aircraft)
- Military ADS-B traffic
- Satellite catalog (838 objects)
- Earthquakes (rolling 24h global feed)
- ~800 public CCTV camera feeds
- Radio stations
- Active fire data
- Space mission data

Just run `npm run dev` and open `http://localhost:4173` — nothing else to configure.

## Enabling Photorealistic 3D and Voice (POWER UP panel)

With the app running, click the **POWER UP** chip in the bottom-right
corner (or visit `http://localhost:4173/?setup=1`) to open Provider
Settings. Paste keys in there and click **SAVE KEYS**.

| Feature | Provider | Env var | Cost | Get a key |
|---|---|---|---|---|
| Photorealistic 3D + terrain | Cesium ion | `CESIUM_ION_TOKEN` | Free (personal/non-commercial) | cesium.com/ion → Access Tokens |
| Direct 3D tiles / place search (optional) | Google Maps | `GOOGLE_MAPS_API_KEY` | Metered | Google Cloud Console |
| Voice control + AI HUD | OpenAI | `OPENAI_API_KEY` | Metered (app enforces a $5 hard cap) | platform.openai.com |
| Live ship tracking (optional) | AISStream | `AISSTREAM_API_KEY` | Free | aisstream.io |
| Active fire detections (optional) | NASA FIRMS | `FIRMS_MAP_KEY` | Free | firms.modaps.eosdis.nasa.gov |
| Live traffic speeds (optional) | TomTom | `TOMTOM_API_KEY` | Free tier | developer.tomtom.com |

Minimum for this task: a **Cesium ion** token (Photorealistic 3D) and an
**OpenAI** key (Voice).

### Where keys are stored

**Keep keys local — never commit them or paste them into a chat.**

- Terminal setup: keys are written to a `.env` file at the app's repo root
  (`gods-eye-view-app/.env`), owner-only permissions, already excluded
  from git by the upstream project's `.gitignore`.
- macOS: `./scripts/dev-fresh.sh` (inside `gods-eye-view-app`) reads keys
  from Keychain instead. Seed them with:
  ```bash
  security add-generic-password -U -s "google-maps-api" -a "api-key" -w
  security add-generic-password -U -s "openai-api" -a "api-key" -w
  security add-generic-password -U -s "aisstream-api" -a "api-key" -w
  ```
- Pinokio installs: keys go to `pinokio/ENVIRONMENT`.

You can also pass keys as env vars for a one-off headless run without
touching `.env`:

```bash
OPENAI_API_KEY="…" AISSTREAM_API_KEY="…" npm run dev -- --host localhost --port 4173
```

### Voice features (once an OpenAI key is set)

- Scene-aware entity Q&A ("what's flying over Tokyo right now?")
- Visual grounding at street level
- Cinematic camera control by voice
- Annotation commands
- Live layer interrogation

## Useful commands

| Command | Purpose |
|---|---|
| `npm run doctor` | Validate Node/npm and check which providers are configured |
| `npm run dev` | Start the dev server (`localhost:4173`) |
| `./scripts/dev-fresh.sh` | macOS only: clear Vite cache and load Keychain keys |
| `?setup=1` URL param | Reopen the POWER UP / Provider Settings panel |

## Using the app

- Pan/zoom/rotate the 3D globe like Google Earth (drag, scroll, right-drag to tilt).
- Toggle layers (aircraft, ships, satellites, earthquakes, CCTV, fires, radio, traffic, missions) from the side panel.
- Switch sensor modes: normal, night vision, thermal imaging.
- Click any entity to inspect its live data.
- With Voice enabled, use the mic control to ask questions or command the camera hands-free.

## Notes

- License: MIT (upstream repo). Live/bundled datasets carry their own
  terms — see the upstream `DATA_SOURCES.md`.
- Sharing on a LAN (`npm run dev -- --host 0.0.0.0`) exposes your
  configured API keys to anyone who can reach that server — only do this
  on a trusted network, with provider quotas/billing alerts set.
