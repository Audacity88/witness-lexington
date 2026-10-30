# WL-POLISH handoff

Base: `63143ad`, local branch `wl-polish`, `Audacity88/witness-lexington` checkout. Committed on branch wl-polish by the executor; not merged into main.

## Changes

- `src/night-ride.css`: at widths <=420px or heights <=300px, stack the HUD and objective/travel strip in normal flow inside a vertically scrolling game container. Wrap HUD tools and interaction labels; remove panel clipping and objective height limits in that layout. Keep the existing 14px type and 44px target minimums. Larger viewport layout rules are unchanged.
- `tools/build.mjs`: remove the generated embed shell's 400px minimum height. The host and renderer use the viewport height; overflowing UI supplies the scroll extent.
- `src/night-ride.js`: blur clears movement, drag, and assisted travel without pausing. The existing hidden-document visibility handler still pauses; returning requires explicit Resume.
- `test/green-essay-logic.cjs`: opening/gameplay visible-blur and hidden-visibility checks; held-key and assisted-travel cleanup; resize coverage for 320x240, 1280x800, 100x100, 1x1, 2000x200, 200x2000, and the existing zero/restored sizes.
- `test/wl-polish.mjs`: focused reviewer browser check for all HUD controls, objective, interaction, and travel controls at 320x240, using scrollIntoView, viewport/clipping-ancestor bounds, and hit testing. Checks source, gzip embed, and inline embed; tests Tab-out, hidden-page pause, 1280x800, and extreme resizes. Blocks external page requests, uses one Chrome instance, and closes it in finally. Saves `artifacts/wl-polish-320x240.png` on success.
- `DESIGN_QUESTIONS.md` DQ-63/DQ-64 and `UI_STYLE.md`: record scrolling exception and visibility-based pause choice.
- Rebuilt all five tracked `dist/` outputs and generated `test/csp-gz.html`.

No edits to `test/verify.mjs`, `test/run.mjs`, or `test/run-all.sh`. No expected checks removed.

## Finish line

Execution host: current Mac. Working directory: `<local path>`.

| Requirement / command | Result | Summary |
| --- | --- | --- |
| `npm run build` | YES | Exit 0; `bundleBytes: 1243368`, `gzFenceJsonBytes: 597489`, `inlineFits: false`, `rewriterMatches: 0`, `closeScriptInPayload: 0`. Tracked outputs updated. |
| `npm test` | YES | Exit 0; verification 17, music 58, DOM/renderer 127, CPU scene 139, dist payload 13 checks. |
| New focus/visibility regression detects old behavior | YES | Running the current DOM suite with the original `63143ad` controller substituted in memory fails exactly at `opening: visible blur must not pause`. Current code passes. No tracked files changed for this sensitivity check. |
| `node --check test/wl-polish.mjs` | YES | Exit 0. Browser regression syntax checked. |
| `git diff --check` | YES | Exit 0; no whitespace errors. |
| `node test/wl-polish.mjs http://127.0.0.1:8765/` | NO / environment unavailable | Exit 1: `ERR_MODULE_NOT_FOUND: Cannot find package 'puppeteer-core'`. No dependencies downloaded. |
| Browser layout/Tab acceptance and requested screenshot | NO / unverified | Chrome executable exists, but two bounded direct startup probes produced no DevTools endpoint within 10 seconds and no diagnostic output. Probe children were cleaned up; isolated temporary profiles removed. No screenshot produced. |

The first new movement test run used a disabled travel button before accepting the errand; its setup was corrected to accept the errand first. The full suite then passed. No product change was needed for that test setup error.

## Remaining work and risks

Reviewer: with the existing Puppeteer dependency and usable Chrome, serve the repo over loopback, then run `node test/wl-polish.mjs http://127.0.0.1:8765/` from this root. This creates the requested screenshot. The full existing UI screenshot suite was not run.

The browser regression and CSS layout have not been executed in a real browser here. Visual acceptance at 320x240 and 1280x800 remains pending; non-browser resize checks establish positive finite renderer/camera dimensions, not visual layout. The tiny-screen exception intentionally scrolls instead of shrinking text/controls. A visible page losing OS focus no longer automatically pauses unless the browser also reports it hidden; explicit Pause remains available.

STATUS: ready for wrapper/reviewer; browser acceptance pending.

## Executor verification (Oct 29, 2026)

- `npm test`: exit 0.
- `node test/wl-polish.mjs http://127.0.0.1:<port>/` with puppeteer-core and local Chrome, serving the repo over loopback: PASS for `index.html`, `dist/witness-game.html` and `dist/witness-game-inline.html` (8 controls reachable at 320x240 each; Tab-out, hidden-page pause and resize matrix pass). Screenshot: `artifacts/wl-polish-320x240.png`.
- Separate headless walk-through at 320x240 (opening, rewind, night alarm): every visible button, including the four travel/talk buttons, scrolls fully into view; a window blur while visible leaves the game unpaused; no page errors.
