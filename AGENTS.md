# Witness Lexington agent instructions

Read [WORK_INSTRUCTIONS.md](WORK_INSTRUCTIONS.md) for the standing rules and card-specific requirements before starting work.
Read [SPEC.md](SPEC.md) for the product and historical fidelity requirements.
Follow the current card's scope. Current task instructions and the standing validation rules supersede the older WL-D1 push-and-post directions.

- Work only in the private `Audacity88/witness-lexington` repo. Do not touch `Audacity88/witness`.
- Never put secrets in the repo or the Workbench doc. Keep network access off.
- Reuse v1 evidence, scoring, and essay rules where possible. The overall game structure follows the new spec.
- Record every open design choice in `DESIGN_QUESTIONS.md`, including the question, options, default chosen, and why.
- Once design review resolves, proceed to the slices without another Dan sign-off gate. WL-S1 ends at the alarm checkpoint. Dawn belongs to WL-S2.
- Run the existing non-browser tests with `npm test`. Do not launch a browser, take screenshots, or run `test/ui-shots.mjs`.
- Reviewers own headless browser playtests and screenshots outside the implementer's sandbox. Pending browser acceptance does not block handoff.
- Leave changes uncommitted for the wrapper. Do not commit or push.
- When the scoped work and non-browser tests are complete, finish with `SUMMARY:` and `STATUS: ready`. Include changed files, test commands and results, and anything unverified.
