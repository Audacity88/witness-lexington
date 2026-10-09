# Witness Lexington game design

WL-D1, content review draft, October 9, 2026. Based on [SPEC.md](SPEC.md), which matches `SPEC-lexington-game.md`. Source IDs resolve in [CREDITS.md](CREDITS.md), with historical passages in [SOURCES.md](SOURCES.md). The round-3 citation revision supplies checked public passages for the challenged claims, including differing force estimates and Parker's specific deposition. Defaults and unresolved choices are in [DESIGN_QUESTIONS.md](DESIGN_QUESTIONS.md).

## The game the student plays

The student plays Eli, a fictional 12-year-old Lexington resident, during the night of April 18 and the dawn of April 19, 1775. Eli carries an alarm, helps at the muster, and watches from the edge of the Green. These errands and Eli's relationships are invented. A visible introduction says, "Eli is fictional. Your errands are dramatized. Historical accounts appear in your evidence notebook."

The target audience is ages 10 to 12. The game uses the existing low-poly three.js scene, with readable silhouettes, short dialogue, and a notebook that separates personal observations from documents. A first run targets 20 to 30 minutes, without a countdown. Tasks have visible completion goals and checkpoints. Choices change the student's route, observations, and reasoning. They never change the historical outcome or reveal a canonical first shooter.

The central question is, "Which side do you believe fired first, and why?" A student may favor either account or explain why the evidence leaves them uncertain. The game rewards evidence use and an answer to the opposing account. It does not reward allegiance to a side.

## Scene sequence and learning objectives

Durations are design targets, not historical times. All in-world layouts are simplified reconstructions. The historical date and sequence come from `[SETTING]` and `[NIGHT]`.

| Scene | Playable beats and completion goal | Choices and consequences | Evidence and learning objective |
| --- | --- | --- | --- |
| 0. Opening cutscene, about 25 seconds | Regulars hurry onto the Green. Militia are visible in formation. Cut to black before any identifiable shot, then offer Continue or Skip to rewind. `[SETTING] [FORMATION]` | Skip reaches the same rewind and retains its captions. No shooter selection yet. | Notice how a camera can omit the decisive moment. The cutscene cannot establish who fired first. `[PIVOT]` |
| 1. Rewind and alarm, 4 to 6 minutes | Caption the previous night. At the Clarke parsonage exterior, meet Revere. Eli accepts a fictional alarm errand, rides a borrowed horse along a short marked lane, and alerts two fictional households. Return to a meeting point. `[NIGHT]` | Choose which household to visit first and whether to ask about the report or the route. Both remain reachable. No failed alarm, race score, or alternate escape. | Record who supplied the news and distinguish a reported warning from something Eli saw. The ride is Eli's invented errand, not a reconstruction of Revere's full route. |
| 2. Dawn muster, 4 to 6 minutes | On foot, find Parker near the militia. Carry a dramatized message between two marked groups. Compare hearing an instruction nearby with hearing it farther away. Find the spectator boundary before continuing. `[FORMATION] [COMMAND]` | Choose a nearby or distant listening spot first, then try the other. Ask a fictional militiaman and a fictional townsperson different questions. | Observe formation and the effect of distance on hearing. Record uncertainty about an order rather than infer anyone's intent from it. The historical account of Parker's difficulty being heard is included under `[COMMAND]`; the task and dialogue remain dramatized. |
| 3. The Green, 3 to 4 minutes | Walk to either of two safe spectator spots. Observe the advance companies entering and Pitcairn arriving from behind them. A scripted obstruction blocks the decisive view. Hear one initial report with no directional shooter cue, then firing and a retreat to shelter. `[COMMAND] [PIVOT] [CONTROL]` | Choose a spot behind a house corner or farther along the spectator edge. Either records its actual obstruction. Follow the shelter marker at walking speed, with an assisted movement option. | Compare seeing smoke, hearing a report, and identifying a person. Neither spot, free camera, replay, nor debug view shows the first shooter. Eli's invented view is not Revere's testimony. |
| 4. Evidence room and hypothesis, 5 to 7 minutes | Explicitly leave 1775 for a modern study room. Inspect each of the nine inherited evidence cards individually. Read the two Revere accounts as accounts from one witness, then Barker, Parker's April 25, 1775 deposition, Doolittle, and the four fact cards. Rank two chosen documents by usefulness and explain one limitation. `[R75] [R98] [BARKER] [MILITIA] [DOOLITTLE] [NUMBERS] [FORMATION] [OUTCOME] [CONTROL]` | Select a provisional account, then a shooter, allowed location, and aftermath using the inherited options. Check the hypothesis, revise it, or test the other account. An "I cannot tell yet" choice postpones allegiance and opens hypothesis testing without recording a side as the student's belief. | Compare provenance, date, viewpoint, and medium. Use document reasoning before plausibility. Rank order has no numerical score and no single correct ordering. |
| 5. Essay, 3 to 5 minutes | Write the inherited essay prompt. Check, revise, and return to individual documents without losing the draft. Finish when the inherited evidence, counterargument, and length criteria pass, subject to authorship status below. | Favor regulars, militia, or uncertainty. Revisit a document or the student's own hypothesis to support a revision. | Make an evidence-based claim and address the strongest opposing account. A passing essay does not settle the historical dispute. |

There is no comparison screen that summarizes both versions. The study room presents one source at a time with its citation and limitations. A student's own notebook and last tested hypothesis remain available; no model answer or ready-made counterargument appears.

## Characters and dialogue boundaries

Every line has one of three visible labels: **Dramatized dialogue**, **Document paraphrase**, or **Document excerpt**. Fictional characters also carry a **Fictional character** label. A source tag identifies the historical basis of a paraphrase, not evidence that someone spoke those words in the scene. Document excerpts belong in the modern evidence room, not in an invented 1775 conversation.

The table lists the complete proposed named-character dialogue. Additional dialogue requires a design handoff with the same tags.

| Character and encounter | Proposed words or action | Label and source boundary |
| --- | --- | --- |
| Eli, the player | "Who told you?" / "What could you see?" / "What could you hear?" | Dramatized dialogue. Fictional player choices, not historical quotations. |
| Paul Revere, parsonage exterior at night | "There is news of regulars on the road." | Dramatized dialogue `[NIGHT]`. A warning encounter is plausible context, not a sourced verbatim exchange with Eli. |
| Paul Revere, same encounter | "Ask who saw it before you pass the news on." | Dramatized dialogue. Invented teaching line, not a claim about Revere's historical words. |
| John Parker, dawn muster | "Keep together. Listen for orders." | Dramatized dialogue `[FORMATION] [COMMAND]`. No unsourced famous quotation. The raspy-command context is sourced; this line and its performed volume are dramatized without a comic or medical portrayal. |
| John Pitcairn, Green arrival | "Keep your ranks." | Dramatized dialogue `[COMMAND]`. Eli overhears him from safety. No claim that this was his actual command, and no pistol discharge or admission. |
| Samuel Adams and John Hancock, night background | Leave the parsonage area without dialogue. Eli does not cause, accompany, or prevent their escape. | Historical context `[NIGHT]`; staging, timing, and appearance are dramatized. Exact route and conversation are omitted. |
| Lt. Adair, entering the Green | Advance companies turn onto the Common. No dialogue or close-up identifying a shooter. | Historical movement account `[COMMAND]`, with its passage in `SOURCES.md`; animation is a reconstruction. |
| Lt. John Barker, study room only | The diary attributes the first firing to the militia, with **one or two shots**. | Document paraphrase `[BARKER]`. No invented interview with Barker on the Green. |
| Fictional militiaman, dawn | "I heard part of the order. I could not hear the rest." | Dramatized dialogue, fictional character. A gameplay hearing observation, not a militia deposition. |
| Fictional townsperson, alarm and dawn | "That is what I was told. I did not see the column myself." | Dramatized dialogue, fictional character. Practices identifying secondhand information. |
| Fictional regular, seen on the Green | Follows the advancing group. No attributed testimony or first-shot animation. | Dramatized action, fictional character `[SETTING]`. Barker's diary supplies the British account in the study room. |

Real figures do not endorse a side choice, congratulate a correct first-shooter answer, or disclose private motives. Fictional dialogue never counts as a primary source.

## Captions and violence

The opening contains only these historical captions. Each has a source link or source ID accessible through the notebook:

| Caption | Citation |
| --- | --- |
| "Lexington, Massachusetts. Dawn, April 19, 1775." | `[SETTING]` |
| "The militia stand in parade formation, in plain sight." | `[FORMATION]` |
| "Hundreds of regulars approach the militia. Estimates vary." | `[NUMBERS]` |
| "These accounts do not settle who fired first." | `[PIVOT]`, citing `[R75] [R98] [BARKER] [MILITIA]` |
| "Earlier: the night of April 18, 1775." | `[NIGHT]` |

The pivot caption replaces the seed's universal claim about what every witness saw. Conflicting claims remain visible in their own documents. Revere's obstruction does not prove where every other witness stood.

The player has no weapon, aim control, combat task, health bar, or death state. The opening blacks out before a shot. At the later playable pivot, an obstruction conceals the origin and the camera stays with Eli. Use muted reports, smoke, retreating silhouettes, and a shelter objective. Show no wounds, blood, close-up impacts, or fallen bodies. The outcome card states 8 colonists killed, 10 wounded, and 1 British soldier wounded, in neutral text `[OUTCOME]`. Sound and subtitles remain independently adjustable.

## Evidence collection and hypothesis rules

The notebook separates two kinds of records:

- Personal observations store the scene, chosen spot, obstruction, event, and what Eli could or could not perceive. They are labeled fictional gameplay observations. A message record names its fictional speaker and distinguishes hearing a report from seeing an event.
- Historical evidence keeps the inherited IDs `revere1775`, `revere1798`, `barker`, `depositions`, `doolittle`, `numbers`, `formation`, `outcome`, and `control`. Records include source ID, date or an explicit unknown date, source type, excerpt or paraphrase status, limitation, and whether the student inspected the card.

The `depositions` card is labeled "John Parker's sworn deposition, April 25, 1775; summary" `[MILITIA]`. The numbers card labels 400 versus 80 as the inherited approximate reconstruction and displays the source note before checking a hypothesis `[NUMBERS]`. Willard estimated about 400 approaching regulars and Robins about 1,000; NPS describes about 200 in a detached advance force and 700 in the whole expedition. Cited militia estimates span about 50 to 300, with Barker at the high end, while NPS gives 77. These describe differing observations and force scopes, not verified roster bounds. Keep the tested scoring table unchanged.

All nine historical cards are available on every route. None depends on an early dialogue answer or side preference. The study-room inspection loop makes both accounts accessible before essay writing. The 1798 letter is introduced as later evidence, not an object Eli possesses in 1775. Missing document images carry an explicit "Image unavailable; cited paraphrase" label. An empty scan placeholder does not satisfy document inspection.

Keep `data/evidence.js` as the scoring authority and `SCORING.md` as its generated reference. Preserve all `G`, `R`, and `-` cells and the allowed shooter locations. Red takes priority over green; otherwise a card is grey. Any red fact card rejects a hypothesis. Red testimony remains possible in an accepted hypothesis and needs an explanation. "Accepted" means compatible with the inherited constraints, not historically proven. No vote count, probability, partisan points, or new evidence-weight total replaces that rule.

Store each tested hypothesis as `{side, shooter, location, aftermath}` with its card marks. The `side` value means the account being tested. It is separate from the student's final belief. In the existing essay code, stance `british` means believing British regulars fired first, whereas hypothesis side `british` means Barker's British account. Preserve that mapping explicitly to avoid reversing the counterargument hint.

Hypothesis checking shows the current proposal and individual card explanations. Testing another proposal replaces the displayed proposal without generating a paired recap. Hypothesis tests happen in the study room, not as alternate historical endings. A static scene marker can illustrate the proposed location; it never fires a weapon or reenacts a supposedly established first shot.

## Essay and authorship rules

Reuse `data/essay-rules.js` and the checker in `src/game.js`:

- At least 60 words and at least two distinct reference groups. Multiple details from one card count once. A verified reference to the student's own tested hypothesis counts as one additional group, as in the seed.
- Count historical references only when their card was inspected in this session. Keep existing card IDs and groups, with the content repairs below. WL-S4 requires claim sentences, three distinct sentences of at least five words each, connected reasoning, and repetition checks. Revere credit requires the detail to be attributed to Revere or his document; Eli's fictional observations do not count. The own-hypothesis reference must match a stored choice or actual card color, not just claim the student played.
- Require the opposing account plus language that weighs it. For an uncertain or undetected stance, require both accounts and weighing language. Do not make either account mandatory as the final belief.
- Preserve draft text through document visits. Hints ask for missing evidence or explanation without writing the answer. A first-person observation from the night or dawn notebook may prompt reflection, but does not get a new scoring bonus in this version.

This checker recognizes details and weighing words; it does not establish that the reasoning is sound. Content review and playtests must include a keyword-only answer, an evidence-based answer for each side, and an uncertain answer. Do not describe the local check as human grading.

Block paste and drop, including corresponding `beforeinput` operations, and retain the existing local typing telemetry. Keep `lowRatio = 0.6` and `minCharsForRatio = 80` on the current essay field. WL-S4 blocks Finish after paste/drop attempts, unmatched insertion, low typing ratio, implausible speed, or a typing burst. A flagged draft must be retyped with the visible Retype action; earlier flags remain saved for teacher review. Native single-character input from an on-screen keyboard is supported. Input methods, dictation, and assistive tools can still flag legitimate work. Students should preserve those drafts and seek teacher review outside the game; that accommodation does not unlock the local Finish gate. A blocked attempt does not disqualify a later original typed draft.

The spec requires disqualification of AI-written answers. The seed has `aiSuspected: null` and no authorship detector. This version must not claim to satisfy automatic detection. Confirmed AI or outside authorship disqualifies completion; telemetry alone cannot confirm it. A teacher review is the default way to resolve a disputed authorship case outside the local game. Keep content-check success separate from any confirmed disqualification. A full detector and connected teacher workflow are scope cuts, recorded as a requirement gap in DQ-10.

## Controls, checkpoints, and presentation

| Action | Keyboard and mouse | Touch or pointer alternative |
| --- | --- | --- |
| Move on foot or steer the horse | WASD or arrow keys, clamped to the task area | Tap or click a marked destination for assisted movement |
| Look | Drag within the scene; no required pointer lock | Drag within the scene |
| Interact | E near a marked character or object | Tap or click its labeled interaction button |
| Choose dialogue or inspect a source | Tab and Enter through ordinary buttons | Tap or click |
| Open notebook | N or the Notebook button | Notebook button |
| Close dialogue, pause, or resume | Escape or visible controls | Visible Close and Pause buttons |
| Rank documents | Move up and Move down buttons; drag is optional | Same buttons |
| Write and check essay | Focused text area and Check answer button | Text area with on-screen keyboard and Check answer button |

Disable movement keys while typing or using a dialog. Keep focus inside an open modal, then return it to the initiating control. Captions persist until continued or remain in the notebook. Important sounds have text equivalents. Color marks also display "Fits", "Contradicts", or "Says nothing". Check both 960x540 and 662x418 layouts with large, separate interaction targets.

Save checkpoints at rewind, completed alarm, completed muster, shelter, and study-room entry. Store notebook, inspected IDs, hypotheses, settings, and essay draft locally without sending telemetry anywhere. An explicit Restart clears the run. Storage failure falls back to the current session and explains that refresh will lose progress. Scene replay preserves the notebook but still conceals the pivot.

## Slice plan and acceptance checks

WL-D1 changes design documents only. Later slices resolve Astra content feedback before implementation, without waiting for Dan to select defaults. Code changes and script changes have their respective review handoffs.

| Card | Playable delivery | Smallest useful verification and review artifacts |
| --- | --- | --- |
| WL-S1 | Short opening, honest blackout, rewind, fictional Eli introduction, parsonage encounter, short ride, two household alarms, notebook, checkpoint, and a clear end-of-slice screen. | Walk the real UI through both household orders, skip and full cutscene, pause, assisted movement, and resume. Screenshots of blackout, dramatized dialogue label, ride, notebook, and checkpoint. Resolve all captions and night-source labels in credits. Repair any seed evidence text still reachable in this slice. |
| WL-S2 | Dawn muster, Parker encounter, near and distant listening tasks, spectator boundary, scene transition, and preserved alarm records. | Play from the WL-S1 checkpoint, try both listening orders, verify no route softlock or implied primary testimony, and refresh at muster. Screenshots of both positions, source tags, and notebook observations. Keep the packet's `[COMMAND]` passage and citations attached to displayed details. |
| WL-S3 | Playable Green with obscured pivot, shelter, neutral aftermath, individual evidence room, inherited hypothesis checker, ranking task, essay, local persistence, and restart. | Both spectator positions conceal the origin. Both account presets remain accepted with testimony contradictions; stopped and even aftermaths fail relevant facts. Inspect sources, revise a hypothesis, type passing essays for either side and uncertainty, fail short and unsupported answers, verify uncollected references do not count, exercise paste and drop, and retain drafts across document visits. Capture Green obstruction, shelter, source labels, Doolittle framing, fact rejection, and essay results. |

For every code handoff, run a loopback `python3 -m http.server` or the existing harness without installs. Supply screenshots at both target sizes, real clickflow results, console errors, and missing asset requests to Astra code review. Debug seeking supplements a playthrough; it does not replace one. Tester `lens-260` verifies visually before Workbench inclusion. A design, dialogue, caption, or script change also gets a `kind: design` content handoff.

Before displaying reused content, repair all Barker summaries, essay labels, hints, and fixture essays to **one or two shots**. Doolittle card summaries and every scoring explanation must say the engraving shows how an artist pictured the British firing. Regenerate `SCORING.md` after explanation-only changes. Replace unmarked Revere trims with full sentences or marked ellipses from the checked MHS 1775 and MASSAR 1798 transcriptions. Keep MASSAR `&` consistently for the 1798 letter and preserve its struck-through paragraph flag. Label paraphrases without quotation marks. Do not copy the seed's mixed transcription into new dialogue.

The supplied Tester verdict is not present in this checkout. Public historical references and relevant passages for all challenged claims are included in `SOURCES.md`; no fact relies on the spec or private BrainLift as evidence. Existing script defects remain in seed code. The slice that first exposes each item owns its displayed text repair; completion of this design's citation gate is not deferred to that slice.

## Scope cuts for this version

- One compact Lexington lane, parsonage exterior, Green, and study room. No full Boston-to-Concord map, Concord battle, Revere capture, strategic simulation, or interior parsonage tour.
- No combat, gore, death state, multiplayer, voice acting, period economy, or outcome-changing historical branch.
- No automatic AI detector, cloud grading, remote telemetry, account system, or connected teacher review interface.
- No guessed document scan, recreated facsimile labeled original, unsourced famous quotation, or claim that a hypothesis score proves the first shooter.
- No integration into `Audacity88/witness`, deployment, or change to Dan's services. Reuse local assets and dependencies.

## Content review handoff

- `card: WL-D1`
- `kind: design`
- `branch: wl-d1-game-design`
- `base: 1f0cc3f33c566b6e1819c60083be204265cfe84d`
- `stack-base: ec279d5424a9be677ff102c3f68806475035c70e`
- `review: GAME_DESIGN.md, DESIGN_QUESTIONS.md, CREDITS.md, SOURCES.md`
- `commit: wrapper supplies the resulting commit SHA; implementer leaves changes uncommitted`

Astra checks historical sourcing, visible dramatization labels, fair treatment of contested accounts, violence, each scene's learning objective, collected evidence in the essay, and the DQ-10 authorship gap. The source register distinguishes checked public passages from unchecked underlying books. This is a content-review packet, not a claim that playable slices or their visual review are complete.

Round-3 response to the blocking finding at `1f0cc3f33c56`: `[NIGHT]` now uses accessible museum passages; `[NUMBERS]` includes Willard's approximate 400 estimate and differing NPS force scopes; `[FORMATION]`, `[COMMAND]`, `[OUTCOME]`, and `[CONTROL]` have accessible historical passages and locators. `[MILITIA]` identifies Parker's April 25, 1775 deposition, document No. 4, National Archives identifier 595246, with its checked DocsTeach transcript. No challenged citation is deferred to a playable slice.

WL-D1 verification: 16 local Markdown links and anchors resolve; all 13 design source IDs resolve in credits; all 17 choice rows contain options, defaults, and rationales. Eight selected quotations match their chosen public source readbacks, and four Gutenberg page anchors were checked. Proposed Barker wording retains one or two shots. Both specs match byte-for-byte; seed evidence, essay rules, game code, and scoring are unchanged from the reviewed head. `SCORING.md` matches `node tools/scoring-md.mjs`; `git diff --check` passes. A fresh `python3 -m http.server` on an ephemeral loopback port served the index and all four design documents with HTTP 200 and matching bytes; the earlier sandbox bind limitation no longer applies. No gameplay, screenshot review, or Astra approval is implied by these document and source checks.
