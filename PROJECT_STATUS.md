# Daily Capital — Project Status

Last updated: 2026-10-15

## Purpose and maintenance

Daily Capital is an existing, live capital-city guessing game by Loughlane Digital. Continue development of this application; do not rebuild it.

Keep this document current when development changes functionality, decisions, outstanding tasks, or next steps. Record verification actually performed and distinguish confirmed findings from suspected issues. Preserve unrelated work. This document is a handover record, not authorization to execute its task list or deploy changes.

## Repository and working directory

- Repository: https://github.com/liacon/daily-capital.git
- Application directory: `C:\Users\lcaug\Documents\Codex\2026-09-25\referenced-chatgpt-conversation-this-is-an\work\LoughlaneDigital`
- Current branch: `main`
- Latest application commit: `60670fd77a9deb2852e464c342a198d059adde84` — Adjust proximity scoring for local capital spacing (2026-10-15). The user committed and pushed this change; local `main`, recorded `origin/main`, and the remote branch were verified at this commit.
- Current uncommitted work: UTC rollover fix, saved-state/clock regression tests, development-only browser test fixture, README updates, and this status document. No maintenance commit, push, or deployment has been made.
- `PROJECT_STATUS.md` is still untracked and should be included in the next commit. The scoring commit did not include it.
- The nested, ignored `Daily Capital/` directory is a separate repository with only a README and Git attributes. The application lives in the parent directory listed above.

## Current implementation

- One deterministic mystery capital per UTC date, using shuffled cycles of 199 capitals. Puzzle numbering starts on 2024-01-01.
- Capital-name/alias autocomplete ranked by match quality. Country names do not drive suggestions. Non-capital input is rejected and duplicate guesses are handled.
- Great-circle proximity scoring from 0 to 100, adjusted for the spacing of capitals around each target. Existing Oceania scores are preserved. Live in commit `60670fd`.
- Automatic UTC midnight rollover and resume checks reset the current board while preserving previous dates' history. Guess, reveal, and share actions check the date before proceeding. Implemented and verified locally; awaiting release.
- Interactive flat and globe maps, zoom/drag controls, and guess markers whose colour and size reflect proximity.
- Solve and give-up/reveal flows; reveals do not count as wins or streak days.
- Browser-local saved progress, completed states, streaks, recent history, and player statistics.
- Non-spoiler share text with puzzle number, guesses, proximity pattern, streak context, and the public website URL.
- Post-game city coordinates, weather/local time from Open-Meteo, and exploration links.
- Responsive desktop/mobile layouts, first-time hint, Loughlane Digital branding, About/How to Play/Privacy content.
- SEO/social metadata, structured data, robots.txt, sitemap, and optional Google Analytics event tracking.

## Structure and dependencies

- `src/main.jsx`: application components, daily target selection, persistence, map rendering, sharing, analytics, and weather integration.
- `src/scoring.js`: distance calculations and cached target-specific scoring curves, shared by new guesses and restored saved games.
- `test/scoring.test.mjs`: regional examples, all-pairs scoring invariants, and preservation of existing Oceania scores, run with `npm test` (or `node --test`).
- `src/daily-clock.js`: UTC date and midnight/resume watcher; `src/game-state.js`: saved-game restoration and streak calculations.
- `test/daily-clock.test.mjs` and `test/game-state.test.mjs`: date boundaries, resume/cleanup behavior, saved-state isolation/restoration, and streak regressions. The full suite contains 13 tests.
- `test/rollover.html`: development-only real-game fixture with adjustable date and isolated in-memory storage; not included in the production build.
- `src/styles.css`: application styling and responsive layouts.
- `src/data/capitals.json` and `src/data/world.json`: generated runtime geography data.
- `scripts/generate-data.mjs`: regenerates geography data from local Natural Earth source files; writes files and should only run intentionally.
- `scripts/validate-data.mjs`: read-only dataset checks.
- `public/`: logo, robots.txt, and sitemap.
- `index.html`: entry document and SEO metadata.
- No application backend, accounts, or database are present; player state is held in browser local storage.

Versions recorded in `package-lock.json` at inspection:

| Dependency | Version |
| --- | --- |
| React / React DOM | 19.3.0 |
| Vite | 7.3.6 |
| @vitejs/plugin-react | 5.2.0 |
| d3-geo | 3.1.1 |

Dependencies and generated build output already exist locally. Node observed during inspection: 24.19.0.

## Deployment

- Public URL: https://daily-capital.com
- Cloudflare Workers static-assets project `daily-capital`, connected to `liacon/daily-capital`. Dashboard verified read-only on 2026-10-15: production branch `main`, builds enabled, include paths `*`, build cache enabled.
- Build command: `npm run build`; it validates data and then builds with Vite.
- Root directory: `/`. Deploy command: `npx wrangler deploy`.
- Build output directory: `dist/`.
- `VITE_GA_MEASUREMENT_ID` is configured in the production build settings and present in the live bundle; `.env.example` contains a placeholder. Analytics event delivery was not independently checked in GA4.
- No checked-in Cloudflare deployment configuration was found; deployment settings are managed in the dashboard. No dashboard settings were changed.
- Scoring commit `60670fd` has a successful Workers Builds check and Cloudflare build `4d3b0273-d2cd-4e85-8bd0-1c6cd468353d`. The live site returned HTTP 200 and its JavaScript includes the spacing-based scoring explanation. Cloudflare build logs report Node 24.18.0 and npm 10.9.2.
- Local `dist/` was rebuilt successfully after the maintenance changes on 2026-10-15. This does not deploy the rollover fix.

## Decisions to preserve

- Continue the existing application and repository without discarding or overwriting unrelated work.
- Daily puzzles use UTC, rather than each player's local date.
- Remount the daily game when the UTC date changes; preserve history under its original date. Recheck on focus, visibility, and page restoration, and reject stale-day actions before they affect a game.
- Use proximity, marker size/colour, and map position; no directional arrows or connecting lines.
- Keep the target hidden in the normal interface until solved or explicitly revealed.
- Search capital names and accepted aliases, not country names. Invalid guesses display “Only capital cities can be guessed.”
- Display Astana while retaining Nur-Sultan/Nursultan aliases and the existing stable record ID.
- Preserve the adjusted Oceania scoring curve. User approved the bounded spacing-based adjustment on 2026-10-15: use five times the target's third-nearest alternative-capital distance, bounded by the existing decay and 6500. Keep dense-area scores and the exact-match requirement for 100.
- Keep shares free of the answer and link to the public game, not the repository.
- Preserve documented Natural Earth capital-seat edge cases, including multiple capitals for Bolivia, Ivory Coast, and South Africa.
- Player progress remains browser-local; clearing storage or changing browsers does not preserve it.

## Recent development progress

| Date | Commit | Delivered |
| --- | --- | --- |
| 2026-10-11 | `031d0cf` | Ranked capital suggestions, capital-only search, and invalid-input message |
| 2026-10-11 | `2112216` | Astana naming/aliases and Oceania scoring |
| 2026-10-09 | `9db68e7` | Improved non-spoiler sharing and public site link |
| 2026-10-08 | `29fa515` | About/How to Play/Privacy content and smaller logo |
| 2026-10-08 | `c643397` | SEO metadata, robots.txt, and sitemap |
| 2026-10-07 | `e824a42` | Proximity tuning and capital-name adjustments |
| 2026-10-07 | `6797e4e` | Google Analytics event tracking |
| 2026-10-07 | `52f1b64` | Persistence of completed daily puzzle state |
| 2026-10-15 | Uncommitted documentation | Recovered project context, inspected repository, and established this status record |
| 2026-10-15 | `60670fd` | Bounded spacing-based scoring, 3 regression tests, and explanatory documentation; user pushed and production verified |
| 2026-10-15 | Uncommitted maintenance | UTC rollover fix, 10 additional regression tests, browser fixture, and documentation; all 13 tests, browser checks, data validation, and production build passed |
| 2026-10-15 | Local maintenance | Repaired damaged remote default-branch reference; Git integrity checks passed. User recovered disk space and restarted; 6.06 GB free verified. Cloudflare deployment settings verified. |

The previous task, “Build capital-city guessing game MVP”, became unusable following conversation compaction errors. Its recent readable history was recovered for context. The latest recovered feature requests are implemented; no formal product backlog was found. The items below are inspection findings, not previously agreed feature commitments.

## Outstanding tasks

| Priority | Item | Evidence / status |
| --- | --- | --- |
| Release | Commit/push the verified rollover maintenance when authorized | Local implementation complete; 13 tests, browser gameplay checks, dataset validation, production build, and Git checks passed. Include this currently untracked status document. Verify the live release after push. |
| Medium | Extend regression checks when related features change | Scoring, date rollover, saved-state restoration, and streaks are automated. Search, reveal, and win flows have manual browser coverage; broader automated browser coverage remains optional future work. |
| Low | Reassess bundle size if loading performance warrants it | Successful build retains a non-blocking warning for the approximately 556 kB JavaScript bundle. No splitting introduced. |
| Product | Clarify multi-capital countries in player-facing explanations | All three South African capitals are already included. Recommendation: retain them as separate possible targets and explain their roles after solving. This explanation is proposed, not implemented. |

## South Africa and scoring review — 2026-10-15

Historical review before approval; references to current scores below mean the pre-change scores. The approved implementation and release are recorded above and below.

- Verified that the runtime dataset and original Natural Earth source both contain Cape Town, Pretoria, and Bloemfontein.
- South African Government lists Pretoria as administrative, Cape Town as legislative, and Bloemfontein as judicial: https://www.gov.za/about-sa/south-africa-glance-0
- Recommendation: keep all three as valid guesses and distinct daily targets. Only the selected city should solve that day's puzzle. No dataset changes are needed to include these three cities.
- Evaluated the existing distance/scoring functions directly against the local dataset, without changing application files:

| Guess for Cape Town | Distance (km, rounded) | Current score | Current label |
| --- | --- | --- | --- |
| Bloemfontein | 911 | 74 | Hot |
| Maseru | 997 | 71 | Hot |
| Gaborone | 1,260 | 65 | Hot |
| Windhoek | 1,269 | 65 | Hot |
| Pretoria | 1,313 | 64 | Warm |

- These are the five nearest alternative capitals in the current dataset. Pretoria and Windhoek are nearby options, but Bloemfontein and Maseru are closer.
- Current scores reflect absolute distance, with a separate Oceania decay constant, rather than rank among the nearest playable capitals. The arithmetic matches the implementation; the open question is gameplay calibration.
- Recommendation for investigation: compare a distance curve adjusted for local capital spacing across southern Africa, Oceania, and dense regions such as Europe. Preserve distance ordering for a given target and reserve 100 for an exact match. Avoid deciding a global curve from Cape Town alone.
- No new scoring formula or score targets have been agreed. Only this status document was updated; no application changes, build, commit, or deployment occurred.

## Cross-region scoring comparison — 2026-10-15

This section records the comparison before approval. The conservative candidate described below was subsequently approved, implemented, and released in `60670fd`; see the implementation and maintenance records for current status.

User requested comparisons, particularly Central America and the Caribbean. All distances and scores below were calculated from the current local runtime dataset and scoring functions; they are not observations of the deployed build or user playtesting.

### Exploratory candidate

For each target, sort all other playable capitals by great-circle distance. Use the third-nearest distance as a local spacing measure (equivalently, the median distance to its five nearest alternatives). This avoids basing the adjustment solely on one exceptionally close pair.

Keep the existing scoring formula, but calculate its decay constant as:

```text
existingDecay = 6500 for existing Oceania targets, otherwise 3500
candidateDecay = max(existingDecay, min(6500, 5 * thirdNearestDistanceKm))
score = round(100 * exp(-distanceKm / candidateDecay) * max(0, 1 - distanceKm / 20015))
wrong guesses are capped at 99; an exact match scores 100
```

The multiplier of 5 and bounds are illustrative tuning choices, not established optimal values. Non-Oceania targets with third-nearest distance at or below 700 km keep current scores; those at or above 1,300 km receive the existing Oceania-strength curve. Intermediate targets get a gradual adjustment.

An initial fully geography-based variant could reduce scores for Apia, Funafuti, and Suva. The conservative candidate above preserves all existing Oceania scores and never reduces any current score.

### Representative results

Distances are rounded for display; calculations used full precision. Target means the hidden answer; guess means the city selected by the player.

| Target | Guess | Distance km | Current | Candidate |
| --- | --- | --- | --- | --- |
| Guatemala City | San Salvador | 175 | 94 | 94 |
| Belmopan | Guatemala City | 348 | 89 | 89 |
| Managua | San José | 344 | 89 | 89 |
| San José | Panama City | 510 | 84 | 84 |
| Panama City | San José | 510 | 84 | 86 |
| Panama City | Managua | 817 | 76 | 79 |
| Havana | Nassau | 553 | 83 | 86 |
| Havana | Kingston | 817 | 76 | 81 |
| Havana | Belmopan | 935 | 73 | 78 |
| Nassau | Kingston | 792 | 77 | 80 |
| Kingston | Port-au-Prince | 472 | 85 | 87 |
| Port-au-Prince | Santo Domingo | 254 | 92 | 93 |
| Santo Domingo | Kingston | 724 | 78 | 80 |
| Bridgetown | Kingstown | 174 | 94 | 94 |
| Castries | Kingstown | 98 | 97 | 97 |
| Port-of-Spain | Saint George's | 158 | 95 | 95 |
| Cape Town | Bloemfontein | 911 | 74 | 83 |
| Cape Town | Windhoek | 1,269 | 65 | 77 |
| Cape Town | Pretoria | 1,313 | 64 | 76 |
| Pretoria | Gaborone | 261 | 92 | 92 |
| Accra | Lomé | 172 | 94 | 94 |
| Nairobi | Kampala | 503 | 84 | 85 |
| Paris | Brussels | 262 | 92 | 92 |
| Vienna | Bratislava | 56 | 98 | 98 |
| Honiara | Port Vila | 1,291 | 77 | 77 |
| Suva | Nuku'alofa | 743 | 86 | 86 |
| Wellington | Canberra | 2,326 | 62 | 62 |
| Tokyo | Seoul | 1,156 | 68 | 79 |
| Santiago | Buenos Aires | 1,133 | 68 | 79 |

### Interpretation and tradeoffs

- Most Central American targets already have close alternatives and high scores. Of the seven Central American targets inspected, only Panama City changes under this candidate.
- The Caribbean is not uniformly sparse. Eastern Caribbean targets such as Bridgetown and Castries have very close neighbours; their current scores already reflect that. Havana and Nassau benefit from moderate adjustments.
- Mainland and island borders do not constrain neighbour selection: Belmopan is among Havana's nearest capitals and Bogota is among Panama City's nearest. Candidate calculations use the game's actual playable options.
- A blanket 6500 decay for the Caribbean would inflate already-high scores (e.g. Bridgetown/Kingstown from 94 to 97) and Havana/Kingston from 76 to 85, compared with 81 under the local-spacing candidate.
- Cape Town benefits substantially while Pretoria and Accra stay unchanged, supporting a target-specific adjustment over an Africa-wide exception.
- The bound deliberately limits generosity. It does not ensure that every target has a very hot alternative: Wellington's nearest option still scores 62. A stronger fairness requirement would need a different candidate.
- Adjusting a target's curve affects distant guesses too: London against Cape Town rises from 3 to 11, remaining Cold; Havana against Panama City rises from 58 to 62. This candidate is not limited to the nearest five guesses.
- Scores become target-dependent within a region: San José guessed for Panama City scores 86, while Panama City guessed for San José scores 84. Explain the score as closeness relative to the target's surroundings if this approach is adopted.
- This is a broad scoring change, affecting 89 of 199 target puzzles and 15,703 of 39,402 ordered non-exact pairs. It should be reviewed and playtested before release; no scoring change has been approved.

### Checks performed

- Evaluated the conservative candidate over all 39,402 ordered non-exact pairs and all 199 exact matches.
- No out-of-range scores, wrong guesses scoring 100, distance-order reversals within a target, or failures of exact matches to score 100.
- No current score was reduced; all existing Oceania scores were preserved.
- Integer rounding still permits ties between different distances, as in the existing game.
- No application source, dataset, dependency, build output, Git reference, or deployment was changed. Only this status document was updated.

## Scoring implementation — 2026-10-15

Historical implementation-stage record. The user subsequently committed/pushed this change as `60670fd`; production and subsequent maintenance verification are recorded separately.

- User approved making the compared scoring changes. Implemented the conservative candidate exactly, including preservation of every existing Oceania score.
- Moved the existing distance/scoring functions to `src/scoring.js` and added the spacing adjustment. Cache each target's decay after its first scored guess, avoiding repeated neighbour sorting during play and saved-game restoration.
- Both new guesses and restored guesses use the shared scorer. Saved capital IDs, guess counts, completion state, streaks, dataset order, and daily target selection were not changed. Scores and share colours for restored guesses can update to the new curve.
- Added a brief explanation to How to Play and documented the scoring rule and verification commands in README.
- Added `npm test` using Node's built-in test runner; no dependencies were installed or changed.
- Tests passed: regional examples (including Cape Town/Pretoria 76, Cape Town/Windhoek 77, and Havana/Kingston 81); all 39,402 non-exact pairs plus 199 exact matches; input-data immutability; repeated scoring; preservation of scores for all 13 existing Oceania targets. Three tests passed, zero failed.
- Dataset validation passed: 199 capitals and 177 map features.
- Production build passed. The build reports a non-blocking chunk-size warning for the approximately 555 kB JavaScript bundle; bundle splitting was not part of this change.
- `npm.cmd` is not available on this task's PATH. Checks used the already available Node runtime directly: `node --test`, `node scripts/validate-data.mjs`, and `node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build`. These execute the test/build scripts without an installation.
- No browser playtest was performed. No commit, push, deployment, disk cleanup, or repair of the damaged Git reference was performed.
- The multi-capital explanatory feature remains proposed; the three South African capitals already present in the dataset remain unchanged.

## Verification and limits

2026-10-15 inspection:

- Read README, source, dependencies, Git history, local deployment clues, and relevant recovered conversation turns.
- Ran `node scripts/validate-data.mjs`: passed for 199 capitals and 177 map features.
- Checked working-tree status and confirmed local branch/reference commit equality.
- Confirmed the separate nested repository is a minimal scaffold and clean.
- Did not install dependencies, regenerate data, rebuild, launch the application, fetch/push, commit, or change deployment settings.
- Earlier conversation reports successful builds for recent feature changes; those reports are historical evidence, not a fresh build verification.

## Next steps

1. Commit/push the verified maintenance changes when authorized, including the new modules, tests, browser fixture, README, and this status record; then verify Cloudflare's successful deployment and the live version.
2. Consider the proposed post-game explanation of multiple capitals as a separate product change. The dataset already includes all three South African capitals.
3. Reassess storage if low-space symptoms return; 6.06 GB was available after the user's cleanup/restart. No assistant cleanup was performed.
4. Keep this document current with decisions, checks, outstanding tasks, and release commit IDs. Commit or deploy only when authorized.

## Maintenance completion — 2026-10-15

- Repaired `.git/refs/remotes/origin/HEAD` from 30 null bytes to a symbolic reference to `refs/remotes/origin/main`. Preserved the original at `C:\Users\lcaug\Documents\Codex\2026-10-15\i-m-continuing-development-of-daily\work\daily-capital-origin-HEAD.before-repair.bin`. No branch reset or source changes were involved in this repair. `git symbolic-ref`, `git log --all`, and `git fsck --full --no-dangling` passed.
- Implemented a UTC date watcher and a date-keyed daily-game component so guesses, selected capital, solved/revealed state, and other transient board state cannot carry into a new day's puzzle. Previous history stays saved under its original date. Action-time guards handle a stale tab before its timer/resume event runs.
- Extracted saved-game restoration and streak helpers without changing the storage format. Regression tests cover unfinished/solved/revealed isolation, restoration and rescoring in order, preview/reveal state, mismatched targets, legacy wins, year boundaries, exact midnight scheduling, resume after several days, leap/month/year transitions, and listener/timer cleanup.
- Browser checks using the actual game passed for unfinished, revealed, and solved games across date changes; prior history remained intact and new puzzles were playable with zero guesses. Silent date advance followed by Guess also switched days without submitting the stale guess. Ranked Astana search, invalid Barcelona input, winning-state input disabling, and Pretoria's updated score of 76 were checked. No browser console errors were observed in these checks.
- After the user's restart, re-ran all 13 automated tests, dataset validation (199 capitals/177 map features), the production build, Git integrity, and whitespace checks successfully. Build has only the existing non-blocking bundle-size warning.
- Local tools recovered after restart; free C: space measured 6.06 GB. The exact cause of the earlier tool failures was not established. No files were deleted by the assistant.
- Verified Cloudflare's production settings read-only, the successful scoring release, and configured analytics build variable. The maintenance source and documentation remain uncommitted and are not live. No dependencies installed or dashboard settings changed.
