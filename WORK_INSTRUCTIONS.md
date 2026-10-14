# Work instructions (Witness Lexington)

## Card WL-D1 — Write GAME_DESIGN.md

Read `SPEC.md`. Write `GAME_DESIGN.md` covering:

1. Day structure and beats (cutscene → rewind → night ride → dawn → Green → evidence → essay)
2. Player character (fictional; not a named historical figure)
3. Historical characters met, where, and what they can say (source tag per line, or clearly marked dramatized)
4. Choice points
5. How evidence is collected and how it feeds side-pick and essay
6. Learning objective per scene
7. Controls
8. Slice plan matching WL-S1 / WL-S2 / WL-S3
9. Scope cuts for v1

Log every open design choice in `DESIGN_QUESTIONS.md` (question / options / default / why).

When ready for content review: push the branch, post a handoff in the Witness Lexington Workbench chat with `ready for review`, the commit sha, and `@dans-codex-guest` (or the content-reviewer alias). Include `base: <sha>` of the parent commit.

## Rules

- Private repo only. Do not touch Audacity88/witness.
- No secrets in the repo or Workbench doc.
- No Dan sign-off gates after design review resolves — proceed to slices.
- Reuse v1 evidence/scoring/essay where possible; overall structure is the new game.

## Playable slice validation ownership

Chief/reviewer instruction #26, confirmed by Dan: headless browser playtests and screenshots run reviewer-side outside the implementer's sandbox after handoff. The implementer must not launch a browser or take screenshots. When the slice code and non-browser tests are complete, finish with `STATUS: ready`; pending reviewer browser checks do not block the implementer handoff. Include files, wrapper test commands, and anything not verified in the SUMMARY. Network stays off. Leave changes uncommitted for the wrapper; do not commit or push. WL-S1 ends at the alarm checkpoint; dawn stays for WL-S2.

WL-MUSIC2 Round 4 clarification, confirmed by Dan and chief/reviewer notes #180 and #182: the in-sandbox browser acceptance requirement is dropped. Browser playtests, screenshots, and `test/ui-shots.mjs` run in review/Tester after handoff. The implementer must not launch a browser or run browser checks. Preserve the current uncommitted work and finish with `STATUS: ready` once code and non-browser tests are complete; pending reviewer browser acceptance does not block the handoff. Do not commit or push.
