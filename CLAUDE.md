# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build

```bash
node build.js
```

Reads all `content/days/*.json` files and aggregates them into `content/index.json`. This is the only build step — Netlify runs it automatically on deploy (`netlify.toml`).

To preview locally, serve the root directory with any static file server (e.g., `npx serve .` or `python3 -m http.server`). There is no dev server, bundler, or test suite.

## Architecture

This is a static photography archive site with no framework or build toolchain beyond `build.js`.

**Data flow:**
1. Content is authored via Decap CMS at `/admin` (backed by GitHub). Each shooting day becomes a JSON file at `content/days/YYYY-MM-DD.json`.
2. `build.js` aggregates those JSON files into `content/index.json` — an array of day objects sorted newest-first.
3. `site.js` fetches `/content/index.json` at runtime, processes images (auto-tagging sunrise/sunset, optionally fetching weather), and renders everything via vanilla DOM manipulation.

**Key files:**
- `index.html` — shell with hero, timeline, and lightbox DOM structure; no dynamic content
- `site.js` — all client-side logic (grid layout, hero cycling, timeline render, lightbox)
- `style.css` — all styles; layout uses CSS custom properties `--thumb-h`, `--thumb-w`, `--thumb-gap` set by `initGrid()`
- `build.js` — Node.js aggregation script (no dependencies)
- `admin/config.yml` — Decap CMS schema defining the Day collection fields
- `content/days/` — one JSON file per shooting day (source of truth for content)
- `content/index.json` — generated; do not edit by hand
- `static/uploads/` — image/video files uploaded via CMS

**Content schema** (each day JSON — `lat`/`lng` will be removed in the sidecar rewrite):
```json
{
  "date": "YYYY-MM-DD",
  "location": "string",
  "lat": 32.7157,
  "lng": -117.1611,
  "images": [
    {
      "src": "/static/uploads/filename.jpg",
      "type": "image" | "video",
      "orientation": "h" | "v",
      "time": "HH:MM",
      "caption": "string",
      "weather": "string (optional, auto-fetched if blank)",
      "tag": "sunrise" | "sunset" (optional, auto-derived from time),
      "hero": "true" | "false" (optional, adds to hero rotation)
    }
  ]
}
```

**Hero rotation:** Images flagged `hero: "true"` cycle in the full-bleed header. Up to 10 images, 5-second interval, 1.2-second CSS crossfade between two pre-loaded layers (A/B swap pattern).

**Timeline layout:** Days are grouped by calendar week. Within each day, images split into left (sunrise) and right (sunset) clusters separated by a `gap-zone`. Grid sizing is purely CSS-variable-driven — `initGrid()` sets `--thumb-h`/`--thumb-w` based on viewport width at load and on debounced resize.

**Weather:** Fetched from OpenWeatherMap historical API (One Call 3.0) using `WEATHER_API_KEY` environment variable set in Netlify. Results are cached in `weatherCache` per page session. Set the key in Netlify environment variables — never in code.

## Workflow & Branches

- `main` branch = live site (Netlify deploys from this)
- `draft` branch = staging; all new work goes here first, merge to `main` when ready to publish
- The iOS Shortcut (BS Publish) commits photos and sidecar JSON directly to the `draft` branch via GitHub API

## Sidecar Approach (In Progress)

`build.js` needs to be rewritten to support a sidecar file pattern. Each image will have its own companion JSON file (e.g., `2026-03-01-143022.json` alongside `2026-03-01-143022.jpg`) instead of one JSON per day. This eliminates read-modify-write conflicts when the iOS Shortcut uploads multiple images simultaneously. `build.js` should aggregate all sidecar files into `content/index.json` at build time.

The existing schema's `lat` and `lng` fields should be removed in the sidecar rewrite (see Privacy below).

## Privacy

GPS coordinates are never stored in any file. Location is resolved to city + state only, on-device in the iOS Shortcut, before anything is committed to GitHub.

## Adding a new day manually

Create `content/days/YYYY-MM-DD.json` following the schema above, then run `node build.js` to regenerate `content/index.json`.
