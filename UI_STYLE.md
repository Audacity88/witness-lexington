# Witness Lexington UI style

Art direction for the 2D interface: overlays, dialogs, HUD, notebook, evidence room, essay, and the in-scene labels and stop markers. The 3D scene (terrain, buildings, figures, lighting) is out of scope and stays as it is.

## Direction in one paragraph

A colonial broadside printed for a strategy game. We keep the bones of Flying Colors: thick ink borders, hard offset shadows with no blur, crisp blocky panels, and bold uppercase buttons on solid red or navy. Then we age them. Panels are parchment, borders are iron-gall ink, primary buttons are wax-seal red, secondary emphasis is regimental navy, and type comes from the Caslon and Fell foundries that printed the colonies' own papers. Classic Civilization and Colonization screens are the reference for framing: a heavy outer rule, a fine inner rule, engraved-map cartouches for place names, and a ledger-like order to every screen. The result should read as "printed in 1775, built for a game," never as a museum label or a web form.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#F3E9D2` | Parchment panels and cards |
| `--paper-hi` | `#FBF5E6` | Inputs, secondary buttons, document slips, button text on wax and navy |
| `--paper-lo` | `#E6D6B3` | Action footers, aged edges, disabled fills |
| `--paper-deep` | `#C9AE7C` | Rules, foxing, ledger pips not yet filled |
| `--ink` | `#241B12` | Iron-gall ink: body text, every border, every hard shadow |
| `--ink-soft` | `#5A4630` | Secondary text and notes |
| `--wax` | `#A8322A` | Primary buttons, unvisited stop seals, title accent |
| `--wax-deep` | `#7E2219` | Rubric text: source tags such as `[NIGHT]`, dramatization labels, links |
| `--navy` | `#26305F` | Regimental navy: Notebook button, headings accent, notebook ruling |
| `--brass` | `#D6A541` | Gold leaf: focus ring on dark grounds, small ornaments |
| `--fits` | `#2F5E36` | Verdict rule for "Fits" (always paired with the word) |
| `--desk` | `#3B2616` | Walnut desk behind the modern evidence room |

These are the Flying Colors red (`#C0392B`), navy (`#2E2F6B`), and off-white (`#F7F5F8`) pushed toward sealing wax, dyed wool, and rag paper.

Measured contrast (WCAG 2.1): ink on paper 14.0:1, ink-soft on paper-lo 6.2:1, wax-deep on paper 8.2:1, paper-hi on wax 6.1:1, paper-hi on navy 11.6:1, fits on paper 6.3:1, and paper-lo on the black blackout 14.6:1. Every text pairing listed here passes AA for body text. Colour never carries meaning alone. Verdicts say "Fits" or "Contradicts", visited stop seals also change shape, and ledger pips mirror the written "Inspected n/9" count.

Dark and light colour schemes share this one parchment look. `.wl` sets `color-scheme: light` so native controls match.

## Type

All fonts are bundled under `assets/fonts/` as Latin subsets in WOFF2 format, licensed under the SIL Open Font License (`assets/fonts/OFL-*.txt`). There are no web-font requests.

| Role | Face | Size (normal / short screens of 450px tall or less) |
| --- | --- | --- |
| Display: titles, headings, speaker names, place labels, brand | IM Fell English SC (Fell types, cut 1670s and revived by Igino Marini) | h1 30px / 23px, h2 22px / 19px, h3 18px |
| Body | Libre Caslon Text Regular. Caslon set the colonial press and the Declaration's broadsides. | 16px / 14px, line-height 1.45 |
| Buttons and strong text | Libre Caslon Text Bold, uppercase, letter-spacing 0.05em | 14px at every size |
| Labels and captions | Libre Caslon Text Italic, used for dramatization labels, chapter subtitle, captions, notes | 15px / 14px |
| Rubric | Libre Caslon Text Bold in `--wax-deep`, used for source tags | at least 14px |

Rules:

- Body copy is never below 14px. Nothing in the UI is set below 14px.
- IM Fell is display only. It is never used for running text or for document quotations, because its rough texture hurts readability at body sizes for 10 to 12 year olds.
- Source tags such as `[NIGHT]` and `[COMMAND]` stay inline in the same sentence as the text, but render as rubric spans (class `src`), the way an almanac prints references in red.
- Never add quotation marks to dramatized speech. These lines are explicitly not quotations.

## Textures

All textures are CSS. They are inline SVG data URIs or gradients, so they cost no requests and only a few hundred bytes.

- **Paper grain.** An SVG `feTurbulence` fractal-noise tile is mapped to translucent brown speckle through `feColorMatrix`. It tiles at 240px.
- **Aged edges.** An elliptical radial gradient darkens panel edges toward umber, and two faint radial "foxing" spots sit in the corners.
- **Notebook ruling.** Each notebook paragraph carries its own repeating linear gradient, with a navy rule just under every baseline, so the rules stay aligned to the text even after headings and spacing. A red margin line runs 38px from the left edge of the page.
- **Walnut desk.** The evidence room backdrop stacks a stretched turbulence grain, fine vertical streaks, and a warm lamp pool over `--desk`. It marks the room as a modern place outside 1775.
- **Scrims.** Overlays over the 3D scene use a warm ink scrim with a vignette instead of a cold navy wash.

## Shared frame: the broadside panel

Every surface the student reads uses one frame:

- A parchment fill with grain and aged edges.
- A 3px `--ink` outer border with square corners and a radius of 2px at most.
- A fine inner rule inset 5px, drawn as an inset box-shadow.
- A hard offset shadow of 6px 6px with no blur, in `rgba(20,14,8,.88)`. Small controls use 4px.

## Components

### Buttons

- All buttons are at least 44px tall and 44px wide, with a 3px ink border, a 4px hard ink shadow, bold uppercase Caslon at 14px, and square corners.
- **Primary (wax).** `--wax` fill, `--paper-hi` text. Use it for the one action that advances the story.
- **Secondary (parchment).** `--paper-hi` fill, ink text.
- **Navy.** Reserved for the HUD Notebook button, so the notebook is always findable.
- **States.** On hover the button lifts 1px and the shadow grows to 5px. On press it sinks 3px and the shadow drops to 1px. Disabled buttons get a dashed border, no shadow, a `--paper-lo` fill, and `--ink-soft` text.
- **Focus.** A 3px solid ink outline at a 3px offset on parchment, or `--brass` on dark grounds (the blackout and the desk).
- **Reply and waypoint buttons.** Dialogue replies and "Walk to" or "Ride to" buttons are secondary buttons with a small red lozenge before the label. That is a printer's ornament, not an icon font.

### HUD

- **Top left: a brand cartouche.** A small broadside panel with "Witness Lexington" in IM Fell SC at 19px and the chapter line in Caslon italic at 14px beneath it.
- **Top right:** Notebook (navy) and Pause (parchment) buttons with hard shadows.
- The HUD never covers the bottom strip and never scrolls.

### Captions, objectives, and subtitles: the bottom strip

- A broadside panel docked to the bottom, at most 1080px wide and centred, with at most 48% of the height.
- The objective sentence is first. Then the primary interaction button (wax) and its status text in italic, then waypoint buttons that scroll when they overflow, then the save notice in italic.
- The primary interaction button is never pushed off-screen, and only the waypoint row scrolls.
- **Caption mode** applies to the opening cutscene and the Green observation. It is a narrower centred strip with the caption in Caslon italic at 19px (16px on short screens) and source tags as rubric. "Skip to rewind" or "Move to shelter" sits on the right. It reads like the caption beneath an engraving.

### Overlay cards: story beats, checkpoints, and pause

- A centred broadside panel 640px wide at most. The kicker sits above the title as italic rubric after a hairline rule, the title in IM Fell SC, then the body.
- Every card is split into a scrolling body and a fixed action footer (`.card-scroll` and `.card-actions`). That keeps the primary action visible without scrolling at 662x418, 960x540, and 1280x720. The footer is a `--paper-lo` band under a double ink rule.

### Intro and title

- A broadside poster over a warm scrim on the live opening scene.
- A wax-seal medallion reading 1775, then "Witness" as a small letter-spaced navy kicker and "Lexington" large in wax red with a 2px hard ink offset. This is the Flying Colors title, set in Fell.
- An ornamental rule (lozenge, hairlines, lozenge) separates the title from the body.
- "Begin the opening" is the wax primary button.

### Blackout

- Pure black is kept, because the cut to black carries meaning.
- The card has no fill, a parchment double hairline frame, the title in IM Fell SC in `--paper`, and body text in `--paper-lo`.
- Buttons swap ink borders and shadows for parchment ones so they stay visible on black. Focus uses brass.

### Dialog boxes: conversations

- A letter sheet: the broadside panel up to 560px wide.
- The header has a wax-seal medallion with the speaker's initial, then the speaker's name in IM Fell SC at 26px over a double rule.
- The dramatization label ("Dramatized dialogue…") is italic rubric directly under the name, so the label is read before the line.
- The spoken line is set at 18px, unquoted. Context and fiction notes are 15px in `--ink-soft`.
- Reply buttons stay inline next to their answers. The dialog's primary action moves into a sticky footer beside Close, so it is never below the fold.

### 3D place labels: cartouches

- Canvas sprites drawn as engraved-map cartouches: a parchment ticket with concave corners, a 5px ink border, a fine inner rule, a hard ink shadow, red lozenges either side of the name, and a small pointer that drops to the marker below.
- The name is set in IM Fell SC. Text after a " · " separator, such as "fictional" or "reconstruction", goes on a second line in rubric italic. The text itself is unchanged.
- Each canvas is sized to its text, so labels never clip, and sprite scale keeps the canvas aspect ratio.
- Labels redraw once the bundled fonts finish loading.

### Stop and listening-spot markers: wax seals

- Each ring becomes a flat ground decal shaped like a wax seal: an irregular disc, an ink rim, a dashed inner ring, and an ink emblem that says what the stop is for.
  - Quill: listening spots, where you record what you hear.
  - Eye: spectator viewpoints.
  - Star: people to talk with.
  - House: households and shelter.
  - Pennant: the spectator boundary.
- Unvisited stops are wax red. Visited stops fade to plain parchment with the emblem still inked, which is a large change in brightness as well as hue.
- Markers ignore fog so they stay legible at night.

### Notebook

- A ruled notebook page with navy rules, a red margin line, and text set to the ruling.
- Section heads are in IM Fell SC with a hairline beneath.
- Citation entries are index cards: `--paper-hi`, a 2px ink border, and a 3px hard shadow.
- Close sits in the sticky footer.

### Evidence cards and the evidence room

- The backdrop is a walnut desk. The room is visibly modern and separate from 1775.
- The card is an archival folder: a broadside panel 680px wide at most.
- A ledger of nine pips mirrors "Inspected n/9". Filled pips are wax, empty ones are outlined. The pips are decorative (`aria-hidden`), and the text count stays.
- The document title is in IM Fell SC, followed by the source label as rubric and the citation link in rubric.
- Excerpts are document slips: `--paper-hi`, a fine ink border, a 4px wax rule on the left, Caslon italic at 16px, and a 2px hard shadow. Paraphrases and limitations stay in roman, so a quotation never looks like a paraphrase.
- The Doolittle engraving is matted and framed with an ink border and a hard shadow.
- Form labels are IM Fell SC. Selects are parchment with an ink border and an ink chevron.

### Hypothesis screen

- The same folder card, with the selects in a single column.
- The result is a verdict slip with a 6px left rule: `--fits` for "Fits" and `--wax` for "Contradicts". The words stay first in the slip.

### Essay screen

- The textarea is a ruled sheet with a red margin, Caslon at 16px, and line-height matched to the ruling.
- The word count sits as rubric beneath it.
- Check results appear in an examiner's slip with a dashed ink border, which receives focus.
- "Check my answer" and "Finish this investigation" are wax. The other actions are parchment, all in the fixed footer.

## Layout checks

Three sizes are the contract: 662x418 (the embed widget), 960x540, and 1280x720. At each size:

- The HUD, the bottom strip's primary button, and every card's action footer are fully visible without scrolling.
- Hit targets are at least 44px.
- Body text is at least 14px.

Short screens (450px tall or less) tighten padding and step type down, without going below 14px.
