# WL-S3 handoff

- `card: WL-S3`
- `kind: design` for scene captions, script, source repairs, and DQ-27 through DQ-31. Slice code also requires Astra code review.
- `branch: wl-s3-green-essay`
- `base: 3d10e9ad93b483e70c69bc7ea047555dc367cdab` from WL-S2
- `checkout: /Users/dan/witness-lexington-codex-wt/wl-s3-green-essay`
- `commit: none; wrapper owns commit and push`

## Delivery

The muster checkpoint continues to two reconstructed spectator spots. A fixed observation camera shows the approach and Pitcairn's arrival from the rear, then a staged obstruction conceals the initial report. Silent captions supply the report and later firing. No first-shot plan, muzzle flash, directional cue, or shooter marker is invoked. Diffuse aftermath smoke and retreat lead to playable shelter and a neutral casualty statement. There is no combat, injury rendering, timer, or death state.

The student explicitly leaves 1775 for a modern study room. Nine cited cards appear one at a time. All must be inspected before an unscored two-source usefulness ranking and limitation. The provisional belief can favor either account or uncertainty. The inherited hypothesis table is reused without new marks, allowed locations, or combination rules. A test retains one hypothesis; it does not animate a possible first shot or display a comparison recap.

The essay uses the inherited 60-word, two-reference, counteraccount and weighing criteria. Uninspected cards cannot count. A matching reference to the last tested hypothesis can count once. Fictional dialogue and scene observations are not historical evidence. The draft, inspection, ranking, belief, hypothesis, and typing counters remain local across document visits and refresh. Paste and drop are blocked. Passing content checks does not prove historical truth or authorship. Teacher review, reliable AI detection, and automatic disqualification of confirmed outside authorship remain outside this game, as documented in DQ-10 and DQ-30.

Barker text now says one or two shots. Every Doolittle scoring explanation includes artist framing. Revere excerpts mark trims, the 1798 excerpt consistently uses the chosen MASSAR ampersands and editorial flag, Parker's specific deposition is identified, and the numbers card explains estimate scopes. All displayed historical claims and labels resolve to the credits/source register. No historical source was fetched during this card.

## Review and verification

Native Astra reviewed code and content read-only on the branch and exact base above. Code review found and then cleared hidden regulars, incomplete keyboard focus trapping, hidden study-room save warnings, focused-time loss on page exit, and transient hypotheses surviving restart. An independent Astra content role found and then cleared the missing paraphrase label on the mixed Revere 1775 card. Final code and content verdicts have no remaining blockers. These are static/local-test verdicts, not browser acceptance. Browser execution, screenshots, and Tester lens-260 acceptance belong to the reviewer outside this sandbox under WORK_INSTRUCTIONS.md. No browser is launched by the implementer. These checks remain required before showcase or Workbench inclusion.


## Files and local checks

Changed entrypoint and scene files: `index.html`, `src/night-ride.js`, `src/night-ride.css`, `src/world.js`; new `data/green.js`, `src/green-essay.js`, `src/evidence-check.js`. Repaired reused content: `data/evidence.js`, `data/essay-rules.js`, regenerated `SCORING.md`, and two legacy `test/steps-*.json` fixtures. Citation/default additions: `CREDITS.md`, `SOURCES.md`, `DESIGN_QUESTIONS.md`, and this handoff. New checks: `test/green-essay-logic.cjs`, `test/green-world.cjs`, `test/green-essay.mjs`. `GAME_DESIGN.md`, both specs, vendor assets, and legacy `dist/` are unchanged.

- `node test/green-essay-logic.cjs`: 54 checks pass. DOM and renderer stubs exercise the full alarm/muster/Green/study/essay flow, both spectator spots, S2 migration, interrupted observation, shelter and draft refresh, modal/pause stops, inspected filtering, ranking gates, either-side and uncertain essays, rejected aftermaths, paste/drop, keyboard focus, page-exit typing counters, restart, invalid saves, and denied storage. This supplies no browser or rendering proof.
- `node test/green-world.cjs`: 136 checks pass. Real bundled THREE classes with renderer/canvas stubs verify both spectator spots at 960x540 and 662x418, nine frustum rays at three pivot times per view, visible regulars, an officer arriving from the rear, hidden shooter markers, and finite transforms. The tests confirm geometric obstruction, not visual acceptance.
- Astra independently ran the two suites before the final paraphrase-label assertion and also found them passing. The implementer reran the updated logic suite after that repair.
- Ten relevant JavaScript files pass `node --check`. Eleven entrypoint assets exist. All nine card source IDs and passage anchors resolve locally. Both legacy fixtures parse as JSON. All 44 inherited scoring marks and shooter/location rules match the S2 base. `SCORING.md` matches the generator. Both specs remain byte-identical. `git diff --check` passes.
- A dedicated Python HTTP server attempt on an ephemeral loopback port fails at bind with `PermissionError: [Errno 1] Operation not permitted`. The declared `puppeteer-core` dependency is unavailable here. No install, browser launch, screenshot capture, service change, or network request was made.

## Reviewer playtest and screenshots

`WORK_INSTRUCTIONS.md` assigns this step outside the implementer's sandbox. Use an unused loopback port and an existing declared test dependency. Do not install anything or change Dan's services.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

In another process:

```sh
node test/green-essay.mjs http://127.0.0.1:8765/index.html /tmp/wl-s3-shots
```

`CHROME_BIN` may select an existing Chrome executable. The source-reviewed, syntax-checked driver walks the actual alarm and muster UI before Slice C. It tests S2-save migration, both spectator positions across the two target sizes, pause/modal movement stops, interrupted observation, shelter resume, all cited documents, ranking, both accepted account presets, fact rejection, keyboard essay access, short-answer failure, paste/drop/beforeinput blocking, draft retention, typed content passes for each side and uncertainty, completion refresh, notebook, and restart. It captures approach, obstructed pivot, aftermath, shelter, source labels, Doolittle framing, rejected hypotheses, essay failure/pass, completion, and notebook PNGs. `results.json` records checks, console errors/warnings, failed and missing requests, external requests, and failures. Any failure gives a nonzero exit code. Execution remains unverified.

Pass the real screenshot and console packet to Astra code review, then Tester `lens-260` before showcase. This handoff is ready for that reviewer-owned validation. No public/project mutation, commit, push, deployment, credential access, or service control occurred. The wrapper owns the private commit/push.


## Round 2 repair handoff

- `card: WL-S3`
- `kind: design` for the Parker essay-reference label and recognition policy in DQ-32; ranking state repair also needs code review.
- `branch: wl-s3-green-essay`
- `base: 6438209327e076e960eb0156420f2c264971f6db`
- `commit: none; repairs remain uncommitted for the wrapper`

Both blocking findings are addressed. P1: ranking edits update the essay-return button immediately, and its handler validates the full essay checkpoint before transition. An incomplete note or duplicate/cleared selection stays in a valid, resumable study checkpoint with the draft and prior progress intact. Restoring a valid ranking re-enables return.

P2: the inherited essay rules recognize Parker with his dispersal, no-firing, or unprovoked-attack account details in either word order within one sentence. This reference stays in the existing `depositions` group and counts once, only after inspection. A bare Parker name and the fictional muster instruction do not count. The same patterns identify the militia counteraccount. The two-reference and 60-word thresholds, scoring cells, and inspected-card filtering are unchanged. The existing `[MILITIA]` source register covers these details; no historical claim or quotation was added.

Changed files for this round: `src/green-essay.js`, `data/essay-rules.js`, `test/green-essay-logic.cjs`, `test/green-essay.mjs`, `DESIGN_QUESTIONS.md`, and this handoff. The expanded logic harness checks invalid limitation/pair edits, defensive return handling, refresh and restoration for both spectator runs, Parker/Barker evidence, inspection filtering, deduplication, and fictional-dialogue exclusion. The reviewer driver now types the ranking-edit reproductions, reloads their checkpoints, and types a Parker/Barker essay. Its new browser checks and screenshots still need reviewer execution; the supplied round-2 introduction screenshots do not establish Slice C visual acceptance.

Chief instruction #45 is preserved: WL-S2 code/content is approved at `3d10e9ad`; browser/visual acceptance for dawn remains pending. Continue WL-S3 one card at a time. Astra review of these repairs and Tester `lens-260` visual acceptance remain reviewer-owned before showcase.

Round-2 local validation: `node test/green-essay-logic.cjs` passes 69 checks; `node test/green-world.cjs` passes 136. All four changed JavaScript files pass `node --check`. The specs remain byte-identical, `SCORING.md` matches its generator, and `git diff --check` passes. These results cover the uncommitted repairs on the exact round-2 base above. No browser or screenshot work, network request, install, commit, push, or service control occurred.
