# WL-S4 tester fixes handoff

- `card: WL-S4`
- `kind: design` for GAME_DESIGN, essay instructions/rules, source labels, contradiction feedback, and the staged-view caption. Slice code also requires Astra code review.
- `branch: wl-s4-tester-fixes`
- `current round: 2`
- `current base / HEAD: 06187d0b77cf467cfae7c9912931634f89567739`
- `round-1 base: 9464a99aa63b69ebb6687d7b1920e80da50a5e63` from WL-S3
- `checkout: /Users/dan/witness-lexington-codex-wt/wl-s4-tester-fixes`
- `commit: none; wrapper owns commit and private wl-* push`

## Round-1 delivery and item status

| Tester item | Status | Change or reason |
| --- | --- | --- |
| 1 | Fixed | Require three distinct claim sentences, connected reasoning, and repetition checks. Near-duplicate word sets also fail. The exact stuffed essay and token-variation versions fail; existing good essays and passive historical claims pass. |
| 2 | Fixed | Essay-field typing credit discounts replaced/deleted text. Unmatched insertion, low ratio, paste/drop, speed and burst flags block Finish. Speed flags stay latched through edits and refresh. Retype starts a fresh draft, retaining earlier flagged records. The saved result contains flags, counters and content checks; completion shows earlier flags. Native single-character input supports on-screen keyboards; repeatedly flagged accessibility input needs external teacher review. |
| 3 | Fixed | Build uses the v2 index script list and checked-in THREE, with CSS, image and sources embedded. All shipped plain and decompressed gzip payloads exclude the Barker overstatement. The oversized plain fence is removed; both standalone HTML variants and the fitting gzip fence are rebuilt. |
| 4 | Fixed in source; visual pending | Primary scene interaction precedes the independently scrolling travel choices. Reviewer driver checks the visible 44px action at muster stages, including 662x418. |
| 5 | Fixed in source; visual pending | Evidence and notebook links have minimum 44px height and width. Driver measures both. |
| 6 | Skipped | Small typography is explicitly outside this card. DQ-38 records it. |
| 7 | Fixed in source; visual pending | Study, hypothesis, essay and Finish buttons sit in a separate footer outside the content scroller. Driver measures action visibility at all three requested sizes. |
| 8 | Skipped | Viewport-aware 3D label fitting needs visual iteration; deferred under DQ-39. Labeled travel controls remain available. |
| 9 | Fixed | Formation scoring says parade formation in plain sight. Unsupported rank precision is removed, including the essay recognition rule; scoring marks are unchanged. |
| 10 | Fixed | Numbers summary is labeled reconstruction estimate with the existing estimate/scope note and `[NUMBERS]` citation. |
| 11 | Fixed | Revere 1798 retains the chosen MASSAR ampersands/editorial flag and ends the trim with a semicolon plus ellipsis. |
| 12 | Fixed | Revere credit needs an attributed report or view. Eli, first-person fictional observations and mere nearby mentions of Revere do not count. Exact reviewer counterexamples fail. |
| 13 | Fixed | Rejected hypotheses have no Write action. Changed options invalidate the action; defensive handlers and essay checkpoint validation prevent rejected-hypothesis entry. |
| 14 | Fixed | Every contradicting fact/testimony card is named with its source ID and inherited explanation. Remove the misleading last-viewed-card feedback and bare count. |
| 15 | Fixed in source; visual pending | Remove localized aftermath smoke, explicitly label the staged blocked view, and hide militia within 2.5 scene units of the observation camera. Both spots retain full pivot obstruction in geometry checks. |
| 16 | Skipped | Light theme is explicitly outside this card. DQ-38 records it. |
| 17 | Fixed | Opening and Green clocks use real elapsed time; movement still uses bounded steps. Pause/modal behavior is preserved. |
| 18 | Unchanged information | Eli remains the approved single fictional playable character; both spectator spots are covered. |
| 19 | Fixed | Scoring comparison uses checked-in `test/fixtures/s2-scoring.json`, with no git-history command at runtime. |

The 60-word minimum, two-reference requirement, card groups, historical scoring marks, allowed combinations and uncertainty remain inherited. No named historical person receives new words or actions. New defaults and deferrals are DQ-33 through DQ-40. SPEC.md and SPEC-lexington-game.md remain identical and unchanged.

## Round-1 review and local verification

Native Astra code and content reviews ran read-only against the exact checkout, branch and round-1 base above. Initial reviews found speed-flag dilution, near-duplicate stuffing, fictional Revere attribution and missing student instructions. Re-review caught a passive/copular evidence regression. All findings were repaired and covered with focused tests. Final code verdict: PASS, no remaining blockers. Final content verdict: PASS, `kind: design`, no remaining blockers. These verdicts cover the uncommitted source diff, not browser acceptance.

- `node test/green-essay-logic.cjs`: 86 checks pass. Full stubbed UI flow at both spectator spots, authored content for either side/uncertainty, source inspection/ranking, paste/drop, refresh, prior flags, retyping, current-field ratio, rapid insertion, sticky speed, trusted native character input, repeated/near-duplicate stuffing, fictional exclusion, contradiction gating, passive evidence and low-frame-rate clock checks.
- `node test/green-world.cjs`: 136 checks pass using bundled THREE with renderer/canvas stubs. Both spectator spots and target aspects, full obstruction rays, visible regulars, hidden shooter indicators, finite transforms and officer arrival remain covered.
- `node tools/build.mjs`: succeeds offline using Node built-ins and checked-in vendor/assets. `dist/build-report.json` records byte counts, script list and bundle hash. Gzip fence fits the 980,000-byte safety threshold. Plain fence exceeds it and is removed rather than retaining stale content; standalone plain HTML is still generated.
- `node test/dist-v2.cjs`: 8 checks pass across shipped plain and decoded gzip artifacts, syntax, v2 controller/styles/image, Barker wording, index script parity and fence limit.
- All existing `test/*.mjs` browser drivers and all relevant JS files pass syntax checks. Browser driver execution is pending: WORK_INSTRUCTIONS.md explicitly assigns browser launches/screenshots outside this implementer sandbox, and the declared puppeteer-core dependency is unavailable here. No install was attempted. The existing v1 `test/run.mjs` step fixtures are historical; use the v2 slice drivers below.
- Generated SCORING.md matches `tools/scoring-md.mjs`; the portable fixture matches inherited marks and shooters. Both specs match. `git diff --check` passes.

## Reviewer playtest packet

Under WORK_INSTRUCTIONS.md, the reviewer runs this outside the implementer sandbox with existing dependencies and an unused port. Do not install packages or change Dan's services.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node test/night-ride.mjs http://127.0.0.1:8765/index.html /tmp/wl-s4-night
node test/dawn-muster.mjs http://127.0.0.1:8765/index.html /tmp/wl-s4-dawn
node test/green-essay.mjs http://127.0.0.1:8765/index.html /tmp/wl-s4-green
node test/green-essay.mjs http://127.0.0.1:8765/dist/witness-game.html /tmp/wl-s4-gzip
node test/green-essay.mjs http://127.0.0.1:8765/dist/witness-game-inline.html /tmp/wl-s4-inline
```

Run the server in a separate process. The updated Green driver covers 1280x720 light, 960x540 dark and 662x418 dark, both spectator spots, muster action bounds, evidence/notebook targets, pinned actions, named contradictions, exact stuffing, insertion after typing, persisted flags, burst rejection, retype and paced good essays. It captures muster, documents, pivot, aftermath, hypothesis, flagged/good essays and completion screenshots, plus console/network/failure JSON. It does not install dependencies. Typed good essays use 60ms character spacing; immediate automated typing intentionally triggers the speed/burst gate.

Pass the browser screenshot/console packet to Astra, then Work reruns Tester lens-260 before Workbench inclusion. Browser geometry, rendering, real native-input behavior, compressed-loader execution and screenshot acceptance remain unverified locally. No network requests, credentials, installs, service control, commit, push, deployment or external project actions occurred.

Changed files are the WL-S4 source/data and CSS, tools/build.mjs, generated dist, the logic/browser drivers and portable fixture/dist test, GAME_DESIGN.md, DESIGN_QUESTIONS.md, CREDITS.md, generated SCORING.md, and this handoff.


## Round-2 repair handoff

- `card: WL-S4`
- `kind: design` for DQ-41/42 repair defaults; code review also required.
- `branch: wl-s4-tester-fixes`
- `base / HEAD: 06187d0b77cf467cfae7c9912931634f89567739`
- `commit: none; leave changes uncommitted for the wrapper`

Both round-2 findings are accepted and fixed.

1. P1, saved draft recovery: saved essay or finished checkpoints with a structurally valid contradicted hypothesis now resume at hypothesis revision. Keep the draft, notebook/progress, inspected cards, rankings, limitation, belief and hypothesis. Hypothesis acceptance still gates essay entry. Migration covers old S3 telemetry and current checkpoints. Malformed checkpoints remain rejected.
2. P2, native editing history: record text-edit deltas and before/after typing credit while the textarea exists. Trusted native undo/redo can restore earlier observed states, including grouped edits and new branches, without unkeyed insertion, ratio or burst penalties. Synthetic and unknown history events receive no exemption; existing flags remain sticky. Delta storage avoids keeping a full essay snapshot per keystroke. The journal is in memory; persisted credit/counters remain in the existing save, and a recreated textarea starts its own native history.

Changed files for this round: src/green-essay.js, src/night-ride.js, test/green-essay-logic.cjs, test/green-essay.mjs, DESIGN_QUESTIONS.md, this handoff, and the five rebuilt dist artifacts. No historical content, scoring, source quotations, dialogue or student-facing strings changed.

Native Astra code review PASS, no blockers, and Astra content/default review PASS, `kind: design`, no blockers, on the exact branch/base above. Reviewer checks passed 94 controller, 136 geometry and 8 dist checks. The small DQ-table formatting nit was corrected.

Local validation: 94 controller checks pass, including both spectator runs, delete/undo/redo, grouped history, new branches, known-text synthetic history and unknown native history, retained flags, and legacy/current essay/finished checkpoint recovery through hypothesis revision and draft refresh. Geometry remains 136 checks passing; decoded distribution remains 8 checks passing. All 21 relevant JavaScript syntax checks pass, including the generated bundle. Build succeeds offline; specs, generated scoring and fixture parity match. `git diff --check` passes.

The Green browser driver now exercises native Command/Ctrl-Z and Shift-Z after deleting a paced typed passing essay. It checks restored draft/credit and Finish, redo to empty, and undo again. It also restores older contradicted essay/finished save fixtures, checks draft/progress recovery, fixes the hypothesis through the UI, and returns to the draft. New screenshot names include essay-native-undo, essay-native-redo and recovered-essay/finished. Use the existing server and source/gzip/inline commands above to produce the review packet.

Browser gameplay acceptance, native browser input behavior and screenshots remain unverified locally. WORK_INSTRUCTIONS.md assigns browser launch and screenshot capture to the reviewer outside this sandbox; the declared puppeteer-core dependency is unavailable here. The supplied opening screenshots establish only opening-screen rendering. Work must rerun Tester after the reviewer playtest packet. No install, network request, credential access, service control, commit or push occurred.
