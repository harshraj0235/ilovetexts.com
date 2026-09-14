'use client';

import { useState } from 'react';

const TYPES = {
  argumentative: { label: 'Argumentative', hint: 'Take a position a reasonable reader could challenge.' },
  analytical: { label: 'Analytical', hint: 'Present an interpretation and its line of reasoning.' },
  expository: { label: 'Expository', hint: 'State a focused controlling idea without forcing a debate.' },
};
const QUALIFIERS = ['', 'In most cases', 'Within this context', 'Based on the available evidence'];
const trimSentence = (value) => value.trim().replace(/[.!?]+$/, '');
const lowerFirst = (value) => value ? value.charAt(0).toLowerCase() + value.slice(1) : '';
const joinReasons = (values) => values.length < 2 ? values[0] : `${values.slice(0, -1).join(', ')}${values.length > 2 ? ',' : ''} and ${values.at(-1)}`;
const finish = (value) => `${value.charAt(0).toUpperCase()}${value.slice(1)}.`;

export default function ThesisGenerator() {
  const [essayType, setEssayType] = useState('argumentative');
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState('');
  const [claim, setClaim] = useState('');
  const [reasons, setReasons] = useState(['', '']);
  const [counterargument, setCounterargument] = useState('');
  const [qualifier, setQualifier] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [message, setMessage] = useState('');

  const updateReason = (index, value) => setReasons((current) => current.map((reason, reasonIndex) => reasonIndex === index ? value : reason));
  const addReason = () => setReasons((current) => current.length < 4 ? [...current, ''] : current);
  const removeReason = (index) => setReasons((current) => current.length > 1 ? current.filter((_, reasonIndex) => reasonIndex !== index) : current);

  const generateDrafts = (event) => {
    event.preventDefault();
    const cleanTopic = trimSentence(topic);
    const cleanClaim = trimSentence(claim);
    const cleanReasons = reasons.map(trimSentence).filter(Boolean);
    const cleanCounter = trimSentence(counterargument);
    if (!cleanTopic || !cleanClaim || !cleanReasons.length) {
      setMessage('Add a focused topic, your claim or controlling idea, and at least one reason.');
      return;
    }
    const reasonList = joinReasons(cleanReasons.map(lowerFirst));
    const qualifiedClaim = qualifier ? `${qualifier}, ${lowerFirst(cleanClaim)}` : cleanClaim;
    let options;
    if (essayType === 'argumentative') {
      options = [
        { frame: 'Direct', note: 'States the position and previews its support.', text: finish(`${qualifiedClaim} because ${reasonList}`) },
        { frame: 'Context-led', note: 'Names the topic before presenting the position.', text: finish(`In debates about ${lowerFirst(cleanTopic)}, ${lowerFirst(qualifiedClaim)} because ${reasonList}`) },
        cleanCounter
          ? { frame: 'Concessive', note: 'Acknowledges a genuine opposing view before answering it.', text: finish(`Although ${lowerFirst(cleanCounter)}, ${lowerFirst(qualifiedClaim)} because ${reasonList}`) }
          : { frame: 'Focused', note: 'Connects the claim to a defined topic and reasoning path.', text: finish(`${cleanTopic} should be understood through the claim that ${lowerFirst(cleanClaim)}, supported by ${reasonList}`) },
      ];
    } else if (essayType === 'analytical') {
      options = [
        { frame: 'Interpretive', note: 'Presents an interpretation rather than only a summary.', text: finish(`An analysis of ${lowerFirst(cleanTopic)} shows that ${lowerFirst(cleanClaim)} through ${reasonList}`) },
        { frame: 'Relationship', note: 'Emphasizes how the supporting parts create the interpretation.', text: finish(`${cleanClaim} in ${lowerFirst(cleanTopic)}, as revealed by ${reasonList}`) },
        { frame: 'Significance', note: 'Connects the interpretation to why it matters.', text: finish(`By examining ${reasonList}, ${lowerFirst(cleanTopic)} reveals that ${lowerFirst(cleanClaim)}`) },
      ];
    } else {
      options = [
        { frame: 'Controlling idea', note: 'Previews the explanation without claiming universal proof.', text: finish(`Understanding ${lowerFirst(cleanTopic)} requires examining ${reasonList}`) },
        { frame: 'Focus-led', note: 'Defines the paper’s explanatory focus.', text: finish(`${cleanTopic} can be explained through ${reasonList}, clarifying how ${lowerFirst(cleanClaim)}`) },
        { frame: 'Process', note: 'Organizes an explanation around connected factors.', text: finish(`The relationship between ${reasonList} explains why ${lowerFirst(cleanClaim)} in the context of ${lowerFirst(cleanTopic)}`) },
      ];
    }
    setDrafts(options);
    setMessage('Three starting drafts created. Edit the wording and verify every claim against your evidence.');
    requestAnimationFrame(() => document.getElementById('thesis-drafts')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const updateDraft = (index, text) => setDrafts((current) => current.map((draft, draftIndex) => draftIndex === index ? { ...draft, text } : draft));
  const copyDraft = async (text) => {
    await navigator.clipboard.writeText(text);
    setMessage('Draft copied. Revise it to match your assignment and evidence.');
  };
  const loadExample = () => {
    setEssayType('argumentative'); setPrompt('Should public high schools begin later in the morning?');
    setTopic('later start times in public high schools'); setClaim('public high schools should begin later');
    setReasons(['later schedules support adolescent sleep needs', 'rested students can concentrate more effectively']);
    setCounterargument('later dismissal can complicate sports and family schedules'); setQualifier('In most cases'); setDrafts([]); setMessage('Example loaded—replace it with your own argument when ready.');
  };
  const clearAll = () => {
    setPrompt(''); setTopic(''); setClaim(''); setReasons(['', '']); setCounterargument(''); setQualifier(''); setDrafts([]); setMessage('');
  };

  return <div className="thesis-builder">
    <section className="builder-card" aria-labelledby="builder-title">
      <header><span>Offline academic writing framework</span><h2 id="builder-title">Build the argument before polishing the sentence</h2><p>Your text stays in this browser. The builder arranges only the ideas you provide; it does not research, verify evidence, or guarantee a strong thesis.</p></header>
      <form onSubmit={generateDrafts}>
        <fieldset className="type-picker"><legend>1. Choose the paper type</legend><div>{Object.entries(TYPES).map(([value, data]) => <button type="button" key={value} aria-pressed={essayType === value} onClick={() => setEssayType(value)}><strong>{data.label}</strong><small>{data.hint}</small></button>)}</div></fieldset>
        <div className="field full"><label htmlFor="assignment-prompt">Assignment prompt <span>optional</span></label><textarea id="assignment-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value.slice(0, 500))} placeholder="Paste the question your thesis must answer…" rows={2} /><small>{prompt.length}/500 · Use this as a reference; it is not automatically inserted.</small></div>
        <div className="two-col"><div className="field"><label htmlFor="thesis-topic">2. Focused topic</label><input id="thesis-topic" value={topic} onChange={(event) => setTopic(event.target.value.slice(0, 180))} placeholder="e.g. later high-school start times" required /><small>{topic.length}/180</small></div><div className="field"><label htmlFor="thesis-claim">3. Claim or controlling idea</label><textarea id="thesis-claim" value={claim} onChange={(event) => setClaim(event.target.value.slice(0, 280))} placeholder="e.g. public high schools should begin later" rows={2} required /><small>{claim.length}/280</small></div></div>
        <fieldset className="reasons"><legend>4. Reasons or analytical points</legend><p>Enter only points you can support with evidence in the paper.</p>{reasons.map((reason, index) => <div key={index}><label htmlFor={`reason-${index}`}>Reason {index + 1}</label><input id={`reason-${index}`} value={reason} onChange={(event) => updateReason(index, event.target.value.slice(0, 220))} placeholder="A specific reason, factor, or interpretive point" required={index === 0} /><button type="button" onClick={() => removeReason(index)} disabled={reasons.length === 1} aria-label={`Remove reason ${index + 1}`}>×</button></div>)}<button type="button" className="add" onClick={addReason} disabled={reasons.length === 4}>+ Add reason</button></fieldset>
        <div className="two-col"><div className="field"><label htmlFor="counterargument">Strongest counterargument <span>optional</span></label><textarea id="counterargument" value={counterargument} onChange={(event) => setCounterargument(event.target.value.slice(0, 240))} placeholder="A fair objection your paper will address" rows={2} /></div><div className="field"><label htmlFor="qualifier">Qualification <span>optional</span></label><select id="qualifier" value={qualifier} onChange={(event) => setQualifier(event.target.value)}>{QUALIFIERS.map((value) => <option key={value} value={value}>{value || 'No qualification'}</option>)}</select><small>A qualifier can prevent an absolute or overstated claim.</small></div></div>
        {message && <p className="message" role="status">{message}</p>}
        <div className="actions"><button type="button" className="text" onClick={loadExample}>Load example</button><button type="button" className="secondary" onClick={clearAll}>Clear</button><button type="submit" className="primary">Create three drafts</button></div>
      </form>
    </section>

    {drafts.length > 0 && <section id="thesis-drafts" className="draft-section"><div className="section-heading"><div><span>Editable results</span><h3>Choose a frame, then make it yours</h3></div><p>These are sentence structures—not researched conclusions.</p></div><div className="draft-grid">{drafts.map((draft, index) => <article key={draft.frame}><div><span>{draft.frame}</span><small>{draft.note}</small></div><textarea value={draft.text} onChange={(event) => updateDraft(index, event.target.value)} rows={5} aria-label={`${draft.frame} thesis draft`} /><footer><span>{draft.text.trim().split(/\s+/).filter(Boolean).length} words</span><button type="button" onClick={() => copyDraft(draft.text)}>Copy draft</button></footer></article>)}</div>
      <aside className="review"><h4>Before submitting, ask:</h4><ul><li>Does this directly answer the assignment prompt?</li><li>Could a reasonable reader challenge or refine the central claim?</li><li>Can each reason become a body section supported by credible evidence?</li><li>Is the scope realistic for the assigned word count?</li><li>Does the final wording sound like you and follow your institution’s AI policy?</li></ul></aside>
    </section>}

    <style jsx>{`
      .thesis-builder{display:grid;gap:28px}.builder-card{overflow:hidden;border:1px solid #dbe4f0;border-radius:22px;background:var(--bg-white);box-shadow:var(--shadow-card)}header{padding:30px;background:linear-gradient(135deg,#172554,#312e81);color:white}header span,.section-heading span{font-size:.73rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#c4b5fd}header h2{margin:7px 0 9px;font-size:clamp(1.55rem,4vw,2.25rem);line-height:1.12}header p{max-width:780px;margin:0;color:#e0e7ff}form{display:grid;gap:22px;padding:26px}fieldset{min-width:0;margin:0;border:0}.type-picker legend,.reasons legend{margin-bottom:10px;font-weight:900}.type-picker>div{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.type-picker button{display:grid;gap:5px;min-height:92px;padding:14px;border:1px solid var(--border-light);border-radius:13px;background:var(--bg-section);color:var(--text-main);text-align:left;cursor:pointer}.type-picker button[aria-pressed=true]{border-color:#6366f1;background:#eef2ff;color:#312e81;box-shadow:0 0 0 2px #c7d2fe}.type-picker small,.field small,.reasons p{color:var(--text-secondary)}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px}.field{display:grid;gap:7px}.field label,.reasons label{font-weight:850}.field label span{font-size:.75rem;font-weight:600;color:var(--text-secondary)}input,textarea,select{width:100%;border:1px solid var(--border-dark);border-radius:11px;padding:12px 13px;background:var(--bg-white);color:var(--text-main);font:inherit;resize:vertical}input:focus,textarea:focus,select:focus{outline:3px solid #c7d2fe;border-color:#6366f1}.field small{font-size:.72rem;text-align:right}.reasons{display:grid;gap:10px;padding:17px;border:1px solid var(--border-light);border-radius:15px;background:var(--bg-section)}.reasons legend{padding:0 7px}.reasons p{margin:-5px 0 3px;font-size:.82rem}.reasons>div{display:grid;grid-template-columns:75px 1fr 38px;gap:8px;align-items:center}.reasons>div button{height:38px;border:1px solid var(--border-light);border-radius:9px;background:var(--bg-white);font-size:1.25rem;cursor:pointer}.reasons .add{justify-self:start;border:0;background:transparent;color:#4338ca;font-weight:850;cursor:pointer}.message{margin:0;padding:12px 14px;border-radius:10px;background:#eef2ff;color:#3730a3}.actions{display:flex;justify-content:flex-end;gap:10px}.actions button,.draft-grid footer button{min-height:44px;padding:0 18px;border-radius:10px;font-weight:850;cursor:pointer}.actions .text{margin-right:auto;border:0;background:transparent;color:#4338ca}.secondary{border:1px solid var(--border-light);background:var(--bg-white)}.primary,.draft-grid footer button{border:0;background:#4338ca;color:white}.draft-section{scroll-margin-top:24px}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:16px}.section-heading span{color:#4f46e5}.section-heading h3{margin:5px 0 0;font-size:1.45rem}.section-heading p{margin:0;color:var(--text-secondary)}.draft-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.draft-grid article{display:grid;grid-template-rows:auto 1fr auto;gap:12px;padding:17px;border:1px solid var(--border-light);border-radius:16px;background:var(--bg-white);box-shadow:var(--shadow-sm)}.draft-grid article>div{display:grid;gap:3px}.draft-grid article>div span{font-weight:900;color:#4338ca}.draft-grid article>div small{color:var(--text-secondary)}.draft-grid textarea{min-height:150px;line-height:1.55}.draft-grid footer{display:flex;justify-content:space-between;align-items:center;color:var(--text-secondary);font-size:.78rem}.draft-grid footer button{min-height:38px}.review{margin-top:18px;padding:20px;border-radius:16px;background:#f0fdf4;border:1px solid #bbf7d0}.review h4{margin:0 0 10px;color:#166534}.review ul{display:grid;gap:7px;margin:0;padding-left:20px;color:#28533a}@media(max-width:800px){.draft-grid{grid-template-columns:1fr}.two-col{grid-template-columns:1fr}.section-heading{align-items:start;flex-direction:column}.section-heading p{font-size:.85rem}}@media(max-width:620px){header,form{padding:18px}.type-picker>div{grid-template-columns:1fr}.type-picker button{min-height:auto}.reasons>div{grid-template-columns:1fr 38px}.reasons label{grid-column:1/-1}.actions{display:grid;grid-template-columns:1fr 1fr}.actions .text{margin:0}.actions .primary{grid-column:1/-1}.actions button{width:100%}}
    `}</style>
  </div>;
}
