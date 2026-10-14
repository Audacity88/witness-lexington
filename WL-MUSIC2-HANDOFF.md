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
