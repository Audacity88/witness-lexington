# WL-MUSIC2 handoff

kind: design
card: WL-MUSIC2
branch: wl-music2
base: d9b8da722f96ce30d99d3fa5c14592b9bf375dfc
checkout: /Users/dan/witness-lexington-codex-wt/wl-music2
state: uncommitted implementation for wrapper commit and branch-only push

## Changes

`src/music.js` replaces the single repeating phrase with four public-domain tune excerpts: Yankee Doodle, The British Grenadiers, Petzold's Minuet in G, and Ah! vous dirai-je, maman. All audio comes from Web Audio oscillators and one 0.16-second generated noise buffer. No audio assets or dependencies were added.

A shuffled bag visits all four tunes without immediate repeats, including at refill and after scene changes. Completed tunes have 20–40-second rests. Scene changes stop queued voices and preserve a current rest or add a full rest after an interrupted tune. Alternating leads and tempos vary the arrangements. Night is sparse, muster has bass drum and snare, Green travel and shelter are slower and quieter, and study uses keyboard and fiddle. Opening, blackout, and first-shot observation stay silent.

`src/night-ride.js` supplies the scene hook and changes the existing mute button to "Play music" when muted. Button placement, styling, focus behavior, and aria-pressed semantics are retained. `UI_STYLE.md` documents the control and mood behavior; `CREDITS.md` credits the tunes and print references; `DESIGN_QUESTIONS.md` records DQ-48 through DQ-51. This is a design content handoff because it changes the soundtrack design. The historical dialogue, evidence, scoring, and essay rules are unchanged.

`test/music.cjs` checks playlist timing, scene arrangements, resource cleanup, mute and page lifecycle, and unavailable audio. `package.json` adds it to the existing test command. `test/green-essay-logic.cjs` checks both mute labels and aria states in the existing notebook/control test. `dist/*` and `test/csp-gz.html` were rebuilt with `tools/build.mjs`.

## Initial implementation validation (reported)

- `node tools/build.mjs`: passed. Gzip fence is 595,562 bytes, below the 980,000-byte build limit; growth from base is 3,480 bytes. No large audio file was added.
- `npm test`: passed, 30 music checks, 110 DOM/game integration checks, 136 CPU scene checks, and 13 decoded payload checks.
- `git diff --check`: passed.
- The initial implementer reported an Astra re-review of the scene-change envelope fix. That re-review is not independently verifiable from this checkout. Dan supplied a subsequent Astra code-review approval for `d9b8da722f96..c0bd406ed12a`, with browser/audio acceptance still incomplete. Browser listening remains pending.

These are non-browser checks. They do not establish sound quality, browser audio behavior, console cleanliness, or layout acceptance.

## Reviewer playtest

`WORK_INSTRUCTIONS.md` assigns headless browser tests and screenshots to the reviewer and prohibits the implementer from launching a browser. Run the existing harness outside the implementer's sandbox, without installing dependencies here:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node test/ui-shots.mjs http://127.0.0.1:8765/index.html artifacts/ui-music2 1280x720,662x418
node test/ui-shots.mjs http://127.0.0.1:8765/dist/witness-game.html artifacts/ui-music2-dist 1280x720,662x418
```

Collect screenshots and console errors for Astra/Tester. Check both music labels in travel, notebook, pause, evidence, and essay footers at both sizes; the existing harness covers the full game but requires an additional mute/unmute check. Listen through at least one playlist refill and verify distinct tunes, fife/fiddle/harpsichord timbres, muster drums, slower Green music, audible 20–40-second rests, no immediate repeats, and silence during the first-shot event. Check hidden-tab resume and a resumed saved game. Print-source citations and abbreviated tune arrangements need content review; no historical source was fetched during this offline card.

## Round 2 content correction and validation, October 14, 2026

kind: design
reviewed-head: c0bd406ed12a7d577766358b7c3afbf39fcb2e8a
state: uncommitted correction on wl-music2 for wrapper commit and branch-only push

Corrected the K. 265 credit in `CREDITS.md` to Torricella, Vienna, 1785. Artaria's edition followed in 1787. Added the checkable Henle edition-history link supplied in the content review. Regenerated all six build outputs with `tools/build.mjs`, including embedded credits and `test/csp-gz.html`. No music, UI, layout, dialogue, scoring, or essay code changed in this round.

Validation ran locally on Dan's Mac in `/Users/dan/witness-lexington-codex-wt/wl-music2`:

- `node tools/build.mjs`: passed. The gzip fence is 595,690 bytes, below the 980,000-byte build limit.
- `npm test`: all 289 checks passed, comprising 30 music, 110 DOM/game, 136 CPU scene, and 13 decoded payload checks.
- `git diff --check`: passed.

Browser/audio acceptance remains unverified. `WORK_INSTRUCTIONS.md` explicitly prohibits implementer browser launches and screenshot capture and assigns them to the reviewer. No browser was launched, no screenshot was taken, and no listening was performed in this round. The previous 1280x800 initial-screen screenshots do not establish the requested acceptance. Use the reviewer commands above for both source and embedded builds at 1280x720 and 662x418. Capture each gameplay footer before and after clicking the toggle, including visible "Mute music" and "Play music" labels and their aria-pressed values. Record console errors and warnings and inspect clipping at both sizes.

Tune-source verification is also pending. Existing references cover Aird's Yankee Doodle print, Chappell's British Grenadiers reference, Petzold's 1725 notebook minuet, and Mozart's theme of the traditional French air. The Henle link addresses the publisher/date correction only. Network stayed off, so no linked source or score was independently fetched or compared in this round.

Arrangement-transition checks use a Web Audio clock double, not audible output. They pass for sparse night music, muster drums, slower Green music, study keyboards, 20–40-second rests, no immediate repeats, queued-voice cancellation, rest preservation on scene changes, mute/resume, and silent opening/first-shot phases. Reviewer listening must still establish recognizable tunes, acceptable timbres, and clean transitions in a real browser.

## Round 3 tester repairs, October 14, 2026

kind: design
base: e0992ce5f01b4629f1e3d6b6cf913ecb195cf3af
branch: wl-music2
state: uncommitted changes for wrapper commit and branch-only push

This round changes soundtrack arrangements and UI design, so it needs content review as well as Astra code review and the reviewer-owned browser playtest. It supersedes the initial all-four-tunes-in-every-scene playlist description. No historical dialogue, evidence, scoring, essay rules, or source passages changed. The Torricella 1785 / Artaria 1787 credit and Henle link remain intact.

- `src/night-ride.css` keeps dialog actions on one row, prevents secondary buttons from shrinking, and reduces footer padding and gaps on short screens. The full Mute music / Play music labels and existing 44px minimum targets remain. This removes the second footer row that crowded Revere's source question; its actual browser dimensions still require reviewer verification.
- `src/music.js` now treats Pause separately from mute. `src/night-ride.js` forwards the gameplay pause state during rendering. Pause suspends the audio clock without changing the label or playlist position. Resume retains mute and cannot bypass a hidden tab, page exit, or silent scene.
- Scene changes rebuild the eligible shuffle bag while retaining the last tune and the existing 20–40-second rest rules. The French air is eligible only during Green travel and shelter. Other musical scenes shuffle the remaining three tunes. Green still rotates all four, rather than repeating the air alone.
- Night uses a new natural-minor adaptation at 66/76 bpm, an octave below study's 78/88 bpm, with lower open-fifth bass. The opening and first-shot event remain silent. `CREDITS.md` describes this as a new arrangement, not a period transcription. Tune notes and the inherited print-source references are otherwise unchanged.
- `UI_STYLE.md` documents the footer and Pause behavior. `DESIGN_QUESTIONS.md` updates DQ-49 and adds DQ-52 through DQ-54. `test/music.cjs` covers scene eligibility, repeats and rests at three random extremes, the minor arrangement, pause/resume, and scene transitions. `test/green-essay-logic.cjs` checks gameplay-to-music pause forwarding and retained mute in the DOM simulation.
- `test/ui-shots.mjs` now captures unmuted, muted, and restored labels in Revere's dialog, ride and Green HUDs, pause, evidence, notebook, and essay footers. It records label, aria state, footer, phase, and AudioContext state; checks one-row dialog footers; verifies frozen audio time on Pause; and checks muted and unmuted Resume. This harness update was syntax-checked only, not executed in a browser.

Validation ran locally on Dan's Mac in `/Users/dan/witness-lexington-codex-wt/wl-music2`:

- `node tools/build.mjs`: passed; all six generated outputs rebuilt. Gzip fence is 596,022 bytes, 332 bytes above the reviewed base and below the 980,000-byte limit. No assets or dependencies were downloaded.
- `npm test`: all 319 checks passed: 58 Web Audio clock-double checks, 112 DOM/game checks, 136 CPU scene checks, and 13 decoded-payload checks.
- `node --check test/ui-shots.mjs` and `git diff --check`: passed.

Browser acceptance remains open. `WORK_INSTRUCTIONS.md` prohibits implementer browser launches and screenshot capture and assigns them to the reviewer. No new screenshots, console-cleanliness results, listening evidence, or `ui-shots.mjs` exit-0 result are claimed for either viewport. From this checkout, the reviewer can serve the source and rebuilt standalone page and run the existing harness at both requested sizes:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node test/ui-shots.mjs http://127.0.0.1:8765/index.html /tmp/wl-music2-round3-source 1280x720,662x418
node test/ui-shots.mjs http://127.0.0.1:8765/dist/witness-game.html /tmp/wl-music2-round3-dist 1280x720,662x418
```

The harness is at `test/ui-shots.mjs`, not `tools/ui-shots.mjs`. Both runs must exit 0 before browser acceptance is recorded. Inspect Revere's footer and the full 44px source-question target in both label states. Listening must still establish recognizable tunes, acceptable timbres and balance, clean arrangement transitions, the darker night mood, rests, and actual audible pause/resume behavior. Independent score/source verification remains pending because network stayed off. The clock-double checks and browser AudioContext state checks do not establish sound quality or historical source fidelity.

No commit, push, branch switch, merge, install, deploy, or service mutation occurred. Changes are limited to WL-MUSIC2 and its generated artifacts.

## Round 4: dialog footer repair and reviewer-owned browser acceptance

kind: design
card: WL-MUSIC2
branch: wl-music2
base and current HEAD: 4d2278325eae2ed2af501d25011a78daed7c5156
checkout: /Users/dan/witness-lexington-codex-wt/wl-music2
state: uncommitted; ready for review and wrapper commit

This section supersedes Round 3's full-text dialog toggle design. Dan and chief/reviewer notes #180 and #182 restore reviewer-owned browser acceptance for this card and drop the in-sandbox browser requirement. Code and non-browser validation are complete; pending browser checks do not block this handoff. Astra code review and content review of this new diff are pending. No new review approval is claimed.

- `src/night-ride.css` makes only the dialog-footer music toggle a fixed 44x44px music-note icon, with a diagonal strike while muted. Primary actions now have the space previously occupied by the full toggle text. Existing one-row footer rules, short-screen padding, and hit-target minimums remain. Actual browser layout is not verified.
- `src/night-ride.js` retains the changing Mute music / Play music text in a span and adds the matching explicit accessible label. The span is visually hidden only inside dialog footers; travel HUD and overlay footers retain visible text. Existing aria-pressed, keyboard behavior, pause/mute separation, and playback logic remain.
- `UI_STYLE.md` documents the icon and reviewer light/dark audit commands. `DESIGN_QUESTIONS.md` revises DQ-52. `WORK_INSTRUCTIONS.md` records Dan's clarification that browser checks and screenshots run in review/Tester after handoff, not in the implementer's sandbox.
- Existing DOM checks in `test/green-essay-logic.cjs` now verify accessible labels during Pause/Resume and notebook mute/unmute. `test/ui-shots.mjs` adds accessible-name checks and explicit `WL_UI_COLOR_SCHEME=light|dark` emulation and reporting. No existing layout checks or thresholds were weakened.
- `src/music.js`, historical dialogue, credits, tune data, scoring, and essay rules are unchanged. The Torricella credit, Green-only French air, darker minor night arrangements, Pause silence, no immediate repeats, and 20–40-second rests are retained. The six generated build outputs were rebuilt.

Validation host: Dan's Mac. Working directory: the checkout above.

```text
$ node tools/build.mjs
gzFenceJsonBytes: 596214
exit 0
$ npm test
Web Audio clock double: 58 checks
DOM/renderer simulation: 112 checks
CPU scene construction: 136 checks
Decoded dist payloads: 13 checks
All 319 checks passed; exit 0
$ node --check test/ui-shots.mjs
exit 0
$ git diff --check
exit 0
```

Browser acceptance could not run in this sandbox. The direct harness command failed before browser launch:

```text
$ node test/ui-shots.mjs http://127.0.0.1:8765/index.html /private/tmp/wl-music2-round4-source-light 1280x720,662x418
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'puppeteer-core'
exit 1
```

The error log is `/Users/dan/witness-lexington-codex-cache/wl-music2-round4-browser.log`. No dependencies were installed. An existing Playwright runtime was found in ChatGPT.app. A temporary, task-local adapter was prepared at `/private/tmp/wl-music2-browser-adapter.mjs`, with loader and resolver siblings, to run the existing audit against real Chrome without changing its assertions. That route was not executed because the task-owned test server could not bind:

```text
$ python3 -m http.server 8765 --bind 127.0.0.1
PermissionError: [Errno 1] Operation not permitted
exit 1
```

No server or browser started, and no existing services were changed. These earlier failed attempts are historical evidence, not a current handoff blocker. Per Dan and chief/reviewer notes #180 and #182, source and standalone acceptance at both sizes in light and dark are left to review/Tester after handoff. No further implementer browser checks were attempted. There are no new screenshots, no browser-console results, and no exit-0 browser claim. Listening and independent tune-source verification also remain unverified. Sources and arrangement transitions are documented in the existing credits and Round 3 notes; the passing audio-clock tests are not listening evidence.

After handoff, review/Tester owns serving this exact checkout and running `test/ui-shots.mjs` against both `/index.html` and `/dist/witness-game.html`, each with `1280x720,662x418` and both color schemes. Use separate output directories and the reviewer-side browser environment. All four runs must exit 0 for browser acceptance. Inspect Revere Accept, record-listening, deliver-message, Who told you?, both mute states, and Pause/Resume. Implementer readiness does not claim browser acceptance.

STATUS: ready
