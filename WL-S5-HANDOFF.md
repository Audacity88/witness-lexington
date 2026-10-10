# WL-S5 polish handoff

- `card: WL-S5`
- `kind: design` for essay rules/instructions, source wording, opening subtitle, GAME_DESIGN and DQ-43 through DQ-46. Slice code also received Astra code review.
- `branch: wl-s5-polish`
- `round: 4`
- `base / HEAD: 9a162bd2b8f30bd79b7c548541693af99ab93827`
- `original WL-S4 base: 245a943ff287833b172618e12155aef110118b7f`
- `checkout: /Users/dan/witness-lexington-codex-wt/wl-s5-polish`
- `repository: Audacity88/witness-lexington`, private
- `commit: none; wrapper owns commit and private wl-* push`
- `bundle SHA-256: fdb60421c9a16b88f37239eaca4aa1651f6fce958ebd273b9b576fb0b34442b0`

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

## Round-1 review and local validation, historical

Native Astra code review PASS and Astra content review PASS, `kind: design`, covered the round-1 uncommitted source diff at WL-S4 base `245a943ff287833b172618e12155aef110118b7f` and bundle hash `b0e33863e7d6a716521a4cfe5735e9a736f784f1ddc53199cd9230da58bb461a`. Initial findings concerned ordinary Barker/Parker paraphrases, a falsely counted third source, and discarded completed saves. All were repaired and checked again. These reviews do not establish browser acceptance.

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


## Round-2 review repairs

- `kind: design` for essay recognition and the GAME_DESIGN/DQ-45 clarification; code review also required.
- `base / HEAD: 1c103be62e9b5fb2bc00b95154f2a4490e385da5`
- `commit: none; leave changes uncommitted for the wrapper`

Both blocking findings are accepted and fixed.

1. Keyword density falsely counted a third source in a Revere 1798/Barker comparison. Explicit document ownership now distinguishes the 1798 letter from the 1775 deposition before counting groups or awarding references, using the existing checker hook. The exact review sentence earns only the two intended source credits. Tests also cover a dated Parker deposition beside Revere's letter, both explicitly named Revere documents in either author/document order, and inspection filtering. Astra caught a reverse attribution regression during repair review; it is fixed and included in the full-essay tests.
2. Doolittle's ordinary artist and eyewitness limitations lost evidence credit. Detail patterns now recognize a named artist and explicit absence of eyewitness status, including the reported sentence and reverse attribution. Full essays pass with Doolittle and Barker inspected; withholding Doolittle inspection still withholds that credit. Bare source names still do not count.

The reviewed-head comparison and limitation essays both failed before these repairs and now pass with two references. The shuffled six-sentence salad still fails with six dense sentences and no reference credit. Historical wording, source transcriptions, scoring marks, Finish gates and DQ-38/39 remain unchanged.

Round-2 changed files: data/essay-rules.js, test/green-essay-logic.cjs, GAME_DESIGN.md, DESIGN_QUESTIONS.md, this handoff, regenerated test/csp-gz.html and all five generated dist artifacts. No browser-driver changes were needed for these checker findings.

Validation: 106 controller checks, 136 geometry checks, 13 dist/fixture checks and all 20 JavaScript syntax checks pass. Offline build succeeds; both specs and generated scoring match, and git diff --check passes. Bundle SHA-256 is `29c598cc7220ba1845fbf35b737b2aeda330ad2f896265ec8029a4f4f04dda0a`.

Final Astra code re-review PASS and Astra content re-review PASS, kind: design, at the exact branch/base/hash above. No remaining findings. Browser gameplay and screenshots remain unverified, with the commands and reviewer ownership above unchanged. No install, network access, service control, commit, push, or external mutation occurred.


## Round-3 review repair

- `kind: design` for source ownership recognition and the GAME_DESIGN/DQ-45 clarification; code review also required.
- `base / HEAD: f3108e0024dcbc4c32b2acba43407d600646f0da`
- `commit: none; leave changes uncommitted for the wrapper`

The blocking source-disambiguation finding is accepted and fixed. Revere ownership now allows intervening reporting words before deposition wording and possessive document references anchored to Revere when no other named witness intervenes. Both reported comparisons now pass with the two intended Revere references. Existing inspection filtering, overlapping-vocabulary protection, Parker separation, Doolittle limitations and keyword-salad rejection remain covered.

Astra caught two false third-source regressions during repair review. The final rules require deposition wording or the inherited adjacent Revere 1775 label, so a distant event year does not become a document. Reverse ownership requires direct document-author phrasing, so it cannot borrow Parker's deposition across a coordinated claim. Tests cover both cases, reversed Revere document order and the two exact user examples as complete essays.

Changed files: data/essay-rules.js, test/green-essay-logic.cjs, GAME_DESIGN.md, DESIGN_QUESTIONS.md, this handoff, regenerated test/csp-gz.html and all five generated dist artifacts. Historical quotations, dialogue, source-card claims, scoring marks, Finish gates and DQ-38/39 are unchanged.

Validation: 107 controller checks, 136 geometry checks, 13 dist/fixture checks and 21 JavaScript syntax checks, including the generated bundle, pass. The offline build succeeds; both specs and generated scoring match, and git diff --check passes. Both reported comparisons failed at the round-3 base with one reference and now pass with two, with no density penalty.

Final Astra code re-review PASS and Astra content re-review PASS, kind: design, cover this uncommitted diff at the exact branch/base above and bundle SHA-256 `4c6544f5f5992e5bae1eb22abf45b7f3dc2b2b4004f1d087e6f397757b3e6088`. No remaining findings. Browser gameplay and screenshots remain unverified; the reviewer commands and ownership above remain current. No install, network access, service control, commit, push, or external mutation occurred.


## Round-4 review repair

- `kind: design` for ownership recognition and the GAME_DESIGN/DQ-45 clarification; code review also required.
- `base / HEAD: 9a162bd2b8f30bd79b7c548541693af99ab93827`
- `commit: none; leave changes uncommitted for the wrapper`

The blocking finding is accepted and fixed. Revere's forward ownership matcher now checks attribution after the deposition noun as well as before it. A shared noun guard prevents matching a deposition attributed to Parker, Barker or Doolittle, including by/of/from and written/given/sworn-by forms. It also protects possessive deposition matches. Valid direct attribution to Revere remains eligible.

Full-essay tests cover both reported Parker forms, Captain John Parker and written-by wording, with all cards inspected or only the intended two cards inspected. They pass with Revere 1798 and Parker credits, no Revere 1775 credit and no density penalty. Inspecting only Revere 1775 earns no credit for these comparisons. The positive deposition-by-Revere case and earlier comparison, limitation, filtering and salad tests remain passing.

Changed files: data/essay-rules.js, test/green-essay-logic.cjs, GAME_DESIGN.md, DESIGN_QUESTIONS.md, this handoff, regenerated test/csp-gz.html and all five generated dist artifacts. Historical quotations, dialogue, source-card claims, scoring marks, Finish gates and DQ-38/39 remain unchanged.

Validation: 108 controller checks, 136 geometry checks, 13 dist/fixture checks and 21 JavaScript syntax checks pass. Offline build succeeds; specs and generated scoring match, and git diff --check passes. Both reported attribution forms reproduce a failing density check at the round-4 base and pass after repair without spurious Revere 1775 credit.

Final Astra code review PASS and Astra content review PASS, kind: design, cover the uncommitted diff at the exact branch/base above and bundle SHA-256 `fdb60421c9a16b88f37239eaca4aa1651f6fce958ebd273b9b576fb0b34442b0`. No remaining findings. Browser gameplay and screenshots remain unverified; the reviewer commands and ownership above remain current. No install, network access, service control, commit, push, or external mutation occurred.
