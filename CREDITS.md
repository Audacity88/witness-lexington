# Credits & licenses — Witness the First Shot

## Amos Doolittle, *The Battle of Lexington, April 19, 1775. Plate I* (1775)

- Artist / engraver: Amos Doolittle (American, 1754–1832).
- Source institution: Yale University Art Gallery, accession 1920.25a–d (Plate I is canvas 1 of that set). Object record: https://artgallery.yale.edu/collections/objects/2482
- Image fetched at build time from Yale's IIIF: `https://images.collections.yale.edu/iiif/2/yuag:8f8444c1-483c-4a4a-b05e-b1cf2f03eb39/full/,1100/0/default.jpg` (manifest: https://manifests.collections.yale.edu/yuag/obj/2482).
- Rights (per Yale IIIF manifest): Public Domain; Creative Commons Zero (CC0 1.0) — `https://creativecommons.org/publicdomain/zero/1.0/`. Yale also notes: "Data Provided about Yale University Art Gallery collections are public domain. Rights restrictions may apply to cultural works or images of those works." (the work itself is 1775 U.S. public domain).
- Local files: `assets/doolittle-plate1.webp` (1000 px wide, used by the game and inlined in the bundle), `assets/doolittle-plate1.jpg` (1406 px original download).

## Historical source register for WL-D1

Source IDs below cover every historical card, proposed caption, document label, and named-character context in `GAME_DESIGN.md`. Fictional observations and dialogue are explicitly tagged there. A citation to the supplied spec records the design's basis; it does not claim independent verification of the named document.

This checkout contains the spec, inherited excerpts, and Doolittle images. It does not contain complete source transcriptions, the Lexington BrainLift, or the supplied Tester verdict. Network was not used for WL-D1. External links identify records; their contents and availability were not checked in this card.

| ID | Document or source | Covered labels and claims | Text policy and verification status |
| --- | --- | --- | --- |
| `[R75]` | Paul Revere, deposition, 1775. Massachusetts Historical Society [item 98](https://www.masshist.org/database/98). Supplied excerpts in `SPEC.md`, Sources and facts. | `revere1775`; MHS item 98 label; smoke in front of troops and the house obstructing Revere's militia view | Choose the MHS transcription. Design uses paraphrases. Full sentences or explicitly marked trims are required before displaying quotes. Full transcription is absent locally. |
| `[R98]` | Paul Revere, letter to Jeremy Belknap, 1798. Massachusetts Historical Society [item 99](https://www.masshist.org/database/99). Supplied account in `SPEC.md`, Sources and facts and Fidelity rules. | `revere1798`; MHS item 99 label; apparent pistol and subsequent firing; later account by the same witness | Choose MHS wording with `and`, not the seed's mixed ampersand excerpt. Design uses paraphrases until checked. This is not independent confirmation of `[R75]`. |
| `[BARKER]` | Lt. John Barker's diary, as quoted in the National Park Service, *The Battles of Lexington and Concord*, Teaching with Historic Places article. Citation supplied by `SPEC.md`, Sources and facts. | `barker`; diary label; attribution of first firing to the militia | Cited paraphrase: Barker says the militia fired **one or two shots** first. No narrower count. The NPS citation is supplied by the brief; the 1924 Dana edition was not independently checked. |
| `[MILITIA]` | Militia depositions, 1775, in *A Narrative of the Excursion...*. Source title and summary supplied by `SPEC.md`, Sources and facts. | `depositions`; militia deposition label; claim that regulars fired first | Summary, not a verbatim quotation. Specific deposition pages, signatories, and a full transcription are not in this checkout. Do not invent witness identities or label a summary as the full document. |
| `[DOOLITTLE]` | Amos Doolittle, *The Battle of Lexington, April 19, 1775. Plate I*. Yale University Art Gallery [object 2482](https://artgallery.yale.edu/collections/objects/2482), accession 1920.25a-d. Image and rights citation above. | `doolittle`; image title, Yale accession, CC0 label, captions, and scoring explanations | Shows how an artist pictured the British firing. The image is not proof of the first shooter. Local images are present; collection metadata and rights are inherited, not re-fetched. |
| `[SETTING]` | `SPEC.md`, What Dan wants and Sources and facts; `[DOOLITTLE]` supplies the event title and date | Lexington, Massachusetts, dawn on April 19, 1775; regulars and militia on the Green | Historical setting supplied by the brief. Camera, model placement, and simplified map are reconstructions. |
| `[NIGHT]` | `SPEC.md`, Night context per Dan's Lexington BrainLift, Nessie `8a08eed3`, `Witness/brainlifts/lexington-witness-episode/` in work-ops | April 18 night rewind; Revere's warning and ride; Clarke parsonage; Adams and Hancock's escape | Brief-supported context. The BrainLift itself is absent locally. Eli's route, horse, errands, and exchanges are dramatized. Do not add historical route or timing specifics from memory. |
| `[NUMBERS]` | `SPEC.md`, Sources and facts, paragraph beginning "About 400 regulars" | `numbers`; about 400 regulars and about 80 militia; any spectator-count caption | Brief-supported figures, not a headcount from the low-poly scene. The brief also gives 40 to 100 spectators; design does not display that optional figure. Independent supporting citation remains to be checked. |
| `[FORMATION]` | `SPEC.md`, Sources and facts, same paragraph | `formation`; parade formation in plain sight; opening and muster captions | Brief-supported fact. A reconstruction's exact spacing does not establish a historical measurement. |
| `[COMMAND]` | `SPEC.md`, Sources and facts, same paragraph | Adair's turn onto the Common; Pitcairn's arrival from the rear; Parker's raspy voice and some men not hearing orders | Brief-supported detail. Exact words, volume, locations, and timing in scenes are dramatized. Primary support is not present locally. |
| `[OUTCOME]` | `SPEC.md`, Sources and facts, same paragraph | `outcome`; 8 colonists killed, 10 wounded, and 1 British soldier wounded | Neutral brief-supported summary. Prince Estabrook is named among the wounded in the spec but is not depicted in this design. Independent supporting citation remains to be checked. |
| `[CONTROL]` | `SPEC.md`, Sources and facts, same paragraph | `control`; regulars' charge exceeding officers' control | Brief-supported summary. Gameplay does not imply a proven officer motive or first-shot command. |
| `[PIVOT]` | Compare `[R75]`, `[R98]`, `[BARKER]`, and `[MILITIA]`; `SPEC.md`, What Dan wants and Night context | Unresolved-first-shot caption; reason the camera conceals the pivot | Editorial synthesis of conflicting accounts and their limits. Does not assert that no person could have seen a first shooter. |

Use a source ID and an accessible citation for every displayed fact, caption, and source label, including cutscene text. Keep the full reference here, with a short source label in the notebook. Before a playable slice exposes a quotation, verify its chosen transcription and preserve full sentences or mark omissions with ellipses. Where only the supplied brief is available, identify that basis rather than claiming a checked primary document. DQ-08, DQ-11, and DQ-12 track the remaining source choices and gaps.

## Seed content repairs for playable slices

WL-D1 corrects this register and defines the replacement content; it does not alter game code. Before reuse, fix Barker summaries in `data/evidence.js`, its essay-reference label in `data/essay-rules.js`, and any fixture essays to **one or two shots**. Apply the artist framing to every Doolittle summary and scoring explanation, then regenerate `SCORING.md`. Revere excerpts must follow the single MHS transcription policy above. The seed currently retains these defects and must not be treated as source-verified content.

## Code & scene

- Lexington Green low-poly scene and globe transition adapted from `workbench-forge` Witness History v2.1 (`buildLexington` + geographic transition).
- three.js r186 + OrbitControls, bundled locally (no CDN).
- Coastline data: Natural Earth 1:50m land (public domain).
