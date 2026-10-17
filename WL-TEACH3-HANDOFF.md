# WL-TEACH3 handoff

kind: design
card: WL-TEACH3
branch: wl-teach2
base: 90a0cbed7b496c874f2e133092e0e7366c478d69
parent-main: 717d76502a8050f253d0766aadb4d92bf4c751b4
checkout: /Users/dan/witness-lexington-codex-wt/wl-teach2
state: uncommitted changes for the wrapper

## Changes

- `test/ui-shots.mjs`, `test/night-ride.mjs`, `test/dawn-muster.mjs`, and `test/green-essay.mjs` now follow Revere's source reply, Hear the errand, and Accept screens. Dawn scripts deliver before listening and reopen the militiaman's dialog for the later question. Study scripts enter ranking and limitation separately, traverse all hypothesis steps, and use Back to change accounts. Draft-return and recovery checks follow those same steps.
- The UI audit derives the staged dawn objectives independently, captures the new screens and expanded review disclosure, checks disclosure hit targets, and checks that the start of the writing field fits above the fold on initial essay entry. Existing layout, music, console, and request checks remain.
- `src/green-essay.js` puts Change provisional belief and Inspect documents in a closed, keyboard-accessible disclosure instead of the hypothesis footer. The belief screen keeps its three choices. The unchanged full essay criteria now follow the writing field and feedback. `src/night-ride.css` styles the disclosure and gives the essay field a 104px initial height on short screens. `src/night-ride.js` confirms Message delivered in the listening objective.
- `test/green-essay-logic.cjs` checks the confirmation, review-action placement, and textarea-first focus order. `DESIGN_QUESTIONS.md` records DQ-58 through DQ-60.
- Regenerated outputs: `dist/build-report.json`, `dist/fence-gz.json`, `dist/witness-game.bundle.js`, `dist/witness-game.html`, `dist/witness-game-inline.html`, and `test/csp-gz.html`.

This is a design handoff because UI prompts and their presentation change. Historical dialogue, source text, scoring, essay rules, and save format are unchanged. `SPEC.md` matches `SPEC-lexington-game.md`.

## Expected-check adaptations

- The old post-listening/dialogue relay assertion is replaced by an early-boundary relay guard. The staged flow now requires delivery before offering witness questions. A separate check confirms questions remain unavailable until both listening records exist.
- Repeat delivery now checks that the action is absent after reopening the dialog, not disabled in the old combined dialog. Early boundary and listening-revisit checks still use real keyboard walking when completed or future stops have no travel button.
- Duplicate-source checks target the ranking Next action. Essay-return checks navigate back to documents before checking the guarded return action. All content, authorship, migration, pause, notebook, and source-fidelity checks remain.
- `test/verify.mjs`, `test/run.mjs`, and `test/run-all.sh` are unchanged. No verification runner or failure-exit rule was weakened.

## Validation

Execution host: Dan's local Mac. Working directory: the checkout above. Network stayed off.

- `node --check` on the three changed JavaScript source/test files and four browser scripts: passed.
- `node test/green-essay-logic.cjs`: passed, 116 DOM/renderer simulation checks. An initial test-only failure assumed the DOM double simulated native forward Tab; the corrected assertion checks document order and the implemented focus-wrap behavior.
- `npm run build && npm test`: passed. The suite runs verification self-tests, music checks, DOM integration checks, CPU scene checks, and decoded bundle checks without a real browser.
- `git diff --check`: passed.

## Reviewer follow-up

Content review and Astra code review precede the Tester re-gate. Browser behavior and screenshots remain unverified here. No browser, screenshot capture, installation, service operation, commit, push, or PR mutation ran. The wrapper owns the commit, private branch push, and ready PR.

Reviewer-only commands, from the checkout against the reviewer's loopback harness:

```sh
for scheme in light dark; do
  WL_UI_COLOR_SCHEME="$scheme" node test/ui-shots.mjs http://127.0.0.1:8765/index.html "/tmp/wl-teach3-ui-$scheme" 1280x720,662x418
done
node test/night-ride.mjs http://127.0.0.1:8765/index.html /tmp/wl-teach3-night
node test/dawn-muster.mjs http://127.0.0.1:8765/index.html /tmp/wl-teach3-dawn
node test/green-essay.mjs http://127.0.0.1:8765/index.html /tmp/wl-teach3-green
```

Check compact essay entry, closed and expanded review controls, delivery confirmation, all staged transitions, and the preserved keyboard/reload checks. The supplied `/workspace/witness-lexington-verify-teach1/verdict.txt` is not available in this checkout; this patch follows the card's reported failure and the existing WL-TEACH1 handoff.
