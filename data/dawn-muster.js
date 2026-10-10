/* WL-S2 script. Historical IDs resolve in CREDITS.md and SOURCES.md.
   Speech and the hearing experiment are dramatized, not primary testimony. */
window.WL_DAWN = {
  caption: 'Dawn, April 19, 1775. The militia gather on Lexington Green. [SETTING] [FORMATION]',
  parker: 'Keep together. Listen for orders.',
  militiaman: 'I heard part of the order. I could not hear the rest.',
  townsperson: 'That is what I was told. I did not see the column myself.',
  stops: [
    { id: 'parker', name: 'Parker', x: -11, z: -9 },
    { id: 'near', name: 'Near listening spot', x: -6, z: -9 },
    { id: 'militia', name: 'Fictional militiaman', x: 0, z: -9 },
    { id: 'far', name: 'Distant listening spot', x: 8, z: -9 },
    { id: 'town', name: 'Fictional townsperson', x: 11, z: -13 },
    { id: 'boundary', name: 'Spectator boundary', x: 0, z: -15 }
  ],
  hearing: {
    near: 'Keep together. Listen for orders.',
    far: 'Keep ... [words unclear] ... orders.'
  },
  records: {
    parker: 'Eli met the dramatized Parker and accepted an invented message: ask the marked group to listen for orders.',
    delivered: 'Eli carried the invented message from Parker to the marked fictional militiaman. This is not a historical order or testimony.',
    near: 'At the near listening spot, Eli could read the whole simulated instruction. This hearing experiment is invented.',
    far: 'At the distant listening spot, some words of the simulated instruction were unclear. Missing words do not establish intent.',
    militia: 'Eli asked the fictional militiaman what he could hear. He reported hearing only part of the order, not who would fire first.',
    town: 'Eli asked the fictional townsperson what they could see. Their report was secondhand; they had not seen the column.',
    boundary: 'Eli found the marked spectator boundary. Its location is a game safety boundary, not a documented historical line.'
  },
  source: {
    id: '[COMMAND]', label: 'Lexington secondary account, command and hearing passage.',
    note: 'The cited account describes Parker\'s raspy command and some men not hearing it. Exact words, listening distances, the message relay, and missing words here are dramatized. They cannot establish who fired first.',
    anchor: 'commands-and-named-person-movements'
  }
};
