# Witness: Lexington — game spec (v2 direction, Oct 9 2026)

Owner: Dan Gilles. Director: Work. Pipeline: Commander's Workbench worker (Sol builds, Astra reviews).

## What Dan wants
- A real game, not a cutscene plus a short replay. The kid is a character inside April 18–19, 1775.
- The game opens with a short cutscene (soldiers rushing onto Lexington Green, cut to black before the shot), then rewinds and plays the whole day forward: the night ride and alarm, the dawn muster, the Green.
- The kid plays a fictional character, not a named historical figure, who meets and talks with historical characters (e.g. Revere, Parker, Pitcairn, militiamen, townspeople, regulars). Real figures say and do only what the sources support, or what is plausible and clearly framed as dramatized.
- Low-poly, Minecraft-ish 3D look (three.js, like the existing v2.1 demo). Kid-friendly (ages ~10–12), and violence handled age-appropriately.
- Core idea: "pick your side." The first shot stays genuinely unresolved, because no witness saw who fired first. Through the day the kid collects evidence (testimony, what they saw or heard and from where), and the experience softly encourages seeing both sides.
- End: an evidence room with the real documents, then a short essay on which side fired first and why. It passes only if it cites specific evidence from the game and addresses the other side. No side-by-side recap of versions, since that could be used to cheat.
- Anti-AI: AI-written answers must be disqualified. v1 measures: block paste and drop, keep typing telemetry, and reward references to the kid's own in-game experiences that an AI can't know. A full detector comes later.

## Sources and facts (use only these unless a new source is added and cited)
- Revere deposition 1775 (MHS item 98): "one gun was fired, I heard the report, turned my head, and saw the smoake in front of the Troops"; "I could not see our Militia, for they were covered from me, by a house at the bottom of the Street."
- Revere letter to Belknap 1798 (MHS item 99): "I saw, & heard, a Gun fired, which appeared to be a Pistol. Then I could distinguish two Guns, & then a Continual roar of Musquetry." This is a later account by the same witness, not independent confirmation.
- Lt. John Barker's diary: the published diary says the militia "fired one or two shots" first (NPS Teaching with Historic Places article on Lexington and Concord). Never write "two shots".
- Militia depositions 1775 (A Narrative of the Excursion…): the regulars fired first.
- Doolittle engraving 1775 (Yale object 2482, CC0): shows the British firing. It shows how an artist pictured the event.
- About 400 regulars vs about 80 militia, plus 40–100 spectators. The militia stood in parade formation in plain sight. Lt. Adair turned the advance companies onto the Common; Pitcairn arrived from the rear. Parker's raspy voice meant some men didn't hear orders. The regulars' bayonet charge went beyond their officers' control. 8 colonists killed and 10 wounded (Prince Estabrook among the wounded); 1 British soldier wounded.
- Night context per Dan's Lexington BrainLift (Nessie 8a08eed3; work-ops repo Witness/brainlifts/lexington-witness-episode/): Revere's ride, the Clarke parsonage, Adams and Hancock's escape. Design rules: the camera honestly fails at the pivot; students rank evidence rather than guess; plausibility reasoning must lose to document reasoning.

## Fidelity rules (from Tester's v1 check)
- Every fact card, caption and source label needs a citation in CREDITS/SOURCES.md, including the cutscene captions and the MHS item labels.
- Quote primary sources in full sentences, or mark trims with an ellipsis (e.g. Revere 1775 begins "Then…" and "…at this time"). Pick one transcription per document and cite it. For Revere 1798, choose either MHS (masshist.org, "and") or the massar.org transcription ("&"), and use it consistently.
- Known v1 bugs to fix while reusing: the Barker text overstates the source ("two shots" should be "one or two shots"), and the Doolittle card repeats "It shows the British firing."
- Tester evidence: /workspace/witness-game-verify/ (verdict.txt, results_345.json).

## Existing assets
- /workspace/workbench-forge/src/witness.js: v2.1 3D demo with buildLexington() (militia, column, meetinghouse, mounted officer). three.js r186 bundle in dist/.
- /workspace/witness-game/: "Witness the First Shot" v1 (cutscene, side pick, reenact/replay, evidence cards, evidence room, essay check with hints, paste blocking, telemetry, debug hook window.WitnessGame). Reuse its evidence data, scoring and essay rules as parts; the overall structure is being replaced.

## Process
1. Card 1: Sol writes GAME_DESIGN.md. Cover the day's structure and beats; the player character; the historical characters you meet, where, and what they can say (with a source tag per line or a "dramatized" tag); the choice points; how evidence is collected and how it feeds the side pick and the essay; the learning objective per scene; the controls; slice plan; and scope cuts for v1.
2. Astra design review with the content rubric: historical accuracy with sources; no invented words or acts for real figures beyond what's clearly framed; contested evidence presented fairly; age-appropriate violence; every scene tied to a learning objective; the essay uses evidence the kid collected.
3. NO Dan sign-off gates (Dan may be away for hours). Once Astra's design review is resolved, proceed straight to build cards. Record every open design choice in DESIGN_QUESTIONS.md (the question, the options, what was chosen as the default and why) for Dan to decide at the end.
4. Build in vertical, playable slices: (a) cutscene, rewind, night ride; (b) dawn muster; (c) the Green, evidence room and essay. Each push gets Astra code review plus a headless playtest with screenshots and console errors passed to the reviewer. Tester (lens-260) verifies each slice visually before anything goes into Workbench.
