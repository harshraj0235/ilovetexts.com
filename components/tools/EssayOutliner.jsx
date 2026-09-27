'use client';

import { useState } from 'react';

const TYPES = {
  argumentative: 'Position + evidence + counterargument',
  analytical: 'Interpretation + evidence + analysis',
  expository: 'Focused explanation + supporting details',
  comparison: 'Point-by-point comparison using shared criteria',
};
const clamp = (number, min, max) => Math.min(max, Math.max(min, number));

function allocateWords(total, sectionCount) {
  const intro = Math.round(total * 0.12);
  const conclusion = Math.round(total * 0.1);
  const bodyTotal = total - intro - conclusion;
  const base = Math.floor(bodyTotal / sectionCount);
  return { intro, conclusion, bodies: Array.from({ length: sectionCount }, (_, index) => index === sectionCount - 1 ? bodyTotal - (base * (sectionCount - 1)) : base) };
}

export default function EssayOutliner() {
  const [topic, setTopic] = useState('');
  const [prompt, setPrompt] = useState('');
  const [essayType, setEssayType] = useState('argumentative');
  const [thesis, setThesis] = useState('');
  const [targetWords, setTargetWords] = useState(1200);
  const [bodyCount, setBodyCount] = useState(3);
  const [mainPoints, setMainPoints] = useState(['', '', '']);
  const [includeCounter, setIncludeCounter] = useState(true);
  const [outline, setOutline] = useState([]);
  const [message, setMessage] = useState('');

  const changeBodyCount = (nextCount) => {
    const count = clamp(Number(nextCount), 2, 6);
    setBodyCount(count);
    setMainPoints((current) => Array.from({ length: count }, (_, index) => current[index] || ''));
  };
  const updatePoint = (index, value) => setMainPoints((current) => current.map((point, pointIndex) => pointIndex === index ? value : point));

  const sectionPrompts = (point, index) => {
    if (essayType === 'comparison') return [`Criterion: ${point || `[comparison criterion ${index + 1}]`}`, 'Subject A: relevant evidence or example', 'Subject B: comparable evidence or example', 'Analysis: explain the meaningful similarity or difference', 'Link: connect this comparison to the thesis'];
    if (essayType === 'analytical') return [`Topic sentence: ${point || `[interpretive point ${index + 1}]`}`, 'Evidence: quotation, detail, data, or source to examine', 'Analysis: explain how the evidence supports the interpretation', 'Qualification or alternative reading', 'Link to the thesis and next section'];
    if (essayType === 'expository') return [`Controlling point: ${point || `[explanatory point ${index + 1}]`}`, 'Necessary definition or context', 'Specific example, fact, or process detail', 'Explanation of significance or relationship', 'Transition to the next point'];
    return [`Topic sentence: ${point || `[supporting claim ${index + 1}]`}`, 'Evidence: credible source, data, quotation, or example', 'Reasoning: explain why the evidence supports this claim', 'Qualification: limits or conditions of the claim', 'Link back to the thesis'];
  };

  const generateOutline = (event) => {
    event.preventDefault();
    if (!topic.trim()) { setMessage('Enter a focused topic before building the outline.'); return; }
    const counterEnabled = essayType === 'argumentative' && includeCounter;
    const bodySections = bodyCount + (counterEnabled ? 1 : 0);
    const budget = allocateWords(clamp(Number(targetWords) || 1200, 300, 10000), bodySections);
    const generated = [{ id: crypto.randomUUID(), kind: 'intro', title: 'Introduction', words: budget.intro, items: ['Opening context: use a relevant problem, tension, finding, or scene', `Focused topic: ${topic.trim()}`, 'Essential background the reader needs—avoid a full literature review', `Working thesis: ${thesis.trim() || '[state the central claim, interpretation, or controlling idea]'}`, `Assignment check: ${prompt.trim() || '[confirm that the thesis answers the prompt]'}`] }];
    mainPoints.forEach((point, index) => generated.push({ id: crypto.randomUUID(), kind: 'body', title: `Body section ${index + 1}`, words: budget.bodies[index], items: sectionPrompts(point.trim(), index) }));
    if (counterEnabled) generated.push({ id: crypto.randomUUID(), kind: 'counter', title: 'Counterargument and response', words: budget.bodies.at(-1), items: ['Present the strongest opposing view fairly and specifically', 'Evidence or reasoning that makes the objection credible', 'Response: concede, qualify, or rebut without misrepresenting the view', 'Explain how the response refines or strengthens the thesis', 'Transition to the conclusion'] });
    generated.push({ id: crypto.randomUUID(), kind: 'conclusion', title: 'Conclusion', words: budget.conclusion, items: ['Synthesize the reasoning rather than repeating each paragraph', 'Restate the thesis with the nuance established by the evidence', 'Explain the broader significance, implication, or next question', 'Do not introduce unsupported evidence at the end'] });
    setOutline(generated); setMessage('Outline created. Replace every bracket and evidence prompt with your own research.');
    requestAnimationFrame(() => document.getElementById('outline-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const updateTitle = (id, title) => setOutline((current) => current.map((section) => section.id === id ? { ...section, title } : section));
  const updateItem = (id, index, value) => setOutline((current) => current.map((section) => section.id === id ? { ...section, items: section.items.map((item, itemIndex) => itemIndex === index ? value : item) } : section));
  const addItem = (id) => setOutline((current) => current.map((section) => section.id === id ? { ...section, items: [...section.items, ''] } : section));
  const removeItem = (id, index) => setOutline((current) => current.map((section) => section.id === id ? { ...section, items: section.items.filter((_, itemIndex) => itemIndex !== index) } : section));
  const moveSection = (index, direction) => setOutline((current) => {
    const nextIndex = index + direction;
    if (nextIndex <= 0 || nextIndex >= current.length - 1) return current;
    const updated = [...current]; [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]]; return updated;
  });
  const outlineText = () => [`Essay outline: ${topic}`, `Type: ${essayType}`, `Target: ${targetWords} words`, prompt ? `Prompt: ${prompt}` : '', thesis ? `Thesis: ${thesis}` : '', '', ...outline.flatMap((section, index) => [`${index + 1}. ${section.title} (~${section.words} words)`, ...section.items.map((item) => `   - ${item}`), ''])].filter((line) => line !== '').join('\n');
  const copyOutline = async () => { await navigator.clipboard.writeText(outlineText()); setMessage('Editable outline copied to the clipboard.'); };
  const downloadOutline = () => {
    const blob = new Blob([outlineText()], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'essay-outline.txt'; link.click(); URL.revokeObjectURL(url);
  };
  const clearAll = () => { setTopic(''); setPrompt(''); setThesis(''); setBodyCount(3); setMainPoints(['', '', '']); setOutline([]); setMessage(''); };

  return <div className="outliner">
    <section className="setup" aria-labelledby="outline-title"><header><span>Private planning workspace</span><h2 id="outline-title">Map claims, evidence, analysis, and word budget</h2><p>This browser tool builds an editable structure from your ideas. It does not write the essay and never invents research, quotations, or citations.</p></header><form onSubmit={generateOutline}>
      <div className="type-grid">{Object.entries(TYPES).map(([value, description]) => <button type="button" key={value} aria-pressed={essayType === value} onClick={() => setEssayType(value)}><strong>{value === 'comparison' ? 'Compare & contrast' : value}</strong><small>{description}</small></button>)}</div>
      <div className="form-grid"><label>Assignment prompt <span>optional</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value.slice(0, 600))} rows={3} placeholder="Paste the question or task you must answer…" /></label><label>Focused essay topic<input value={topic} onChange={(event) => setTopic(event.target.value.slice(0, 180))} placeholder="e.g. effects of later school start times" required /></label><label>Working thesis <span>optional</span><textarea value={thesis} onChange={(event) => setThesis(event.target.value.slice(0, 400))} rows={3} placeholder="Your central claim, interpretation, or controlling idea…" /></label><div className="numbers"><label>Target words<input type="number" min="300" max="10000" step="50" value={targetWords} onChange={(event) => setTargetWords(event.target.value)} /></label><label>Main body sections<select value={bodyCount} onChange={(event) => changeBodyCount(event.target.value)}>{[2,3,4,5,6].map((count) => <option key={count}>{count}</option>)}</select></label></div></div>
      <fieldset className="points"><legend>Main points</legend><p>Give each body section one clear job. Blank fields remain editable placeholders.</p>{mainPoints.map((point, index) => <label key={index}>Section {index + 1}<input value={point} onChange={(event) => updatePoint(index, event.target.value.slice(0, 240))} placeholder={essayType === 'comparison' ? 'Shared criterion for comparison' : 'Claim, interpretation, or explanatory point'} /></label>)}</fieldset>
      {essayType === 'argumentative' && <label className="counter"><input type="checkbox" checked={includeCounter} onChange={(event) => setIncludeCounter(event.target.checked)} /> Include a dedicated counterargument and response section</label>}
      {message && <p className="message" role="status">{message}</p>}<div className="actions"><button type="button" className="secondary" onClick={clearAll}>Clear</button><button type="submit" className="primary">Build editable outline</button></div>
    </form></section>

    {outline.length > 0 && <section id="outline-workspace" className="workspace"><div className="workspace-head"><div><span>Outline workspace</span><h3>{outline.length} sections · {Number(targetWords).toLocaleString()}-word plan</h3></div><div><button type="button" onClick={copyOutline}>Copy</button><button type="button" onClick={downloadOutline}>Download .txt</button></div></div><div className="sections">{outline.map((section, sectionIndex) => <article key={section.id}><div className="section-top"><span>{sectionIndex + 1}</span><input value={section.title} onChange={(event) => updateTitle(section.id, event.target.value)} aria-label={`Section ${sectionIndex + 1} title`} /><strong>~{section.words} words</strong>{section.kind === 'body' && <div><button type="button" onClick={() => moveSection(sectionIndex, -1)} aria-label="Move section up">↑</button><button type="button" onClick={() => moveSection(sectionIndex, 1)} aria-label="Move section down">↓</button></div>}</div><div className="items">{section.items.map((item, itemIndex) => <div key={itemIndex}><textarea value={item} onChange={(event) => updateItem(section.id, itemIndex, event.target.value)} rows={2} aria-label={`${section.title} item ${itemIndex + 1}`} /><button type="button" onClick={() => removeItem(section.id, itemIndex)} aria-label={`Remove item ${itemIndex + 1}`}>×</button></div>)}<button type="button" className="add" onClick={() => addItem(section.id)}>+ Add planning note</button></div></article>)}</div><aside><strong>Evidence check:</strong> the outline contains research slots, not sources. Verify every fact and quotation, record citation details while researching, and follow your assignment’s required citation style.</aside></section>}

    <style jsx>{`
      .outliner{display:grid;gap:28px}.setup{overflow:hidden;border:1px solid var(--border-light);border-radius:22px;background:var(--bg-white);box-shadow:var(--shadow-card)}header{padding:30px;background:linear-gradient(135deg,#123d32,#176b54);color:white}header span,.workspace-head span{font-size:.72rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#99f6e4}header h2{margin:7px 0 8px;font-size:clamp(1.55rem,4vw,2.2rem)}header p{max-width:760px;margin:0;color:#d1fae5}form{display:grid;gap:21px;padding:25px}.type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.type-grid button{display:grid;gap:5px;padding:13px;border:1px solid var(--border-light);border-radius:12px;background:var(--bg-section);color:var(--text-main);text-align:left;text-transform:capitalize;cursor:pointer}.type-grid button[aria-pressed=true]{border-color:#059669;background:#ecfdf5;box-shadow:0 0 0 2px #a7f3d0}.type-grid small{color:var(--text-secondary);text-transform:none}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px}.form-grid>label:first-child{grid-row:span 2}.form-grid label,.points label,.numbers label{display:grid;align-content:start;gap:7px;font-weight:850}.form-grid label span{font-size:.72rem;color:var(--text-secondary)}input,textarea,select{width:100%;padding:11px 12px;border:1px solid var(--border-dark);border-radius:10px;background:var(--bg-white);color:var(--text-main);font:inherit;resize:vertical}input:focus,textarea:focus,select:focus{outline:3px solid #a7f3d0;border-color:#059669}.numbers{display:grid;grid-template-columns:1fr 1fr;gap:10px}.points{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:0;padding:17px;border:1px solid var(--border-light);border-radius:14px}.points legend{padding:0 7px;font-weight:900}.points p{grid-column:1/-1;margin:-5px 0 2px;color:var(--text-secondary);font-size:.82rem}.counter{display:flex;align-items:center;gap:10px;font-weight:800}.counter input{width:20px;height:20px}.message{margin:0;padding:12px 14px;border-radius:10px;background:#ecfdf5;color:#166534}.actions{display:flex;justify-content:flex-end;gap:10px}.actions button,.workspace-head button{min-height:44px;padding:0 18px;border-radius:10px;font-weight:850;cursor:pointer}.secondary,.workspace-head button{border:1px solid var(--border-light);background:var(--bg-white);color:var(--text-main)}.primary{border:0;background:#047857;color:white}.workspace{scroll-margin-top:24px}.workspace-head{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:15px}.workspace-head span{color:#047857}.workspace-head h3{margin:5px 0 0}.workspace-head>div:last-child{display:flex;gap:8px}.sections{display:grid;gap:13px}.sections article{overflow:hidden;border:1px solid var(--border-light);border-radius:15px;background:var(--bg-white);box-shadow:var(--shadow-sm)}.section-top{display:grid;grid-template-columns:34px 1fr auto auto;align-items:center;gap:9px;padding:12px 15px;background:var(--bg-section);border-bottom:1px solid var(--border-light)}.section-top>span{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#d1fae5;color:#065f46;font-weight:900}.section-top>input{padding:7px 9px;font-weight:900}.section-top>strong{font-size:.78rem;color:#047857}.section-top>div{display:flex;gap:4px}.section-top button,.items>div button{width:32px;height:32px;border:1px solid var(--border-light);border-radius:8px;background:var(--bg-white);cursor:pointer}.items{display:grid;gap:8px;padding:15px}.items>div{display:grid;grid-template-columns:1fr 34px;gap:8px}.items textarea{min-height:54px}.items .add{justify-self:start;border:0;background:transparent;color:#047857;font-weight:850;cursor:pointer}.workspace aside{margin-top:15px;padding:15px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;color:#713f12;font-size:.85rem}@media(max-width:800px){.type-grid{grid-template-columns:1fr 1fr}.form-grid{grid-template-columns:1fr}.form-grid>label:first-child{grid-row:auto}.workspace-head{align-items:start;flex-direction:column}}@media(max-width:570px){header,form{padding:18px}.type-grid,.points{grid-template-columns:1fr}.points p{grid-column:auto}.numbers{grid-template-columns:1fr 1fr}.workspace-head>div:last-child{width:100%}.workspace-head button{flex:1}.section-top{grid-template-columns:34px 1fr}.section-top>strong{grid-column:2}.section-top>div{grid-column:2}.items{padding:11px}}
    `}</style>
  </div>;
}
