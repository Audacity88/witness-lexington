/* Witness Lexington — ESSAY CHECK RULES (local only: no AI, no network).
   Question: "Which side do you believe fired first, and why?"

   PASS = evidence, counteraccount, length, and sentence structure:
     (a) evidence: at least `minRefs` DIFFERENT evidence references. A reference = one rule below whose pattern matches.
         Rules that point at the same card count once per card ("group"). A reference to the kid's OWN reenactment
         (see `own`) counts as one extra reference and is reported as a STRONG reference (bonus).
     (b) other side: the essay mentions the account it does NOT side with (see `accounts`) AND uses a weighing word
         (why it is weaker, or why it is still possible). If the stance can't be detected, both accounts must be mentioned.
     (c) length: at least `minWords` words.
     (d) distinct claim sentences with connected reasoning; repeated or keyword-only lists fail.
   All patterns are case-insensitive JavaScript regex source strings, tested against the lowercased essay. */
window.WG_ESSAY = {
  question: 'Which side do you believe fired first, and why?',
  minWords: 60,
  minRefs: 2,
  structure: { minSentences: 3, minSentenceWords: 5, maxRepeatedFraction: 0.25, nearDuplicate: 0.75, maxGroupsPerSentence: 2,
    claim: "\\b(is|are|was|were|saw|heard|fired|ordered|said|says|say|describes?|claims?|reported|stood|blocked|had|shows?|appeared|think|believe|cannot|could|might|would|disagree|gives?|came|comes?|fits?|picked|chose)\\b",
    connective: "\\b(because|but|however|although|though|while|so|therefore|since|yet)\\b" },

  // (a) evidence references: distinctive details from each card
  refs: [
    { id: 'revere-house',   group: 'revere1775', label: "A house blocked Revere's view of the militia", any: ["\\bhouse\\b[^.]{0,60}\\b(block|cover|hid|in the way|view|see)", "(couldn'?t|could not|can'?t|didn'?t) see[^.]{0,30}militia", "covered from (me|him)"] },
    { id: 'revere-smoke',   group: 'revere1775', label: 'Revere saw smoke in front of the Troops', any: ["smo+ke?[^.]{0,40}in front", "in front of the troops"] },
    { id: 'revere-pistol',  group: 'revere1798', label: '"appeared to be a Pistol"', any: ["pistol"] },
    { id: 'revere-later',   group: 'revere1798', label: "Revere's 1798 letter came later (same witness)", any: ["1798", "belknap", "(later|years later|23 years)[^.]{0,40}(letter|account|wrote|story)", "same witness"] },
    { id: 'revere-roar',    group: 'revere1798', label: 'two Guns, then a Continual roar', any: ["\\broar\\b", "two guns", "musquetry"] },
    { id: 'barker-shots',   group: 'barker',     label: "Barker's diary: the militia fired one or two shots first", any: ["\\bbarker\\b", "\\bdiary\\b", "one or two shots"] },
    { id: 'depositions',    group: 'depositions', label: "Parker's sworn account: dispersal, no firing, and an unprovoked attack", any: ["depositions?", "sworn", "testimon(y|ies)"] },
    { id: 'doolittle-art',  group: 'doolittle',  label: "Doolittle's engraving is an artist's picture", any: ["doolittle", "engraving", "\\bartist", "\\bpicture\\b", "\\bdrawing\\b"] },
    { id: 'outcome',        group: 'outcome',    label: '8 colonists killed and 10 wounded vs 1 British soldier wounded', any: ["\\b8\\b[^.]{0,25}(killed|dead|died|colonist)", "\\beight\\b[^.]{0,25}(killed|dead|died|colonist)", "\\b(10|ten)\\b[^.]{0,15}wounded", "(only )?(1|one)[^.]{0,20}(british|redcoat|regular|soldier)[^.]{0,20}(wounded|hurt)"] },
    { id: 'numbers',        group: 'numbers',    label: 'About 400 regulars vs about 80 militia', any: ["\\b400\\b", "four hundred", "\\b80\\b", "eighty", "outnumbered"] },
    { id: 'formation',      group: 'formation',  label: 'The militia stood in plain sight, in parade formation', any: ["plain sight", "\\bparade\\b", "formation", "lined up"] },
    { id: 'control',        group: 'control',    label: "The charge got beyond the officers' control", any: ["(out of|beyond)[^.]{0,25}control", "lost control", "(couldn'?t|could not) (stop|control)"] }
  ],

  // which account is which (for (b) and for hints)
  accounts: {
    militia: { label: "the militia's account", any: ["militia'?s? (account|side|story|version)", "depositions?", "militia (say|said|says|claim|claimed|swore)", "colonists (say|said|claim)", "(regulars?|british|redcoats?|soldiers?) (fired|shot) first"] },
    british: { label: 'the British account', any: ["british (account|side|story|version)", "\\bbarker\\b", "\\bdiary\\b", "british (say|said|says|claim|claimed)", "(militia|colonists|minutemen|americans) (fired|shot) first"] }
  },
  stance: {   // what the kid believes; first match near an "I think / I believe" wins, else the first plain match
    lead: "(i (think|believe|guess|say|bet)|probably|most likely|my answer|i'?m (pretty )?sure)",
    british: "(british|regulars?|redcoats?|soldiers?|officer)[^.]{0,20}(fired|shot)[^.]{0,10}first",
    militia: "(militia|colonists|minutemen|americans|provincials)[^.]{0,20}(fired|shot)[^.]{0,10}first",
    unsure: "(can'?t tell|cannot tell|can'?t (be sure|know)|not sure|don'?t know|nobody knows|no one knows|impossible to (know|tell)|unsure)"
  },
  weighing: "\\b(weaker|less (reliable|likely|trustworthy|believable)|but|however|although|though|might|could|maybe|possibly|still possible|biased|blame[sd]?|on (his|their) (own )?side|can'?t be sure|not sure|unreliable|paraphrase|unverified|later|only an artist|artist)\\b",

  // STRONG reference: the kid's own reenactment. Needs, IN THE SAME SENTENCE, a personal phrase AND a detail matching what they actually
  // picked (shooter / location / aftermath) or a card name + the colour that card actually got for them.
  own: {
    personal: "\\b(i|my|me)\\b[^.]{0,50}\\b(had|made|make|picked|chose|choose|put|version|reenact\\w*|replay\\w*|game|played|tried|acted)",
    shooter:  { regular: "\\b(regular|soldier|redcoat)s?\\b", officer: "(officer|pistol)", militiaman: "militia ?man", hidden: "(hidden|hiding|someone behind)" },
    location: { front: "in front", between: "between", ranks: "(ranks|in line|the line)", wall: "\\bwall\\b", house: "\\bhouse\\b" },
    aftermath:{ volley: "(charg|volley)", fewshots: "(fired back|few (militia|shots))", stopped: "(stopp?ed|stop it)", even: "(gunfight|even|traded)", driveback: "(drove|drive|retreat)" },
    cards:    { revere1775: "(revere'?s? (deposition|1775)|smoke card|deposition card)", revere1798: "(1798|belknap|letter|pistol card)", barker: "(barker|diary)", depositions: "(militia depositions|depositions? card)", doolittle: "(doolittle|engraving)",
                numbers: "(numbers? card|400)", formation: "(plain sight|formation)", outcome: "(outcome|killed)", control: "(control)" },
    colors:   { red: "\\b(red|contradict\\w*|didn'?t fit|did not fit)\\b", green: "\\b(green|fit|fits|fitted|matched|agreed)\\b", grey: "\\b(grey|gray|silent)\\b" }
  },

  // Local input flags require a fresh typed draft; they do not prove AI authorship.
  telemetry: { lowRatio: 0.6, minCharsForRatio: 80, maxWPM: 300, minWordsForSpeed: 20, burstWords: 12, burstMs: 1000 },

  hints: {
    structure: 'Write at least three distinct claim sentences of five or more words each and connect evidence to your conclusion. Use source details in complete claims. Keep each sentence focused on one or two sources or facts; remove repeated or near-duplicate sentences and keyword lists.',
    length: 'Write a bit more: aim for at least {min} words (you have {n}).',
    refs0: 'Use the evidence! Mention at least 2 details from the cards, like the house that blocked Revere\u2019s view, the "Pistol", or 8 killed vs 1 wounded.',
    refs1: 'Good start with {got}. Add one more piece of evidence from a different card.',
    otherNotPlayed: 'You haven\u2019t addressed {other} yet \u2014 inspect its document, then say why it is weaker or still possible.',
    otherPlayed: 'You haven\u2019t addressed {other} yet. Say why it is weaker \u2014 or why it is still possible.',
    weigh: 'You mention both sides. Now say WHY one is weaker or could still be true (try "but", "however", "might").',
    stance: 'Tip: say clearly which side you think fired first (or that you can\u2019t tell).',
    own: 'Bonus idea: tell what happened in YOUR tested hypothesis, e.g. which card turned red when you picked the shooter.'
  }
};

// Recognize the specific Parker evidence shown in Slice C, in either word order.
// A bare name or the fictional muster dialogue is not a historical reference.
(function () {
  var detail = "\\b(disperse(?:d)?|dispersal|not (?:to )?fire|no[ -]fir(?:e|ing)|unprovoked|without (?:any )?provocation)\\b";
  var name = "\\bparker(?:'s)?\\b", gap = "[^.!?\\n]{0,140}";
  var patterns = [name + gap + detail, detail + gap + name];
  var ref = window.WG_ESSAY.refs.find(function (r) { return r.id === 'depositions'; });
  ref.any = ref.any.concat(patterns);
  window.WG_ESSAY.accounts.militia.any = window.WG_ESSAY.accounts.militia.any.concat(patterns);
})();

(function () {
  window.WG_ESSAY.refs.forEach(function (r) {
    if (r.group === 'revere1775') r.attribution = "\\brevere(?:'s)?\\b[^.!?]{0,40}\\b(saw|heard|could not see|couldn't see|view|reported|wrote|said|says|deposition)\\b|\\b(blocked|covered|hid)[^.!?]{0,20}\\brevere(?:'s)?\\b|1775 deposition[^.!?]{0,40}\\b(says|reports|describes)\\b";
    if (r.group === 'revere1798') r.attribution = "\\brevere(?:'s)?\\b[^.!?]{0,50}\\b(saw|heard|described|wrote|said|says|reported|letter|account)\\b|\\b(1798|belknap)\\b[^.!?]{0,40}\\b(letter|account|says|reports|describes)\\b";
    if (r.attribution) r.exclude = "\\b(eli|my (view|game|scene)|i (saw|heard|stood|met)|fictional (scene|view|observation))\\b";
  });
})();

// A source name alone is not a claim. Keep passive facts and source limitations eligible.
(function () {
  var details = {
    revere1798: "\\b(saw|heard|appeared|described)\\b[^.!?]{0,60}\\bpistol\\b|\\bpistol\\b[^.!?]{0,40}\\b(appeared|fired)\\b|\\b(later|1798|belknap|same witness|two guns|roar|musquetry)\\b",
    barker: "\\b(barker|diary)\\b[^.!?]{0,140}\\b(one or two shots|(?:militia|colonists|minutemen) (?:fired|shot))\\b|\\b(one or two shots|(?:militia|colonists|minutemen) (?:fired|shot))\\b[^.!?]{0,140}\\b(barker|diary)\\b",
    depositions: "\\b(parker|depositions?|sworn|testimony)\\b[^.!?]{0,140}\\b(fired|shot|disperse(?:d)?|dispersal|not (?:to )?fire|no[ -]fir(?:e|ing)|unprovoked|without (?:any )?provocation)\\b|\\b(fired|shot|disperse(?:d)?|dispersal|not (?:to )?fire|no[ -]fir(?:e|ing)|unprovoked|without (?:any )?provocation)\\b[^.!?]{0,140}\\b(parker|depositions?|sworn|testimony)\\b",
    doolittle: "\\b(artist|engraving|picture|drawing)\\b[^.!?]{0,60}\\b(artist|pictured|depicts?|shows?|portrays?|proof)\\b|\\bdoolittle(?:'s)?\\b[^.!?]{0,60}\\b(pictured|depicts?|shows?|portrays?)\\b|\\bdoolittle(?:'s)?\\b[^.!?]{0,60}\\bartist\\b|\\bartist\\b[^.!?]{0,60}\\bdoolittle(?:'s)?\\b|\\bdoolittle(?:'s)?\\b[^.!?]{0,60}\\b(not (?:an? )?eyewitness|not a witness|(?:did not|didn't|never) witness(?:ed)?)\\b",
    numbers: "\\b(400|four hundred|80|eighty)\\b[^.!?]{0,30}\\b(regulars?|british|militia|colonists|soldiers?)\\b|\\b(regulars?|british|militia|colonists|soldiers?)\\b[^.!?]{0,30}\\b(400|four hundred|80|eighty|outnumbered)\\b",
    formation: "\\bmilitia\\b[^.!?]{0,60}\\b(plain sight|parade|formation|lined up)\\b|\\b(plain sight|parade|formation|lined up)\\b[^.!?]{0,60}\\bmilitia\\b",
    control: "\\b(charge|officers?|regulars?|british|soldiers?|men)\\b[^.!?]{0,60}\\b((out of|beyond)[^.!?]{0,25}control|lost control|(?:couldn't|could not) (?:stop|control))\\b"
  };
  var revere1775 = "\\brevere(?:'s)?(?: 1775)? deposition\\b|\\brevere(?:'s)? 1775\\b|\\b1775 deposition,? (?:by )?(?:paul )?revere\\b";
  var revere1798 = "\\b(1798|belknap)\\b|\\brevere(?:'s)?(?: later)? letter\\b|\\blater (letter|account)\\b";
  window.WG_ESSAY.refs.forEach(function (r) {
    if (details[r.group]) r.detailClaim = details[r.group];
    // Shared smoke/front vocabulary does not turn an explicitly named letter into a deposition.
    if (r.group === 'revere1775') { r.source = revere1775; r.otherSource = revere1798; }
    if (r.group === 'revere1798') { r.source = revere1798; r.otherSource = revere1775; }
    if (r.group === 'depositions') {
      // Revere's singular deposition is not Parker's source, even when Barker shares the sentence.
      r.otherSource = "\\brevere(?:'s)?\\b|\\b1775 deposition\\b";
      r.source = "\\bparker(?:'s)?\\b|\\bmilitia(?:'s)?(?: sworn)? depositions?\\b|\\bdepositions\\b";
    }
  });
})();
