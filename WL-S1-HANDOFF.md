# WL-S1 handoff

- `card: WL-S1`
- `kind: design` for dialogue, captions, scene labels, and DQ-18 through DQ-22; accompanying slice code requires code review.
- `branch: wl-s1-night-ride`
- `base: b525343575d1b118f44a7c96a402345fda0df947` from WL-D1
- `checkout: /Users/dan/witness-lexington-codex-wt/wl-s1-night-ride`
- `commit: none; changes intentionally uncommitted for the wrapper`
- `status: ready for reviewer-side real-browser playtest and screenshots`

Per chief/reviewer instruction #26, confirmed by Dan, browser playtests and screenshots belong to the reviewer outside this sandbox. The implementer must not launch a browser or take screenshots. Slice code and non-browser checks are complete; pending reviewer browser acceptance does not block this handoff. This ownership rule is recorded in `WORK_INSTRUCTIONS.md`.

## Delivered locally

`index.html` now starts Slice A. It reuses the local THREE bundle and Green geometry, then enters a new low-poly fictional lane. The opening advances without firing events, cuts to opaque black, and rewinds. Skip retains all captions in the notebook. A completed run can replay the opening and return to its checkpoint without losing observations.

Eli is fictional and starts on a borrowed horse at the parsonage meeting point. Revere uses exactly the two proposed, visibly dramatized lines from WL-D1. The student can ask who supplied the report, accept the errand, ride with WASD/arrows or travel buttons, alert the fictional Lantern and Orchard households in either order, and return. There is no combat, timer, first-shooter choice, or competing score. Dawn muster is explicitly unavailable in this slice.

The notebook separates fictional observations from sourced historical context. Local saves retain accepted errands, question choice, household order, position, and completion. Pause and dialogs stop movement. Modal focus and inert overlays keep hidden controls out of keyboard navigation. Restart clears this game's saved run. Storage denial retains the live session and warns that refresh loses progress.

Changed files: `index.html`, the `makeNight` addition in `src/world.js`, `data/night-ride.js`, `src/night-ride.js`, `src/night-ride.css`, `test/night-ride.mjs`, `CREDITS.md`, `DESIGN_QUESTIONS.md`, `WORK_INSTRUCTIONS.md`, and this handoff. `SPEC.md` and `SPEC-lexington-game.md` match byte-for-byte and needed no sync. `GAME_DESIGN.md`, scoring cells, essay rules, and v1 evidence text remain unchanged. The v1 evidence/essay UI is excluded from the new entrypoint; WL-S3 must repair its text before reuse. `dist/` still contains the legacy seed, not WL-S1. No bundle, integration, or deployment was attempted.

## Review

Native `gpt-6-astra` reviewed code and content separately, read-only against this uncommitted tree on the exact base above. Content review found no source or dramatization blockers. Its reduced-dialogue-choice observation is recorded as DQ-22. Code review's assisted-arrival overshoot and pause-focus findings were repaired and re-reviewed with no remaining static blockers. These verdicts do not establish browser or visual acceptance. No external source was fetched; the already checked passages in `SOURCES.md` supplied historical evidence.

## Verification and browser test boundary

- JavaScript syntax checks pass for the world, script data, slice controller, and new playtest driver. `git diff --check` passes.
- All five entrypoint assets exist. All five displayed historical source IDs and five passage anchors resolve in credits and sources. Both specs match. The actual local THREE bundle supplies all 40 world symbols.
- A temporary Node flow diagnostic passed 16 checks with DOM and renderer stubs: both household orders; full and skipped opening; pause clock and focus; manual movement; assisted arrival at 21 FPS; modal movement stop; mid-alarm refresh; duplicate revisits; completion, replay, and refresh; restart; denied storage; invalid saved input. Diagnostic: `/private/tmp/wl-s1-flow-check.cjs`. This is a logic simulation, not a browser playthrough.
- A separate CPU construction check used the actual THREE classes with renderer and canvas drawing stubs. It built 104 night meshes, three stop rings, four horse legs, and finite Green cutscene poses. It supplies no rendering or screenshot proof.
- `python3 -m http.server 0 --bind 127.0.0.1` failed at socket bind with `PermissionError: [Errno 1] Operation not permitted`.
- Installed Chrome exited 134 on both headless launch and a local-file screenshot attempt with `--no-sandbox`. Neither attempt created screenshots. Existing `puppeteer-core` is declared in `test/package.json` but is unavailable in this checkout. No package was installed.

## Wrapper next step

These browser commands are for the reviewer outside the implementer sandbox. They have not been run during this resumed turn.

In an environment with loopback binding, installed Chrome, and the already declared test dependency available, run a dedicated test server from this checkout and the real UI harness. Choose an unused port; do not alter Dan's services.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

In another process:

```sh
node test/night-ride.mjs http://127.0.0.1:8765/index.html /tmp/wl-s1-shots
```

The harness uses real UI buttons and key input with read-only snapshots. It covers the full opening at 960x540, skip at 662x418, both household orders, rewind and mid-alarm refresh, pause/focus, notebook, keyboard movement, revisits, completion, replay, and restart. It captures blackout, rewind, Revere labels, ride, notebook, and checkpoint PNGs plus `results.json`, and records console errors, missing assets, and external requests. It fails if any assertion or browser error occurs. `CHROME_BIN` may select an existing Chrome executable.

Pass the real results and screenshots to Astra code review and Tester `lens-260` before Workbench inclusion. Do not treat the static reviews or stub checks as that acceptance. No public/project mutation, commit, push, deployment, installation, credential access, or service changes were performed.
