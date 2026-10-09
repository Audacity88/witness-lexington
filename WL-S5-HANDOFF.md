# WL-S5 polish handoff

- `card: WL-S5`
- `kind: design` for essay rules/instructions, source wording, opening subtitle, GAME_DESIGN and DQ-43 through DQ-46. Slice code also received Astra code review.
- `branch: wl-s5-polish`
- `base / HEAD: 245a943ff287833b172618e12155aef110118b7f` from WL-S4
- `checkout: /Users/dan/witness-lexington-codex-wt/wl-s5-polish`
- `repository: Audacity88/witness-lexington`, private
- `commit: none; wrapper owns commit and private wl-* push`
- `bundle SHA-256: b0e33863e7d6a716521a4cfe5735e9a736f784f1ddc53199cd9230da58bb461a`

## Card results

| Item | Status | Change |
| --- | --- | --- |
| a | Fixed | Focus and scroll both check results into view. Put the blocked-Finish explanation first. Browser driver checks result position and focus. |
| b | Fixed | Omit student-facing typing rates from current and earlier-draft feedback. Raw rates remain in stored current and prior teacher flags. |
| c | Fixed | Revere contradiction says a house blocked his militia view at that time. Regenerate SCORING.md; marks stay unchanged. Existing R75 citation covers the paraphrase. |
| d | Fixed | Intro, opening and blackout subtitle says dawn of April 19 and labels reconstructed staging. CREDITS.md links it to SETTING. |
| e | Fixed | Require recognizable source-detail claims and reject sentences matching more than two card groups. Disambiguate Revere’s deposition from Parker’s. Preserve normal attribution orders, passive facts, either side and uncertainty. The six-sentence salad passes S4 with evidence 6/2 and fails this build. |
| f | Fixed | Rename credits to Witness Lexington. Build regenerates the CSP fixture from the current v2 gzip bundle. Dist tests scan test fixtures and decoded gzip for Barker overstatement and verify CSP payload parity. Rebuild all five dist artifacts. |
| g | Fixed in drivers; browser execution pending | Replace Shift+Tab strings with Shift down, Tab, Shift up. Hold movement keys for at least 300ms and until movement occurs, with guaranteed release. Apply recovery fixtures before new app scripts load, after the old page’s exit save. |

Astra review repairs also preserve completed saves: structurally valid finished checkpoints that fail current essay checks resume at the preserved draft for revision. Hypothesis contradictions retain the S4 recovery path. DQ-46 records this default. DQ-38/39 remain deferred to Dan; text size, light theme and clipped world labels are unchanged. Both specs remain identical.

## Review and local validation

Native Astra code review PASS and Astra content review PASS, `kind: design`, cover the final uncommitted source diff at the branch/base and bundle hash above. Initial findings concerned ordinary Barker/Parker paraphrases, a falsely counted third source, and discarded completed saves. All were repaired and checked again. These reviews do not establish browser acceptance.

- `node test/green-essay-logic.cjs`: 104 checks pass. Includes visible-result actions in the DOM simulation, hidden rates with stored raw values, Revere wording, dawn subtitle, the shuffled salad, normal source paraphrases and completed-save recovery.
- `node test/green-world.cjs`: 136 checks pass using renderer/canvas stubs.
- `node test/dist-v2.cjs`: 13 checks pass across dist and fixtures, including decoded gzip, CSP payload parity, v2 credits, syntax and the inherited Barker wording rule.
- `node tools/build.mjs`: succeeds offline. Gzip fence fits; the oversized plain fence remains omitted. CSP fixture now uses this same v2 payload.
- All 20 JavaScript files in test, src, data and tools pass `node --check`. Both specs and generated scoring match; `git diff --check` passes.
- A Python loopback HTTP smoke was attempted, but the sandbox rejected socket creation with `Operation not permitted`. HTTP serving remains unverified here.
- Browser execution and screenshots remain pending. WORK_INSTRUCTIONS.md explicitly prohibits implementer browser launches and assigns these checks to the reviewer outside this sandbox. The existing puppeteer-core dependency is unavailable locally; no install was attempted. The browser .mjs drivers received syntax checks, not gameplay execution. Legacy `test/run.mjs` and its v1 step files are not v2 acceptance drivers.

Changed files: src/green-essay.js, src/evidence-check.js, src/night-ride.js; data/essay-rules.js and data/evidence.js; GAME_DESIGN.md, DESIGN_QUESTIONS.md, CREDITS.md and generated SCORING.md; tools/build.mjs; the three slice browser drivers, green-essay-logic.cjs, dist-v2.cjs, fixtures/keyword-salad.txt and regenerated csp-gz.html; five generated dist artifacts; this handoff.

## Reviewer browser packet

Run with existing dependencies outside the implementer sandbox. Use an unused loopback port and do not change Dan’s services.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Run the drivers in another process while that server is available:

```sh
node test/night-ride.mjs http://127.0.0.1:8765/index.html /tmp/wl-s5-night
node test/dawn-muster.mjs http://127.0.0.1:8765/index.html /tmp/wl-s5-dawn
node test/green-essay.mjs http://127.0.0.1:8765/index.html /tmp/wl-s5-green
node test/green-essay.mjs http://127.0.0.1:8765/dist/witness-game.html /tmp/wl-s5-gzip
node test/green-essay.mjs http://127.0.0.1:8765/dist/witness-game-inline.html /tmp/wl-s5-inline
node test/green-essay.mjs http://127.0.0.1:8765/test/csp-gz.html /tmp/wl-s5-csp
```

Each driver saves screenshots and results.json with errors, external requests, checks and failure details. Green covers 1280x720, 960x540 and 662x418, both spectator spots, source/gzip/inline/CSP gameplay, result visibility, hidden rate labels, shuffled salad, paced good essays, native undo/redo and older checkpoint recovery. Pass this packet to Astra for visual/browser acceptance and the normal Tester review.

No network access, credentials, installs, deploys, service control, commits, pushes, or external project actions occurred.
