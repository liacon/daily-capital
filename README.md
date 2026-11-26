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
- Open games switch to the new puzzle at UTC midnight, or when the tab resumes after sleeping. Previous guesses and completed results remain saved under their original date.
- Daily targets are drawn from a deterministic shuffled deck, so all 199 capitals appear once before any repeats.
- The daily puzzle number starts at `#1` on 2024-01-01.
- Players search for a capital, make guesses, and see each guess as a dot on the globe by default. Suggestions match capital names and accepted aliases, not country names.
- The map can be switched between flat and globe views.
- Flat mode can be dragged and zoomed with the mouse wheel or zoom/reset buttons.
- Globe mode rotates to center the latest guess, then can be manually rotated by dragging and zoomed with the same controls.
- Guess dots become larger and warmer in color as their proximity score improves.
- The solved target is revealed with a green marker and halo.
- Scores are 0-100, using great-circle distance and the spacing of playable capitals around the hidden target. Widely spaced capitals receive a gentler curve; closer guesses always score at least as highly for the same target. Only exact matches score 100.
- Existing Oceania scoring is preserved. Dense areas such as central Europe and the eastern Caribbean retain their standard curve; isolated targets such as Cape Town receive warmer scores.
- There are no arrows, bearings, or connecting lines; only proximity, map position, and the ordered guess list are shown.
- The hidden target is revealed only after it is guessed.
- Players can give up and reveal the target; reveals do not count as wins or streak days.
- Wins, guess counts, streak, and recent history are stored locally in the browser.
- The share button copies a non-spoiler result with the puzzle number, guess count, colored proximity pattern, streak context, and the public site URL.
- After solving, a fact panel shows city/location details, current weather from Open-Meteo, exploration links, and local player stats.

## Launch Notes

### Scoring and verification

Scoring lives in `src/scoring.js`. For each target, the distance to its third-nearest alternative capital (the median of its five nearest alternatives) determines a cached decay value:

```text
existingDecay = 6500 for existing Oceania targets, otherwise 3500
decay = max(existingDecay, min(6500, 5 * thirdNearestDistanceKm))
score = round(100 * exp(-distanceKm / decay) * max(0, 1 - distanceKm / 20015))
```

Incorrect guesses are capped at 99. The cap on decay limits generosity for very isolated targets; it does not guarantee a very high score for every target's closest neighbour. Scores depend on the target's surroundings, so reversing a guess/target pair can produce a different score.

Saved guesses are stored by distinct city ID and rescored with their game’s frozen catalogue. Catalogue updates preserve old targets, coordinates, scores, completed games and streaks. Future scoring-formula changes must also retain the historical scoring behavior.

Run `npm test` for scoring, UTC rollover, saved-state restoration, and streak regressions, including all 41,006 non-exact pairs in v3 and both complete historical score matrices. Run `npm run build` for dataset validation and the production build.

For a manual rollover check, start the development server and open `/test/rollover.html`. This fixture loads the actual game with an adjustable date and isolated in-memory storage. Check unfinished, solved, and revealed games across a day change, including the silent advance followed by a guess. It does not change your normal saved games and is not included in the production build.

### Completion analytics verification

Completion events are emitted by the winning guess or reveal action, not by restoring saved results. Preview games do not emit completion events. Historical duplicate events already recorded in Analytics are not corrected by this change.

For a browser regression check, start the development server and open `/test/analytics.html`. The fixture captures events without sending them to Google, uses an adjustable UTC date, and keeps its own game/events in session storage across reloads. Submit Pretoria then Cape Town: expect one `puzzle_solved` with `guesses: 2`. Reload: the result should restore with no additional solve event. Advance one day, reveal, then reload: expect one `puzzle_revealed` with `guesses: 0` and no duplicate on reload. Open the fixture with `?target=cape-town-south-africa` and solve: completion counts should stay unchanged. The reset button clears only this fixture's data. This fixture is not included in the production build.

### Deployment

The live site at https://daily-capital.com uses Cloudflare Workers static assets. The connected Git repository is `liacon/daily-capital`, with automatic production builds enabled for `main`. Dashboard settings verified on 2026-10-15: root directory `/`, build command `npm run build`, deploy command `npx wrangler deploy`, and `VITE_GA_MEASUREMENT_ID` configured as a build variable. No Wrangler configuration is checked into this repository; these settings are managed in Cloudflare.

### Site and analytics

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

## Data sources and catalogue versions

Natural Earth provides the base capital coordinates and map shapes. Its flags are an input, not an authoritative eligibility policy. Reviewed exceptions live in src/catalogue-update.js; each of the seven corrections records a source, coordinate source and explanation. Six new points use named records in the bundled Natural Earth source; Ngerulmud uses the [UNEP project location table, page 73](https://open.unep.org/docs/gef/PIR/10267_PIR_UNEP_2024_GEF_CW.10267.ISLANDS_Pacific.pdf) (7.5006, 134.6242), consistent with Palau's government identifying Ngerulmud in Melekeok.

Run npm run generate:data to regenerate src/data/capitals.json and world.json from data-sources/. The generator reapplies the curated corrections; it never rewrites frozen historical snapshots. npm run validate:data checks exact published catalogue hashes/order, curated records and coordinates, retained seats, counts, finite coordinate bounds and unique IDs/names. A structurally valid list with a missing reviewed capital is rejected.

### Release behavior

| Version | Default puzzle dates (UTC) | Contents and schedule |
| --- | --- | --- |
| v1 | Before 26 November 2026 | Original 199 cities, including Malabo. Original 2024 epoch and seed. |
| v2 | 26 November 2026 | 199 cities with Ciudad de la Paz in the old Malabo slot; original epoch/seed. Frozen snapshot from commit 59108cb in src/data/catalogs/v2.json. v1 is reconstructed only from this frozen snapshot and the fixed Malabo record, never from mutable current data. |
| v3 | From 27 November 2026 at 00:00 UTC | 203 cities; its own cycle starts on this date with a version-specific seed. Puzzle numbering still starts on 1 January 2024. |

The v3 release replaces Dar es Salaam with Dodoma, Bujumbura with Gitega, and the imprecise Melekeok entry with Ngerulmud. It adds Porto-Novo, Sri Jayawardenepura Kotte, Juba and Lobamba. Colombo, Cotonou, Mbabane, all three South African capitals, and the existing Bolivia/Ivory Coast seats remain. Economic-capital status alone does not put Dar es Salaam or Bujumbura in the current national-answer deck. Wider territorial and government-seat eligibility decisions in CAPITAL_DATA_AUDIT.md remain separate work.

All versions expose separate guesses, targets and scoring references. They currently use the same cities within each version; a future guess-only addition can be separated from answer scheduling and scoring. Published versions are immutable. For the next data release, preserve v3 as a snapshot, add a new dated version/epoch/seed, point its fields at the new data, update generation/validation intentionally and retain all old regression digests. Do not reorder or rewrite a published version in place. Do not change a published cutover date after release.

Saved plays now include catalogVersion. Unversioned saves are matched against the legacy daily schedule; an older-build game keeps its target, allowed guesses and scoring reference when the updated page loads. A brief message explains that the corrected list applies to the next puzzle. This deliberately permits players who already started in an old build to finish a different old-deck answer on the transition day. Brand-new games use the date's current version. Stale tabs receive changes only after loading the new build. Historical city IDs remain distinct locations and are never aliases for relocated capitals.

Kotte and common Jayawardenepura/Jayewardenepura spellings are accepted, as are Porto Novo and Nay Pyi Taw. Melekeok is not an alias for the new Ngerulmud point: its original ID/location remains available for old saves. Oyala remains an alias for Ciudad de la Paz; Malabo remains a separate historical city.

### Player explanations

A dismissible, spoiler-free capital-list notice runs from 27 November through 10 December inclusive. It supersedes the older Equatorial Guinea top banner after the v3 cutover, avoiding stacked notices. Dismissal uses its own key and does not alter guesses or history. After finishing, players can expand a sourced list of the seven changes. Results for affected cities and their retained counterpart seats also explain the roles. The list describes corrections to our game data, not new real-world relocations.

The [Equatorial Guinea decree of 2 January 2026](https://www.guineaecuatorialpress.com/index.php/noticias/decreto_ley_por_el_que_se_declara_la_ciudad_de_la_paz_djibloho_capital_de_la_republica_de_guinea_ecuatorial) and [PCGN coordinates](https://assets.publishing.service.gov.uk/media/695fb2f757e7407fe07765d8/Equatorial_Guinea_Toponymic_Factfile.pdf) remain in src/capital-corrections.js. The game cutover was 26 November, not the date of the official change. Its historical Malabo result and recent-history explanation remain available.

### Verification and publishing

npm test covers the original 3,000-date legacy schedule, all 1,061 released target IDs through 26 November, both 199-by-199 historical score matrices, all current city pairs, three complete v3 cycles, distinct old/new city identities, old-build saves, streaks, notices, rollover and deterministic regeneration. npm run build validates the data and builds the production bundle.

The v3 change is local until committed, pushed and deployed. Deploying on 26 November allows an updated browser to switch at midnight; deploying later activates v3 for new games on load while preserving already-started legacy games. The date gate does not deploy anything. No commit, push or deployment is performed by the implementation task.
