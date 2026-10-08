/* Witness the First Shot — evidence cards, choices, and the SCORING TABLE.
   Readable data, no logic beyond the tiny combine rule documented below.
   Use ONLY the facts and quotes given in the brief. Quotes are verbatim, original spelling kept.

   SCORING RULE
   ------------
   A "version" = { shooter, location, aftermath } (plus which side's account it reenacts).
   For every card, each choice the kid made can mark it:  G = fits (green), R = contradicts (red), - = silent (grey).
   Card colour = RED if any choice marks it R; else GREEN if any marks it G; else GREY.
   A version is ACCEPTED unless some HARD FACT card is red. Testimony cards may be red in an accepted version
   (the game lists which). Reasons shown to the kid come from the `why` text of the marks that decided the colour. */
window.WG_DATA = {

  // ---------------- choices ----------------
  sides: {
    militia: { label: "The militia's account", says: 'Militia depositions (1775): the regulars fired first.', preset: { shooter: 'regular', location: 'front', aftermath: 'volley' } },
    british: { label: 'The British account', says: "Lt. John Barker's diary: the militia fired first.", preset: { shooter: 'militiaman', location: 'ranks', aftermath: 'fewshots' } }
  },

  shooters: {
    regular:    { label: 'A regular',               sub: 'a British soldier in the line', zones: ['front', 'between'] },
    officer:    { label: "An officer's pistol",     sub: 'a British officer',             zones: ['front', 'between'] },
    militiaman: { label: 'A militiaman',            sub: 'in the ranks on the Green',     zones: ['ranks'] },
    hidden:     { label: 'Someone hidden',          sub: 'behind the wall or a house — side unknown', zones: ['wall', 'house'] }
  },

  // where the first shot came from (the kid taps the scene; the tap snaps to the nearest allowed zone)
  zones: {
    front:   { label: 'Just in front of the regulars' },
    between: { label: 'Open ground between the lines' },
    ranks:   { label: "In the militia's ranks" },
    wall:    { label: 'Behind the stone wall' },
    house:   { label: 'Beside a house' }
  },

  aftermaths: {
    volley:    { label: 'Regulars fire and charge', sub: 'the charge gets beyond their officers; the militia scatter' },
    fewshots:  { label: 'A few militia fire back',  sub: 'then the regulars charge and the militia scatter' },
    stopped:   { label: 'Officers stop it at once', sub: 'nobody else fires' },
    even:      { label: 'A long, even gunfight',    sub: 'both lines trade volleys and hold their ground' },
    driveback: { label: 'Militia drive them off',   sub: 'the militia charge; the regulars retreat' }
  },

  // ---------------- cards ----------------
  // kind: 'testimony' (can be red in an accepted version) or 'fact' (red = version not accepted)
  cards: [
    { id: 'revere1775', kind: 'testimony', title: 'Paul Revere — deposition', date: '1775',
      quotes: ['one gun was fired, I heard the report, turned my head, and saw the smoake in front of the Troops',
               'I could not see our Militia, for they were covered from me, by a house at the bottom of the Street.'] },
    { id: 'revere1798', kind: 'testimony', title: 'Paul Revere — letter to Belknap', date: '1798',
      flag: 'Later account by the same witness — not independent of his 1775 deposition.',
      quotes: ['I saw, & heard, a Gun fired, which appeared to be a Pistol. Then I could distinguish two Guns, & then a Continual roar of Musquetry.'] },
    { id: 'barker', kind: 'testimony', title: "Lt. John Barker's diary (British)", date: '',
      flag: 'Paraphrase — not yet checked against the 1924 Dana edition.',
      summary: 'The militia fired two shots first.' },
    { id: 'depositions', kind: 'testimony', title: 'Militia depositions', date: '1775',
      summary: 'The regulars fired first.' },
    { id: 'doolittle', kind: 'testimony', title: 'Doolittle engraving', date: '1775',
      flag: 'Shows how an artist pictured the battle.',
      summary: 'Shows the British firing.' },
    { id: 'numbers', kind: 'fact', title: 'Numbers', summary: 'About 400 regulars vs about 80 militia.' },
    { id: 'formation', kind: 'fact', title: 'In plain sight', summary: 'The militia stood in parade formation, in plain sight.' },
    { id: 'outcome', kind: 'fact', title: 'Outcome', summary: '8 colonists killed and 10 wounded; 1 British soldier wounded.' },
    { id: 'control', kind: 'fact', title: 'Out of control', summary: "The regulars' charge got beyond their officers' control." }
  ],

  // ---------------- THE SCORING TABLE ----------------
  // table[cardId][dimension][choice] = [mark, why]   (missing entry = '-' silent)
  table: {
    revere1775: {
      location: {
        front:   ['G', 'He saw the smoke in front of the Troops.'],
        between: ['-', '"In front of the Troops" might mean here — or not. He doesn\'t say exactly.'],
        ranks:   ['R', 'He saw the smoke in front of the Troops — and says he could not see the militia at all.'],
        wall:    ['R', 'He saw the smoke in front of the Troops, not off behind the wall.'],
        house:   ['R', 'He saw the smoke in front of the Troops, not beside a house.']
      }
    },
    revere1798: {
      shooter: {
        officer:    ['G', 'He says the first gun "appeared to be a Pistol".'],
        regular:    ['R', 'He says it appeared to be a Pistol — your first shot is a soldier\'s musket.'],
        militiaman: ['R', 'He says it appeared to be a Pistol — your first shot is a militiaman\'s musket.'],
        hidden:     ['-', 'We can\'t tell what your hidden shooter fired.']
      },
      aftermath: {
        volley:   ['G', 'Then two Guns, then a Continual roar — like your volleys.'],
        fewshots: ['G', 'Then two Guns, then a Continual roar — like your version.'],
        stopped:  ['R', 'He heard a Continual roar of Musquetry — your version stops after one shot.'],
        even:     ['G', 'A Continual roar of Musquetry fits a long gunfight.']
      }
    },
    barker: {
      shooter: {
        militiaman: ['G', 'He says the militia fired first.'],
        regular:    ['R', 'He says the militia fired first, not a regular.'],
        officer:    ['R', 'He says the militia fired first, not an officer.'],
        hidden:     ['-', 'He blames the militia; your hidden shooter could be anyone.']
      }
    },
    depositions: {
      shooter: {
        regular:    ['G', 'They say the regulars fired first.'],
        officer:    ['G', 'They blame the regulars — an officer\'s pistol is on the regulars\' side.'],
        militiaman: ['R', 'They say the regulars fired first, not the militia.'],
        hidden:     ['-', 'They blame the regulars; your hidden shooter could be anyone.']
      }
    },
    doolittle: {
      shooter: {
        regular:    ['G', 'It shows the British firing.'],
        officer:    ['G', 'It shows the British firing.'],
        militiaman: ['R', 'It shows the British firing, not the militia.']
      },
      aftermath: {
        volley:   ['G', 'It shows the British firing.'],
        fewshots: ['G', 'It shows the British firing.'],
        stopped:  ['R', 'It shows the British firing — in your version they never fire a volley.'],
        even:     ['G', 'It shows the British firing.']
      }
    },
    numbers: {
      aftermath: {
        volley:    ['G', 'About 80 militia facing about 400 regulars scatter — fits.'],
        fewshots:  ['G', 'About 80 militia facing about 400 regulars scatter — fits.'],
        driveback: ['R', 'About 80 militia drive off about 400 regulars? That doesn\'t fit the numbers.']
      }
    },
    formation: {
      shooter: {
        regular:    ['G', 'The militia stand in two ranks in plain sight.'],
        officer:    ['G', 'The militia stand in two ranks in plain sight.'],
        militiaman: ['G', 'The militia stand in two ranks in plain sight.'],
        hidden:     ['G', 'The militia stand in plain sight; your shooter is someone else, hidden.']
      }
    },
    outcome: {
      aftermath: {
        volley:    ['G', 'Heavy losses for the militia, almost none for the regulars — fits.'],
        fewshots:  ['G', 'A few militia shots and 1 British soldier wounded — fits.'],
        stopped:   ['R', '8 colonists were killed and 10 wounded — your version stops after one shot.'],
        even:      ['R', 'Only 1 British soldier was wounded — a long, even gunfight would hit many more.'],
        driveback: ['R', '8 colonists killed, 10 wounded, and only 1 British soldier wounded — that doesn\'t fit the militia winning.']
      }
    },
    control: {
      aftermath: {
        volley:    ['G', 'The charge gets beyond the officers — fits.'],
        fewshots:  ['G', 'The charge gets beyond the officers — fits.'],
        stopped:   ['R', 'The regulars\' charge got beyond their officers\' control — here the officers stop everything.'],
        driveback: ['R', 'The regulars charged — here they retreat.']
      }
    }
  },

  // ---------------- the evidence room (final stage): the actual documents ----------------
  // Transcriptions use ONLY the excerpts above; anything not available yet is shown as a labeled placeholder.
  room: {
    doolittle: { title: 'Amos Doolittle \u2014 The Battle of Lexington, April 19, 1775. Plate I', badge: 'engraving \u00b7 1775',
      source: 'Yale University Art Gallery, 1920.25a\u2013d (object 2482) \u00b7 Public domain (CC0)',
      alt: 'Amos Doolittle\u2019s 1775 engraving of the Battle of Lexington',
      caption: 'Shows the British firing \u2014 but it shows how an artist pictured the battle.', flag: 'An artist\u2019s picture' },
    revere1775: { title: 'Paul Revere \u2014 deposition, 1775', badge: 'transcription (excerpts)', source: 'Massachusetts Historical Society, item 98',
      quotes: ['one gun was fired, I heard the report, turned my head, and saw the smoake in front of the Troops',
               'I could not see our Militia, for they were covered from me, by a house at the bottom of the Street.'],
      scan: 'Scan of the original deposition: not available yet (placeholder)' },
    revere1798: { title: 'Paul Revere \u2014 letter to Belknap, 1798', badge: 'transcription (excerpt)', source: 'Massachusetts Historical Society, item 99',
      quotes: ['I saw, & heard, a Gun fired, which appeared to be a Pistol. Then I could distinguish two Guns, & then a Continual roar of Musquetry.'],
      flag: 'Later account by the same witness \u2014 not independent.', scan: 'Scan of the original letter: not available yet (placeholder)' },
    barker: { title: 'Lt. John Barker\u2019s diary (British)', badge: 'paraphrase \u00b7 unverified', text: 'Paraphrase: the militia fired two shots first.',
      flag: 'Unverified \u2014 not yet checked against the 1924 Dana edition.', scan: 'Diary page: not available yet (placeholder)' },
    depositions: { title: 'Militia depositions, 1775', badge: 'summary', text: 'Summary: the regulars fired first.',
      scan: 'Deposition scans: not available yet (placeholder)' },
    facts: { title: 'Hard facts', badge: 'facts' }
  },

  cutsceneCaption: 'No witness saw who fired first.'
};
