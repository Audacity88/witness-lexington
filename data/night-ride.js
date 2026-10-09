/* WL-S1 script. Historical IDs resolve in CREDITS.md and SOURCES.md.
   All speech is visibly dramatized; no new primary-source quotations. */
window.WL_NIGHT = {
  captions: [
    { text: 'Lexington, Massachusetts. Dawn, April 19, 1775.', source: '[SETTING]' },
    { text: 'The militia stand in parade formation, in plain sight.', source: '[FORMATION]' },
    { text: 'Hundreds of regulars approach the militia. Estimates vary.', source: '[NUMBERS]' }
  ],
  pivot: { text: 'These accounts do not settle who fired first.', source: '[PIVOT]' },
  rewind: { text: 'Earlier: the night of April 18, 1775.', source: '[NIGHT]' },
  revere: ['There is news of regulars on the road.', 'Ask who saw it before you pass the news on.'],
  resident: 'That is what I was told. I did not see the column myself.',
  stops: [
    { id: 'parsonage', name: 'Parsonage meeting point', z: 44 },
    { id: 'lantern', name: 'Lantern household', z: 28 },
    { id: 'orchard', name: 'Orchard household', z: 10 }
  ],
  records: {
    warning: 'At the parsonage, Eli heard a warning from the dramatized Revere. Eli did not see a column of regulars.',
    question: 'Eli asked who supplied the news. The dramatized reply reminded Eli to ask who saw it.',
    lantern: 'Eli passed the warning to the fictional Lantern household. The resident said they had not seen the column themselves.',
    orchard: 'Eli passed the warning to the fictional Orchard household. The resident said they had not seen the column themselves.',
    returned: 'After warning both households, Eli rode back to the parsonage meeting point.'
  },
  sources: [
    { id: '[SETTING]', label: 'NPS, April 19, 1775, 5:00 a.m. entry.', note: 'Date and setting. The low-poly Green is a simplified reconstruction.', anchor: 'lexington-setting-and-numbers' },
    { id: '[FORMATION]', label: 'Lexington secondary account and Parkhurst joint deposition, April 25, 1775.', note: 'Formation in plain sight. Model spacing is reconstructed.', anchor: 'formation' },
    { id: '[NUMBERS]', label: 'Willard and Robins depositions; NPS timeline and expedition overview.', note: 'Estimates and force scopes differ. Models do not represent an exact headcount.', anchor: 'lexington-setting-and-numbers' },
    { id: '[PIVOT]', label: 'Editorial comparison of Revere 1775 and 1798, Barker, and Parker.', note: 'These conflicting accounts and their limits leave the first shot unresolved. The opening cuts away before any shot.', anchor: 'revere-transcription-choices' },
    { id: '[NIGHT]', label: 'Lexington History Museums, Paul Revere\'s Ride, April 18th, 1775 section.', note: 'Revere warned Lexington; Adams and Hancock lodged at Clarke\'s parsonage and departed to safety. Eli, this horse ride, the households, and all exchanges are invented.', anchor: 'night-alarm-and-escape' }
  ]
};
