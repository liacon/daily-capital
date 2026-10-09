# Daily Capital

A standalone daily capital-city guessing game by Loughlane Digital.

## Run Locally

```bash
npm install
npm run build
npm run dev
```

The production build is written to `dist/`.

## Game Mechanics

- Each UTC date maps deterministically to one hidden capital city.
- Daily targets are drawn from a deterministic shuffled deck, so all 199 capitals appear once before any repeats.
- The daily puzzle number starts at `#1` on 2024-01-01.
- Players search for a capital, make guesses, and see each guess as a dot on a flat world map.
- The map can be switched between flat and globe views.
- Flat mode can be dragged and zoomed with the mouse wheel or zoom/reset buttons.
- Globe mode rotates to center the latest guess, then can be manually rotated by dragging and zoomed with the same controls.
- Guess dots become larger and warmer in color as their proximity score improves.
- The solved target is revealed with a green marker and halo.
- Scores are 0-100, using great-circle distance against the hidden target and a tuned curve that gives better contrast between nearby and far-away guesses. Exact matches score 100.
- There are no arrows, bearings, or connecting lines; only proximity, map position, and the ordered guess list are shown.
- The hidden target is revealed only after it is guessed.
- Players can give up and reveal the target; reveals do not count as wins or streak days.
- Wins, guess counts, streak, and recent history are stored locally in the browser.
- The share button copies a non-spoiler result with the puzzle number, guess count, colored proximity pattern, streak context, and the public site URL.
- After solving, a fact panel shows city/location details, current weather from Open-Meteo, exploration links, and local player stats.

## Launch Notes

- SEO/social metadata is included in `index.html`.
- The first-time hint is stored locally after dismissal.
- Google Analytics 4 can be enabled by setting `VITE_GA_MEASUREMENT_ID` to the GA4 Measurement ID, for example `G-XXXXXXXXXX`, before building.
- Lightweight analytics hooks call `window.plausible(...)` when Plausible is present, otherwise `window.gtag(...)` for GA4, otherwise `window.dataLayer.push(...)` when a data layer exists. In development they log to the console.
- Useful events include `game_loaded`, `guess_submitted`, `puzzle_solved`, `puzzle_revealed`, `share_result`, `map_mode_changed`, and `explore_link_clicked`.

### Google Analytics Setup

For local testing, copy `.env.example` to `.env.local` and replace the placeholder with the Measurement ID from Google Analytics:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

For Cloudflare, add the same value as a production build environment variable, then redeploy. GA4 will receive the built-in gameplay events after the new build is live.

## Data Source

Capital coordinates and country map shapes are generated from Natural Earth public-domain data:

- `ne_10m_populated_places_simple.geojson`
- `ne_110m_admin_0_countries.geojson`

Generated runtime data lives in `src/data/`. To rebuild it, place the Natural Earth GeoJSON files in `data-sources/` and run:

```bash
npm run generate:data
```

## Dataset Edge Cases

The game includes records where Natural Earth marks a place as `Admin-0 capital` and `adm0cap` equals `1`.

Excluded records:

- Admin-0 region capitals
- Admin-0 alternate capitals
- Admin-1 capitals
- Non-capital populated places

Multi-capital cases retained from Natural Earth include Bolivia, Ivory Coast, and South Africa. These are intentional so official capital-seat edge cases remain playable rather than silently collapsed into a single answer.
