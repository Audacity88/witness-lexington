# Design questions (Witness Lexington)

Every open design choice goes here while we build. Dan may be away for hours; there are **no mid-build sign-off gates**. After Astra's design review of `GAME_DESIGN.md` resolves, build proceeds in playable slices. Dan decides these questions at the end (or whenever he returns).

## How to log a choice

Add a row (or a short section) with:

| Field | Meaning |
| --- | --- |
| Question | What we need to decide |
| Options | The realistic alternatives |
| Default chosen | What we are shipping with for now |
| Why | One or two sentences |

Do not block a slice on unanswered questions. Prefer a reversible default and note it here.

## Open questions

These defaults belong to WL-D1. They remain open for Dan and do not create mid-build sign-off gates.

| ID | Question | Options | Default chosen | Why |
| --- | --- | --- | --- | --- |
| DQ-01 | Who is the fictional player? | Named local child; unnamed child; fictional adult messenger | Eli, a 12-year-old local child, with no invented historical family connection | Fits the audience and makes personal observations distinct from named witnesses. Name and presentation remain reversible. |
| DQ-02 | How much of the night ride is playable? | Full historical route; compact fictional errand; on-foot alarm only | A short horse ride between two fictional households after meeting Revere | Provides a real movement task without assigning Revere's historical actions to the player. |
| DQ-03 | How freely can the player move? | Unrestricted first-person exploration; bounded movement; point-and-click only | Bounded movement with optional tap or click destinations | Keeps the ride and muster playable while preventing a camera angle that falsely solves the pivot. |
| DQ-04 | What can the Green reveal? | Identify a shooter; black out the whole event; obstruct the initial report then show retreat | Two spectator spots, both with an obstruction and no directional first-shot cue | Preserves uncertainty without removing the student's observation task. |
| DQ-05 | What wording replaces the universal first-shot caption? | Keep the seed caption; qualify it to the supplied accounts | "These accounts do not settle who fired first." | Avoids a claim about every witness while preserving the spec's unresolved question. |
| DQ-06 | When does the student pick a side? | Before the night; after the Green; after inspecting documents | A provisional choice in the study room, with an uncertainty option and a revisable final belief | Reduces early commitment and lets the inherited checker test accounts separately from belief. |
| DQ-07 | Must students reenact both versions? | Require both animated versions; offer hypothesis checks; compare versions in a recap | Inspect both accounts, offer hypothesis checks without alternative first-shot animation | Fits the new full-day structure and avoids a recap students can copy into the essay. |
| DQ-08 | Which Revere transcription is authoritative? | MHS for both documents; MHS 1775 plus massar.org 1798 | MHS items 98 and 99, using `and` for 1798 | Makes the source labels and text consistent. Full text is absent locally; use cited paraphrases until that transcription can be checked. |
| DQ-09 | How does an invented experience count toward the essay? | New experience score; inherited own-hypothesis reference; required scene-detail rubric | Retain the inherited own-hypothesis reference, count only inspected historical cards, offer scene details as reflection prompts | Preserves the tested 60-word and two-reference rules without equating fictional dialogue with a primary source. |
| DQ-10 | How can AI-written answers be disqualified? | Treat telemetry as proof; add a detector now; separate content checks from confirmed authorship | Block paste and drop, retain flags, disqualify confirmed outside authorship through teacher review outside the game | The seed cannot detect AI authorship. Automatic disqualification remains an unmet requirement; no reliable detector or teacher integration is present. Accessibility input must not become false proof. |
| DQ-11 | How much source material can ship without scans? | Wait for all scans; invent facsimiles; provide cited text and honest image status | Individual cited excerpts or paraphrases, with unavailable images labeled | Keeps evidence usable without presenting placeholders as documents. Source text and metadata still need review. |
| DQ-12 | How are incomplete historical citations handled? | Treat the brief as independently verified; invent citations; distinguish brief-supported detail from checked primary text | Cite the supplied spec and named source, expose verification status in credits, verify before a slice promotes a detail to a sourced quotation or fact caption | The BrainLift and Tester artifacts are absent and network is off. Core design can be reviewed locally without inventing provenance. |
| DQ-13 | How much named-character dialogue is appropriate? | Only documents; extensive conversations; short tagged exchanges | Brief visibly dramatized Revere, Parker, and Pitcairn lines; silent Adams, Hancock, and Adair actions | Gives encounters a purpose without fabricating historical statements. Barker appears only through his diary. |
| DQ-14 | How long is a run and where does it save? | One unsaved sitting; timed missions; untimed scenes with local checkpoints | Target 20 to 30 minutes, local scene checkpoints and an essay draft | Supports classroom interruptions without a timer or new online service. |
| DQ-15 | Does evidence ranking affect completion? | Numerical weights; one canonical order; unscored comparison task | Rank two documents and note one limitation; do not alter inherited hypothesis or essay scores | Teaches source judgment without a competing scoring system or an official winning account. |
| DQ-16 | How strict is automated essay evaluation? | Existing patterns; new semantic grader; manual grading only | Reuse the pattern checker with inspected-card filtering and report it as a local content check | Small enough for this version. Keyword-only reasoning can still pass, so sound reasoning and authorship remain review limitations. |
