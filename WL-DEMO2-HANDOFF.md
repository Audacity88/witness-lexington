# WL-DEMO2 music handoff

- card: WL-DEMO2
- kind: design for the DQ-47 music default and credit; code review also required
- repository: Audacity88/witness-lexington, private
- checkout: /Users/dan/witness-lexington-codex-wt/wl-demo-banner-live
- branch: wl-demo-banner-live
- base / HEAD: 2e6e6d8b1fe2374500a2f4147ac0200b2af2cd5b
- commit: none; wrapper owns commit and push of this branch only. Do not merge or include in the showcase.
- bundle SHA-256: 0a01664e01fec5e4c112130d2cc5424c25759ed4bff67e0db230afa4345ac66c

## Change

`src/music.js` generates a quiet looping Yankee Doodle phrase with a sine-wave fife and synthesized drum accompaniment. No audio files, assets, dependencies, or network requests were added. Begin and Resume saved run create the audio context through a player gesture. The player can select mute before beginning. The mute preference lasts for the page session; hidden tabs suspend audio, and restored pages resume without a second context. Unsupported or denied Web Audio disables the control without interrupting gameplay.

`src/night-ride.js` places one native, keyboard-focusable Mute music button in the HUD or active overlay/dialog footer. Its pressed state uses the existing navy and parchment theme, and its hit target inherits the 44px button minimum. `src/green-essay.js` retains the control during local document, inspection, belief, and hypothesis rerenders. `src/night-ride.css` keeps the HUD tools together. `index.html` loads the audio module. DQ-47 and CREDITS.md record the decorative music default. Historical dialogue, cards, scoring, essay rules, and GAME_DESIGN.md were not revised.

The existing DOM harness loads the audio module, covers graceful unavailability, and checks control placement through document changes, inspection, and notebook entry/exit. The three existing browser slice drivers now expect reverse Tab to reach the enabled mute control at the footer's end. Their execution remains reviewer-owned. The offline build regenerated five dist files and test/csp-gz.html.

## Validation and review

- `node tools/build.mjs`: pass; gzip fence is 592082 bytes, within its existing limit.
- `npm test`: pass, 110 controller checks, 136 geometry checks, 13 dist/fixture checks.
- JavaScript syntax checks and `git diff --check`: pass. SPEC.md and SPEC-lexington-game.md match.
- Transient Node Web Audio simulation: pass for lazy gesture startup, pre-mute, synthesized voices, mute/unmute, single context, hidden-tab suspension, pagehide/pageshow restoration, missing API, and rejected resume. This does not verify audible quality.
- Initial Astra code review found a detached mute control on study rerenders and pagehide recovery risk. Both are repaired. Final Astra source re-review PASS covers the exact branch, HEAD, and bundle hash above; no remaining source findings. This does not establish browser acceptance.

WORK_INSTRUCTIONS.md assigns browser playtests and screenshots to the reviewer and says the implementer must not launch a browser. No browser was launched. Listening, console errors, keyboard activation/Tab order, and layout acceptance at 1280x720 and 662x418 remain reviewer-owned. Use an existing loopback server or the project harness; do not control Dan's services. Suggested existing UI audit command:

```sh
node test/ui-shots.mjs http://127.0.0.1:8765/index.html /tmp/wl-demo2-ui 1280x720,662x418
```

Also verify silence before Begin, mute/unmute with Space and Enter, mute availability through Pause/blackout/notebook/evidence/hypothesis/essay, saved-run startup, hidden-tab recovery, and the rebuilt dist page. Pass screenshots and console results to Astra for browser acceptance.

No install, network access, deploy, service control, commit, push, merge, or external project mutation occurred.
