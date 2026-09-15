const AUXILIARIES = 'am|is|are|was|were|be|been|being|get|gets|got|gotten';
const IRREGULAR = 'known|made|done|seen|said|built|sent|kept|left|held|read|written|taken|given|driven|shown|found|thought|brought|bought|caught|taught|grown|drawn|thrown|spoken|broken|chosen|forgotten|eaten|drunk|sung|run|won|lost|paid|sold|told';
const STATIVE_PARTICIPLES = new Set('interested concerned tired bored excited married located situated related accustomed convinced satisfied disappointed'.split(' '));
const PASSIVE_PATTERN = new RegExp(`\\b(${AUXILIARIES})\\b\\s+(?:[a-z]+ly\\s+)?([a-z]+(?:ed|en|wn|nt|ung|lt|pt)|${IRREGULAR})\\b`, 'i');
const PAST_FORMS = { written: 'wrote', taken: 'took', given: 'gave', driven: 'drove', shown: 'showed', known: 'knew', done: 'did', seen: 'saw', eaten: 'ate', drunk: 'drank', sung: 'sang', thrown: 'threw', spoken: 'spoke', broken: 'broke', chosen: 'chose', forgotten: 'forgot', made: 'made', built: 'built', sent: 'sent', kept: 'kept', left: 'left', held: 'held', read: 'read', found: 'found', thought: 'thought', brought: 'brought', bought: 'bought', caught: 'caught', taught: 'taught', grown: 'grew', drawn: 'drew', run: 'ran', won: 'won', lost: 'lost', paid: 'paid', sold: 'sold', told: 'told' };
const SUBJECT_PRONOUNS = { me: 'I', him: 'He', her: 'She', us: 'We', them: 'They', whom: 'Who' };

export function splitVoiceSentences(text) {
  if (!text.trim()) return [];
  if (typeof Intl !== 'undefined' && Intl.Segmenter) return [...new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(text)].map(({ segment }) => segment).filter((value) => value.trim());
  return text.match(/[^.!?]+(?:[.!?]+|$)/g)?.filter((value) => value.trim()) || [text];
}

function capitalized(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''; }
function subjectCase(agent) {
  const clean = agent.trim(); const replacement = SUBJECT_PRONOUNS[clean.toLowerCase()];
  return replacement || capitalized(clean);
}

export function trySimplePastRewrite(sentence) {
  const match = sentence.trim().match(/^(.+?)\s+(was|were)\s+([a-z]+(?:ed|en|wn|nt|ung|lt|pt)|known|made|done|seen|said|built|sent|kept|left|held|read|written|taken|given|driven|shown|found|thought|brought|bought|caught|taught|grown|drawn|thrown|spoken|broken|chosen|forgotten|eaten|drunk|sung|run|won|lost|paid|sold|told)\s+by\s+(.+?)([.!?]*)$/i);
  if (!match) return '';
  const [, patient, , participle, agent, punctuation] = match;
  const verb = PAST_FORMS[participle.toLowerCase()] || participle.toLowerCase();
  return `${subjectCase(agent)} ${verb} ${patient.charAt(0).toLowerCase()}${patient.slice(1)}${punctuation || '.'}`;
}

export function analyzeVoice(text) {
  return splitVoiceSentences(text).map((original) => {
    const trimmed = original.trim(); const match = trimmed.match(PASSIVE_PATTERN);
    if (!match) return { original: trimmed, status: 'no-pattern', confidence: 'none', phrase: '', actorPresent: false, suggestion: '' };
    const participle = match[2].toLowerCase();
    const actorPresent = /\bby\s+[^,.!?]+/i.test(trimmed);
    const stative = STATIVE_PARTICIPLES.has(participle) && !actorPresent;
    return {
      original: trimmed,
      status: stative ? 'review' : 'possible-passive',
      confidence: actorPresent ? 'high' : stative ? 'low' : 'medium',
      phrase: match[0], actorPresent,
      suggestion: trySimplePastRewrite(trimmed),
    };
  });
}
