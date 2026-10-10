# WL-S2 handoff

- `card: WL-S2`
- `kind: design` for the dawn script, scene labels, hearing experiment, and DQ-23 through DQ-26; accompanying slice code requires code review.
- `branch: wl-s2-dawn-muster`
- `base: 76b14c3b80b9c48db84d477901c85292d8c83873` from WL-S1
- `checkout: /Users/dan/witness-lexington-codex-wt/wl-s2-dawn-muster`
- `commit: none; changes intentionally uncommitted for the wrapper`
- `status: ready for reviewer-side browser playtest and screenshots`

## Delivered locally

Slice B continues from the alarm checkpoint onto Lexington Green on foot. Eli meets the dramatized Parker, carries an invented reminder to a fictional militiaman, and visits near and distant listening spots in either order. The student asks the fictional militiaman what he could hear and a fictional townsperson what they could see. After those tasks, the spectator boundary opens the saved muster checkpoint. Early visits explain the remaining tasks and leave every stop reachable.

The silent hearing experiment displays the complete dramatized instruction nearby and masks some words farther away. Visible labels distinguish the simulation from a historical quotation or an acoustic reconstruction. Historical context cites `[SETTING]`, `[FORMATION]`, and `[COMMAND]`. The reflection does not infer intent or a first shooter from missing words. Parker and the fictional witnesses use the proposed WL-D1 lines.

WASD, arrows, dragging, E, and assisted travel work on foot. Pause and dialogs stop movement. The notebook retains alarm observations and adds separate fictional dawn observations and the command citation. Existing valid WL-S1 saves gain dawn progress without losing alarm records. Saves retain listening order, delivery, questions, position, and completion. Opening replay returns to the current completed checkpoint. Restart clears the whole run; denied storage keeps the live session and displays a warning.

Changed files: `index.html`, `src/night-ride.js`, `src/world.js`, `data/dawn-muster.js`, `test/dawn-muster.mjs`, `CREDITS.md`, `DESIGN_QUESTIONS.md`, and this handoff. The specs match byte-for-byte. `GAME_DESIGN.md`, scoring, essay rules, and the legacy evidence scripts are unchanged. The evidence and essay scripts remain unreachable from the entrypoint. WL-S3 owns their text repairs before reuse, including Barker's one or two shots and Doolittle's artist framing. The Green event, evidence room, and essay are explicitly unavailable here. `dist/` remains the legacy seed.

## Reviews and checks

Native `gpt-6-astra` reviewed code and content separately, read-only against this uncommitted tree on the exact base above. Content review found no blockers. Code review found that the browser test's migration fixture would be overwritten by the page-exit save. The repaired fixture now runs before the next document's application scripts. Astra re-reviewed the repair and found no remaining static blockers. These verdicts do not establish browser or visual acceptance.

- JavaScript syntax checks and `git diff --check` pass.
- Six entrypoint assets exist. All three dawn source IDs resolve in credits; the command passage anchor resolves in sources. Both specs match.
- `/private/tmp/wl-s2-flow-check.cjs` passed 34 logic checks with DOM and renderer stubs. Coverage includes both alarm and listening orders, prior-save migration, manual walking and bounds, low-frame-rate assisted arrival, pause and dialog movement stop, early boundary gating, delivery, questions, revisits, mid-muster refresh, notebook, replay, restart, denied storage, and invalid saves. This is a simulation, not browser acceptance.
- `/private/tmp/wl-s2-world-check.cjs` built the dawn scene with the bundled THREE classes and renderer and canvas stubs. It checked 39 added meshes, six rings, finite transforms, walking and idle poses, and hidden regulars, mounted officer, and shooter markers. It supplies no rendering proof.
- A temporary `python3 -m http.server 0 --bind 127.0.0.1` failed at bind with `PermissionError: [Errno 1] Operation not permitted`.
- The declared `puppeteer-core` dependency is unavailable in this checkout. No package was installed.

## Run the reviewer playtest

`WORK_INSTRUCTIONS.md` assigns browser playtests and screenshots to the reviewer outside this implementer sandbox. No browser was launched and no screenshots were taken. Pending browser checks do not block this implementer handoff. Tester `lens-260` must verify the slice visually before Workbench inclusion.

Outside this sandbox, use an unused loopback port and the already declared test dependency. Do not change Dan's services or install packages. Start a dedicated server from this checkout:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

In a second process, run:

```sh
node test/dawn-muster.mjs http://127.0.0.1:8765/index.html /tmp/wl-s2-shots
```

`CHROME_BIN` can select an existing Chrome executable. The driver plays the real alarm UI into dawn at 960x540 and 662x418, tests both listening orders, and converts the completed run to the prior save shape before app startup to check migration. It captures dawn, Parker's labels, both listening positions, fictional witnesses, boundary, checkpoint, and notebook PNGs. `results.json` records assertions, console warnings and errors, failed requests, missing assets, and external requests. The driver fails on any assertion, browser error, or external request. Syntax was checked; execution and screenshots are pending reviewer-side.

Pass the real results and screenshots to Astra code review and Tester. No commit, push, deployment, installation, credential access, network request, or change to Dan's services occurred.
