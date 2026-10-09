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
      quotes: ['…one gun was fired, I heard the report, turned my head…'] },
    { id: 'revere1798', kind: 'testimony', title: 'Paul Revere — letter to Belknap', date: '1798',
      flag: 'Later account by the same witness, not independent. The chosen MASSAR transcript marks this paragraph as struck through.',
      quotes: ['…I saw, & heard, a Gun fired, which appeared to be a Pistol. Then I could distinguish two Guns, & then a Continual roar of Musquetry;…'] },
    { id: 'barker', kind: 'testimony', title: "Lt. John Barker's diary (British)", date: '',
      flag: 'Paraphrase of the NPS published diary excerpt. This is Barker\'s claim.',
      summary: 'Barker claims the militia fired one or two shots first.' },
    { id: 'depositions', kind: 'testimony', title: 'John Parker’s sworn deposition', date: '1775',
      summary: 'Parker says he ordered dispersal and no firing, then the regulars attacked without provocation. This supports the militia account; it does not settle the dispute.' },
    { id: 'doolittle', kind: 'testimony', title: 'Doolittle engraving', date: '1775',
      flag: 'Shows how an artist pictured the battle.',
      summary: 'Shows how an artist pictured the British firing, not proof of the first shooter.' },
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
        ranks:   ['R', 'He saw the smoke in front of the Troops — and says a house blocked his view of the militia at that time.'],
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
        regular:    ['G', 'Parker attributes the unprovoked attack to the regulars.'],
        officer:    ['G', 'Parker blames the regulars; an officer\'s pistol is on their side.'],
        militiaman: ['R', 'Parker attributes the unprovoked attack to the regulars, rather than the militia.'],
        hidden:     ['-', 'Parker blames the regulars; your hidden shooter could be anyone.']
      }
    },
    doolittle: {
      shooter: {
        regular:    ['G', 'It shows how an artist pictured the British firing.'],
        officer:    ['G', 'It shows how an artist pictured the British firing.'],
        militiaman: ['R', 'It shows how an artist pictured the British firing, rather than the militia.']
      },
      aftermath: {
        volley:   ['G', 'It shows how an artist pictured the British firing.'],
        fewshots: ['G', 'It shows how an artist pictured the British firing.'],
        stopped:  ['R', 'It shows how an artist pictured the British firing; your version has no volley.'],
        even:     ['G', 'It shows how an artist pictured the British firing.']
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
        regular:    ['G', 'The militia stand in parade formation in plain sight.'],
        officer:    ['G', 'The militia stand in parade formation in plain sight.'],
        militiaman: ['G', 'The militia stand in parade formation in plain sight.'],
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
      quotes: ['…one gun was fired, I heard the report, turned my head…'],
      scan: 'Scan of the original deposition: not available yet (placeholder)' },
    revere1798: { title: 'Paul Revere \u2014 letter to Belknap, 1798', badge: 'transcription (excerpt)', source: 'Massachusetts Historical Society, item 99',
      quotes: ['…I saw, & heard, a Gun fired, which appeared to be a Pistol. Then I could distinguish two Guns, & then a Continual roar of Musquetry;…'],
      flag: 'Later account by the same witness, not independent. MASSAR marks this paragraph as struck through.', scan: 'Scan of the original letter: not available yet (placeholder)' },
    barker: { title: 'Lt. John Barker\u2019s diary (British)', badge: 'paraphrase \u00b7 NPS diary excerpt', text: 'Paraphrase: Barker claims the militia fired one or two shots first.',
      flag: 'A British account, not a settled verdict.', scan: 'Diary page: not available yet (placeholder)' },
    depositions: { title: 'John Parker’s sworn deposition, April 25, 1775', badge: 'summary', text: 'Summary: Parker says he ordered dispersal and no firing, then the regulars attacked without provocation.',
      scan: 'Deposition scans: not available yet (placeholder)' },
    facts: { title: 'Hard facts', badge: 'facts' }
  },

  cutsceneCaption: 'These accounts do not settle who fired first. [PIVOT]'
};

(function () {
  var D = window.WG_DATA;
  var sources = {
    revere1775: ['[R75]', 'MHS item 98, 1775 deposition; MHS transcription, page 3', 'revere-transcription-choices', 'Document paraphrase: Revere heard a report, turned, and saw smoke in front of the troops. A house hid the militia from him. Hearing and smoke do not identify a trigger puller.'],
    revere1798: ['[R98]', 'MHS item 99, 1798 manuscript; chosen MASSAR transcription', 'revere-transcription-choices', 'The 1798 letter is a later account by the same witness, not independent confirmation. MASSAR marks the quoted paragraph as struck through.'],
    barker: ['[BARKER]', 'Lt. John Barker, April 19 diary entry; NPS Embattled Farmers, Reading 2', 'officers-control-and-barkers-account', 'A British account that blames the militia. It says one or two shots, not an exact count.'],
    depositions: ['[MILITIA]', 'John Parker, April 25, 1775, document No. 4; DocsTeach, NARA 595246', 'the-specific-militia-deposition', 'A militia commander’s sworn account, not a view of every possible shooter. This is a summary, not a quotation.'],
    doolittle: ['[DOOLITTLE]', 'Amos Doolittle, Plate I, 1775; Yale object 2482, accession 1920.25a-d; CC0', 'doolittle-image', 'Shows how an artist pictured the British firing. An engraving is not proof of the first shooter.'],
    numbers: ['[NUMBERS]', 'Willard and Robins depositions; NPS timeline and expedition overview', 'lexington-setting-and-numbers', 'The inherited reconstruction uses about 400 versus 80. Willard estimated about 400 approaching regulars; Robins about 1,000. NPS gives about 200 in the detached advance force and 700 in the expedition. Militia estimates span about 50 to 300; NPS gives 77. Scopes and estimates differ.'],
    formation: ['[FORMATION]', 'Lexington secondary account; Parkhurst and others, April 25 deposition', 'formation', 'Exact spacing and model count are reconstructed. Formation in plain sight does not establish intent.'],
    outcome: ['[OUTCOME]', 'NPS April 19 timeline; Lexington secondary account citing Quarles', 'outcome', 'These casualties concern Lexington alone. They cannot identify the first shooter.'],
    control: ['[CONTROL]', 'Barker in NPS Reading 2; Lexington secondary account citing Fischer', 'officers-control-and-barkers-account', 'Accounts describe a rush without orders and loss of officers’ control. They do not prove a first-shot command.']
  };
  D.cards.forEach(function (c) {
    var s = sources[c.id]; c.source = s[0]; c.sourceLabel = s[1]; c.anchor = s[2]; c.limit = s[3];
    if (c.id === 'revere1775') { c.summary = 'Revere says he saw smoke in front of the troops but a house blocked his view of the militia.'; c.limit = 'Hearing and smoke do not identify a trigger puller.'; }
    if (c.id === 'depositions') c.date = 'April 25, 1775';
  });
})();
