# WL-TESTFAIL handoff

kind: code
card: WL-TESTFAIL
branch: wl-testfail
tested-head: 05f903b49f23220d8cfa3cb0a15ceef2411941c3 plus uncommitted changes
required-base: main at 05f903b49f23220d8cfa3cb0a15ceef2411941c3
status: ready

## Changes

- `test/verify.mjs` rejects empty reports, runs with no checks, recorded failures, browser errors, external requests, and layout problems.
- `test/run.mjs` requires explicit expectations, records executed checks, verifies the report, and closes the browser even when navigation or screenshots throw.
- `test/night-ride.mjs`, `test/dawn-muster.mjs`, `test/green-essay.mjs`, and `test/ui-shots.mjs` use the same report verifier.
- `test/run-all.sh` stops on the first failed command and preserves its non-zero status.
- `test/verify-self-test.mjs` runs the actual driver against a browser double in child processes. A deliberately false expectation must exit 1; the parent treats that failure as success. Other cases cover page and console errors, requests, step exceptions, empty runs, zero checks, layout failures, browser cleanup, and matrix propagation.
- `package.json` runs the self-test before the existing Node tests. No design, dialogue, historical content, scoring, or game code changes.

## Validation

Execution host: Dan's Mac. Working directory: `/Users/dan/witness-lexington-codex-wt/wl-testfail`.

- `npm test`: exit 0. Verification self-test: 17 checks. Existing tests: music 58, essay logic 112, Green world 136, distribution 13. Total: 336 checks.
- `node --check` on all seven changed or added `.mjs` files: passed.
- `bash -n test/run-all.sh` and `git diff HEAD --check`: passed.
- Full Node output: `/private/tmp/wl-testfail-node-tests.log`.
- `SPEC.md` and `SPEC-lexington-game.md` match. No spec update needed.

## Wrapper and reviewer follow-up

The prior changes were already restored on the approved main base when this task resumed. No unresolved conflicts remain. The updated music and color-scheme behavior in `test/ui-shots.mjs` is preserved. Changes remain uncommitted for the wrapper to commit and push only `wl-testfail`. No merge, commit, push, stash operation, or network access was performed by the implementer.

Astra code review and browser screenshots remain pending. Per `WORK_INSTRUCTIONS.md`, the implementer did not launch a browser. The self-test uses only a browser double and is not visual acceptance.

For reviewer screenshots, serve this checkout with `python3 -m http.server 8765 --bind 127.0.0.1`, then run `node test/ui-shots.mjs http://127.0.0.1:8765/index.html /tmp/wl-testfail-review`. These browser commands were not run by the implementer.
