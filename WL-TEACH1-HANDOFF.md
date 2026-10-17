# WL-TEACH1 handoff

kind: design
card: WL-TEACH1
branch: wl-teach1
base: 717d76502a8050f253d0766aadb4d92bf4c751b4
checkout: /Users/dan/witness-lexington-codex-wt/wl-teach1
state: uncommitted implementation for wrapper commit and branch-only push

## Changes

- `src/night-ride.js` stages dawn objectives and travel assistance: meet Parker, deliver, listen, ask, then find the boundary. Delivery and witness questions no longer share a dialog. Free walking and the two listening dialogs remain unchanged. Revere's source question and reply precede a separate fictional errand screen.
- `src/green-essay.js` separates source ranking from the limitation response and provisional belief. Hypothesis construction shows account, shooter, location, and aftermath on separate screens with Back controls. The Doolittle image follows its title and artist caveat, before navigation and metadata. Essay essentials precede the textarea; full criteria and review limits use a closed, keyboard-accessible disclosure.
- `src/night-ride.css` caps the document image at 30vh and styles the criteria disclosure. `DESIGN_QUESTIONS.md` records DQ-55 through DQ-57.
- `test/green-essay-logic.cjs` follows the staged flow and checks remaining routes, source-question resume, separate controls, Back behavior, allowed locations, essay-return gates, and preserved drafts. All existing content, scoring, authorship, and migration checks remain.
- `dist/build-report.json`, `dist/fence-gz.json`, `dist/witness-game.bundle.js`, both `dist/witness-game*.html` files, and `test/csp-gz.html` are regenerated outputs.

This is a content handoff because the prompts and dialogue presentation change. `GAME_DESIGN.md`, scripted historical speech, sources, scoring, essay rules, soundtrack, and Green choice are unchanged. `SPEC.md` matches `SPEC-lexington-game.md`. No test runner was edited and no expected check was removed. In particular, `test/verify.mjs`, `test/run.mjs`, and `test/run-all.sh` are unchanged.

## Validation

Execution host: Dan's local Mac, in the checkout above. Network stayed off.

- `node test/green-essay-logic.cjs`: passed before final check additions, 112 DOM simulation checks.
- `npm run build && npm test`: passed after the final changes. The suite reports 17 verification self-tests, 58 music checks, 116 DOM integration checks, 136 CPU scene checks, and 13 decoded payload checks. These use browser, audio, or renderer doubles, not a real browser.
- `git diff --check`: passed.

No browser, screenshot capture, installation, service operation, commit, push, or project-state mutation was performed.

## Reviewer and wrapper follow-up

1. Route the prompt changes for content review, plus Astra code review. The wrapper owns the Ready PR, not a draft.
2. Tester re-gates after Astra. Browser playtests, native dialog focus, disclosure interaction, and screenshots at 1280x720, 960x540, and 662x418 remain unverified here. Confirm that Doolittle is visible without scrolling, with its artist caveat, and each task's controls fit.
3. Existing browser playtest and screenshot scripts still describe the old simultaneous controls. Update their navigation for the new steps without dropping their checks. They were not changed or run by the implementer under this card's no-test-runner-change rule.

New navigation for reviewer automation:

- Revere: `ask-source`, then `hear-errand`, then `accept`.
- Dawn: `accept-message`, travel to militia and `deliver-message`, record both listening spots in either order, return to militia and `ask-militia`, ask the townsperson, then finish at the boundary. Delivery closes the dialog; asking opens the reply. Only current-task travel buttons appear.
- Study: inspect all nine cards, then `rank-sources`. Select distinct ranks, then `rank-next` to enter the limitation. `choose-belief` stays disabled until the existing 12-character minimum is met. `limitation-back` returns to ranks; `rank-documents` returns to documents and the guarded essay-return action.
- Hypothesis: `hypothesis-next` advances account to shooter, shooter to location, and location to aftermath. Only aftermath offers `check-hypothesis`. `hypothesis-back` reverses a step. To test another account from aftermath, go Back three times. Changing an account still chooses its inherited preset without changing provisional belief.
- Essay: `essay-criteria` is a native summary before `essay-text`. Expand it to read unchanged full criteria. Draft text, telemetry, and checked hypotheses keep the existing save format. Refresh returns ranking to document selection and hypothesis editing to account selection; incomplete hypothesis edits remain session-only, as before.
