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

## Validation

- `node tools/build.mjs`: passed. Gzip fence is 595,562 bytes, below the 980,000-byte build limit; growth from base is 3,480 bytes. No large audio file was added.
- `npm test`: passed, 30 music checks, 110 DOM/game integration checks, 136 CPU scene checks, and 13 decoded payload checks.
- `git diff --check`: passed.
- Astra local code review found a scene-change envelope transient. Active voices now hold their current gain before fading, and queued voices stop before they can start. Added hold/fallback/queued-voice checks; Astra confirmed the P2 resolved with no remaining finding in the focused re-review on this same branch/base and uncommitted source state. Browser listening remains pending.

These are non-browser checks. They do not establish sound quality, browser audio behavior, console cleanliness, or layout acceptance.

## Reviewer playtest

`WORK_INSTRUCTIONS.md` assigns headless browser tests and screenshots to the reviewer and prohibits the implementer from launching a browser. Run the existing harness outside the implementer's sandbox, without installing dependencies here:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node test/ui-shots.mjs http://127.0.0.1:8765/index.html artifacts/ui-music2 1280x720,662x418
node test/ui-shots.mjs http://127.0.0.1:8765/dist/witness-game.html artifacts/ui-music2-dist 1280x720,662x418
```

Collect screenshots and console errors for Astra/Tester. Check both music labels in travel, notebook, pause, evidence, and essay footers at both sizes; the existing harness covers the full game but requires an additional mute/unmute check. Listen through at least one playlist refill and verify distinct tunes, fife/fiddle/harpsichord timbres, muster drums, slower Green music, audible 20–40-second rests, no immediate repeats, and silence during the first-shot event. Check hidden-tab resume and a resumed saved game. Print-source citations and abbreviated tune arrangements need content review; no historical source was fetched during this offline card.
