# Witness Lexington (private)

Private Lexington Green game for Witness. The kid plays a fictional character through the night ride, dawn muster, and the Green; collects evidence; then writes a short essay.

**Integrates into [Audacity88/witness](https://github.com/Audacity88/witness) later.** Do **not** change that repo from this project.

## Spec and process

- `SPEC.md` (also `SPEC-lexington-game.md`) — product direction
- `GAME_DESIGN.md` — Sol writes this first (card WL-D1); Astra content-reviews it
- `DESIGN_QUESTIONS.md` — open choices with defaults; Dan decides at the end (no mid-build gates)
- Build slices: (a) cutscene + rewind + night ride, (b) dawn muster, (c) Green + evidence room + essay

## Seed assets

- v1 game (evidence data, scoring, essay rules, paste blocking, debug hook, three.js) at repo root
- `vendor/witness-v21-scene.js` — Workbench Forge v2.1 Lexington 3D scene (starting geometry)

## Run (v1 seed)

```bash
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

## Pipeline

Workbench doc **Witness Lexington** (separate from Eyrie). Implementer: Codex Sol (`gpt-6.1-sol`). Code review: Astra (`gpt-6-astra`). Content review: second Astra role on design/script handoffs only. Playtest screenshots go to the code reviewer. Tester (lens-260) verifies visually before Workbench showcase.
