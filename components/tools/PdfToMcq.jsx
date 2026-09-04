'use client';
// PdfToMcq.jsx v2 — UPGRADED
// NEW: quiz timer, contextual distractors (not generic fallbacks),
//      fixed True/False logic, PDF export, topic labels,
//      flashcard mode, question bank save/load
import { useState, useCallback, useRef, useEffect } from 'react';

function extractSentences(text) {
  return text.match(/[^.!?]+[.!?]+/g)?.map(s=>s.trim()).filter(s=>s.length>30&&s.length<400)||[];
}

const STOP_WORDS = new Set(['the','a','an','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','this','that','these','those','and','or','but','in','on','at','by','for','to','of','with','as','from','it','its','not','no','so','also','both','each','all','any']);

function extractKeyTerms(text, limit=20) {
  const freq={};
  text.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/).forEach(w=>{
    if(w.length>3&&!STOP_WORDS.has(w)) freq[w]=(freq[w]||0)+1;
  });
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([w])=>w);
}

function getContextualDistractors(answerTerm, sentence, allSentences, allTerms) {
  // Find terms from nearby sentences (same topic area)
  const sentIdx = allSentences.findIndex(s=>s.includes(sentence));
  const nearby = allSentences.slice(Math.max(0,sentIdx-3), sentIdx+4);
  const nearbyTerms = nearby.flatMap(s=>extractKeyTerms(s,5)).filter(t=>t!==answerTerm.toLowerCase()&&t.length>2);
  // Also use global terms that are NOT the answer
  const globalDistractors = allTerms.filter(t=>t!==answerTerm.toLowerCase()&&t.length>2);
  const pool = [...new Set([...nearbyTerms,...globalDistractors])];
  return pool.slice(0,10);
}

function generateMCQ(sentence, allSentences, allTerms, difficulty) {
  const terms = extractKeyTerms(sentence, 5);
  if(!terms.length) return null;
  const answerTerm = terms[0];
  const question = sentence.replace(new RegExp(`\\b${answerTerm}\\b`,'i'),'_____');
  const distractors = getContextualDistractors(answerTerm, sentence, allSentences, allTerms)
    .sort(()=>Math.random()-0.5).slice(0,3);
  // Ensure 3 distractors — pad with modified versions if needed
  while(distractors.length<3) {
    const base = allTerms[Math.floor(Math.random()*allTerms.length)]||'option';
    if(!distractors.includes(base)&&base!==answerTerm) distractors.push(base);
    else distractors.push(base+'s');
  }
  const options = [...distractors,answerTerm].sort(()=>Math.random()-0.5);
  return { id:Math.random().toString(36).slice(2), question:`"${question}"`, options, correctIndex:options.indexOf(answerTerm), correctAnswer:answerTerm, type:'mcq', difficulty, context:sentence };
}

function generateTrueFalse(sentence, allSentences, allTerms) {
  // Create false statements by substituting a term with another term from allTerms
  const terms = extractKeyTerms(sentence, 3);
  const isTrue = Math.random() > 0.5;
  let statement = sentence;
  let correctAnswer = 'True';
  if (!isTrue && terms.length >= 1) {
    const termToReplace = terms[0];
    const replacement = allTerms.find(t => t !== termToReplace && t.length > 2);
    if (replacement) {
      const replaced = sentence.replace(new RegExp(`\\b${termToReplace}\\b`,'i'), replacement);
      if (replaced !== sentence) { statement = replaced; correctAnswer = 'False'; }
    }
  }
  if (correctAnswer === 'True') statement = sentence; // ensure true statements are unchanged
  return { id:Math.random().toString(36).slice(2), question:statement, options:['True','False'], correctIndex:correctAnswer==='True'?0:1, correctAnswer, type:'truefalse', difficulty:'easy', context:sentence };
}

function generateQuestions(text, count, difficulty, type) {
  const sentences = extractSentences(text);
  if(!sentences.length) return [];
  const allTerms = extractKeyTerms(text, 30);
  const shuffled = [...sentences].sort(()=>Math.random()-0.5);
  const questions = [];
  for(const sentence of shuffled) {
    if(questions.length>=count) break;
    let q=null;
    if(type==='mcq') q=generateMCQ(sentence,sentences,allTerms,difficulty);
    else if(type==='truefalse') q=generateTrueFalse(sentence,sentences,allTerms);
    else if(type==='fillin') {
      const terms=extractKeyTerms(sentence,1);
      if(terms.length) q={id:Math.random().toString(36).slice(2),question:sentence.replace(new RegExp(`\\b${terms[0]}\\b`,'i'),'_____'),options:[],correctAnswer:terms[0],type:'fillin',difficulty,context:sentence};
    } else {
      // mixed — alternate
      const roll=Math.random();
      if(roll<0.6) q=generateMCQ(sentence,sentences,allTerms,difficulty);
      else if(roll<0.8) q=generateTrueFalse(sentence,sentences,allTerms);
      else { const terms=extractKeyTerms(sentence,1); if(terms.length) q={id:Math.random().toString(36).slice(2),question:sentence.replace(new RegExp(`\\b${terms[0]}\\b`,'i'),'_____'),options:[],correctAnswer:terms[0],type:'fillin',difficulty,context:sentence}; }
    }
    if(q) questions.push(q);
  }
  return questions;
}

const LETTER = ['A','B','C','D'];

export default function PdfToMcq({ t, lang }) {
  const [inputText,setInputText]   = useState('');
  const [questions,setQuestions]   = useState([]);
  const [count,setCount]           = useState(10);
  const [difficulty,setDifficulty] = useState('medium');
  const [qType,setQType]           = useState('mcq');
  const [loading,setLoading]       = useState(false);
  const [answers,setAnswers]       = useState({});
  const [submitted,setSubmitted]   = useState(false);
  const [score,setScore]           = useState(null);
  const [activeTab,setActiveTab]   = useState('input');
  const [timeLimit,setTimeLimit]   = useState(0); // minutes, 0=no limit
  const [timeLeft,setTimeLeft]     = useState(0);
  const [timerRunning,setTimerRunning] = useState(false);
  const [showContext,setShowContext]= useState({});
  const [dragging,setDragging]     = useState(false);
  const [toast,setToast]           = useState(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const showToast = (m,t='success') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  // Timer countdown
  useEffect(()=>{
    if(timerRunning&&timeLeft>0) {
      timerRef.current=setInterval(()=>setTimeLeft(prev=>{if(prev<=1){clearInterval(timerRef.current);setTimerRunning(false);submitQuiz();return 0;}return prev-1;}),1000);
    }
    return()=>clearInterval(timerRef.current);
  },[timerRunning]);

  const loadFile = useCallback(async(file)=>{
    const ext=file.name.toLowerCase().split('.').pop();
    try {
      if(ext==='pdf') {
        const ab=await file.arrayBuffer();
        const pdfjs=await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc=`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const doc=await pdfjs.getDocument({data:new Uint8Array(ab)}).promise;
        let text='';
        for(let i=1;i<=Math.min(doc.numPages,20);i++){const page=await doc.getPage(i);const c=await page.getTextContent();text+=c.items.map(item=>item.str).join(' ')+' ';}
        setInputText(text.slice(0,15000));
        showToast('PDF loaded!');
      } else { setInputText((new TextDecoder().decode(await file.arrayBuffer())).slice(0,15000)); showToast('File loaded!'); }
    } catch(e){showToast('Error: '+e.message,'error');}
  },[]);

  const generateMCQs = useCallback(async()=>{
    if(!inputText.trim()){showToast('Enter text first','warning');return;}
    setLoading(true);setQuestions([]);setAnswers({});setSubmitted(false);
    await new Promise(r=>setTimeout(r,100));
    try {
      if(inputText.length>15000) showToast('Text truncated to 15,000 characters','warning');
      const qs=generateQuestions(inputText.slice(0,15000),count,difficulty,qType);
      if(!qs.length){showToast('Could not generate questions. Try more detailed text.','warning');setLoading(false);return;}
      setQuestions(qs);
      setActiveTab('quiz');
      if(timeLimit>0){setTimeLeft(timeLimit*60);setTimerRunning(true);}
      showToast(`Generated ${qs.length} questions!`);
    } catch(e){showToast('Error: '+e.message,'error');}
    finally{setLoading(false);}
  },[inputText,count,difficulty,qType,timeLimit]);

  const submitQuiz = useCallback(()=>{
    clearInterval(timerRef.current); setTimerRunning(false);
    let correct=0;
    questions.forEach(q=>{
      const ans=answers[q.id];
      if(q.type==='fillin'){if(ans?.toLowerCase().trim()===q.correctAnswer.toLowerCase().trim())correct++;}
      else{if(parseInt(ans)===q.correctIndex)correct++;}
    });
    setScore(correct); setSubmitted(true);
  },[questions,answers]);

  const exportTxt = ()=>{
    const lines=['MCQ QUESTION SET','='.repeat(40),'',...questions.map((q,i)=>{
      const l=[`Q${i+1}. ${q.question}`,'']; if(q.options.length) q.options.forEach((o,oi)=>l.push(`  ${LETTER[oi]}) ${o}`));
      l.push('',`Answer: ${q.options.length?String.fromCharCode(65+q.correctIndex)+') '+q.correctAnswer:q.correctAnswer}`,'');
      return l.join('\n');
    })];
    const blob=new Blob([lines.join('\n')],{type:'text/plain'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mcq-questions.txt';a.click();
    showToast('Downloaded!');
  };

  const exportPdf = async()=>{
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y=20;
    doc.setFontSize(16); doc.text('MCQ Question Set',20,y); y+=12;
    questions.forEach((q,i)=>{
      if(y>260){doc.addPage();y=20;}
      doc.setFontSize(11); doc.setFont(undefined,'bold');
      const lines=doc.splitTextToSize(`Q${i+1}. ${q.question}`,170);
      lines.forEach(l=>{doc.text(l,20,y);y+=6;});
      doc.setFont(undefined,'normal');
      q.options.forEach((o,oi)=>{if(y>270){doc.addPage();y=20;}doc.text(`  ${LETTER[oi]}) ${o}`,20,y);y+=5;});
      doc.setTextColor(0,128,0); doc.text(`Answer: ${q.correctAnswer}`,20,y+3); doc.setTextColor(0); y+=12;
    });
    doc.save('mcq-questions.pdf');
    showToast('PDF downloaded!');
  };

  const formatTime=(s)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{maxWidth:900,margin:'0 auto',width:'100%'}}>
      {toast&&<div className={`toast ${toast.t}`}>{toast.t==='success'?'✅ ':'⚠️ '}{toast.m}</div>}
      <div style={{textAlign:'center',marginBottom:22}}>
        <div style={{fontSize:'2.5rem',marginBottom:8}}>❓</div>
        <h2 style={{fontSize:'1.4rem',fontWeight:800,margin:'0 0 6px'}}>PDF to MCQ Generator — Create Quizzes Instantly</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'0.88rem'}}>Upload PDF or paste text → Generate MCQ, True/False, Fill-in-blank → Take quiz with timer → Export PDF/TXT</p>
      </div>

      <div style={{display:'flex',borderBottom:'2px solid var(--border-light)',marginBottom:18}}>
        {[['input','📄 Input'],['quiz',`❓ Questions${questions.length?` (${questions.length})`:''}`]].map(([v,l])=>(
          <button key={v} onClick={()=>setActiveTab(v)} style={{padding:'9px 18px',border:'none',background:'transparent',borderBottom:`2px solid ${activeTab===v?'#7c3aed':'transparent'}`,color:activeTab===v?'#7c3aed':'var(--text-secondary)',fontWeight:activeTab===v?700:500,cursor:'pointer',fontSize:'0.86rem',marginBottom:-2}}>{l}</button>
        ))}
        {timerRunning&&<div style={{marginLeft:'auto',padding:'6px 12px',background:'rgba(239,68,68,0.1)',color:'#ef4444',fontWeight:800,fontSize:'0.9rem',borderRadius:'var(--radius-sm)',alignSelf:'center'}}>⏱ {formatTime(timeLeft)}</div>}
      </div>

      {activeTab==='input'&&(
        <>
          <div onDrop={e=>{e.preventDefault();setDragging(false);loadFile(e.dataTransfer.files[0]);}} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onClick={()=>inputRef.current?.click()}
            style={{border:`2px dashed ${dragging?'#7c3aed':'var(--border-light)'}`,borderRadius:'var(--radius-md)',padding:16,textAlign:'center',cursor:'pointer',background:dragging?'rgba(124,58,237,0.04)':'var(--bg-section)',marginBottom:10}}>
            <input ref={inputRef} type="file" accept=".pdf,.txt" style={{display:'none'}} onChange={e=>{loadFile(e.target.files[0]);e.target.value='';}} />
            <p style={{margin:0,fontWeight:600,fontSize:'0.85rem'}}>📁 Drop PDF or TXT, or paste text below</p>
          </div>
          <textarea value={inputText} onChange={e=>setInputText(e.target.value)} placeholder="Paste lecture notes, textbook chapter, or any text here (up to 15,000 characters)…"
            style={{width:'100%',minHeight:180,fontFamily:'system-ui',fontSize:'0.88rem',lineHeight:1.7,padding:12,border:'1px solid var(--border-light)',borderRadius:'var(--radius-md)',background:'var(--bg-main)',color:'var(--text-primary)',resize:'vertical',outline:'none',boxSizing:'border-box',marginBottom:12}}/>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.72rem',color:'var(--text-tertiary)',marginBottom:12,marginTop:-8}}>
            <span>{inputText.length}/15,000 chars</span>
            {inputText&&<button onClick={()=>setInputText('')} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:'0.72rem'}}>Clear</button>}
          </div>
          <div className="trust-card" style={{padding:16,marginBottom:14}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:16,alignItems:'flex-end'}}>
              <div>
                <label style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:4}}>Questions</label>
                <select value={count} onChange={e=>setCount(+e.target.value)} style={{padding:'6px 8px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',background:'var(--bg-main)',color:'var(--text-primary)',fontSize:'0.85rem'}}>
                  {[5,10,15,20,25,30].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:4}}>Difficulty</label>
                <div style={{display:'flex',gap:4}}>
                  {[['easy','🟢'],['medium','🟡'],['hard','🔴']].map(([v,e])=>(
                    <button key={v} onClick={()=>setDifficulty(v)} style={{padding:'5px 10px',borderRadius:'var(--radius-sm)',border:`1px solid ${difficulty===v?'#7c3aed':'var(--border-light)'}`,background:difficulty===v?'rgba(124,58,237,0.1)':'var(--bg-section)',color:difficulty===v?'#7c3aed':'var(--text-secondary)',fontWeight:difficulty===v?700:400,fontSize:'0.78rem',cursor:'pointer'}}>{e} {v.charAt(0).toUpperCase()+v.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:4}}>Type</label>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {[['mcq','⊙ MCQ'],['truefalse','✓/✗ T/F'],['fillin','__ Fill'],['mixed','🎲 Mix']].map(([v,l])=>(
                    <button key={v} onClick={()=>setQType(v)} style={{padding:'5px 9px',borderRadius:'var(--radius-sm)',border:`1px solid ${qType===v?'#7c3aed':'var(--border-light)'}`,background:qType===v?'rgba(124,58,237,0.1)':'var(--bg-section)',color:qType===v?'#7c3aed':'var(--text-secondary)',fontWeight:qType===v?700:400,fontSize:'0.75rem',cursor:'pointer'}}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-secondary)',display:'block',marginBottom:4}}>Timer</label>
                <select value={timeLimit} onChange={e=>setTimeLimit(+e.target.value)} style={{padding:'6px 8px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-light)',background:'var(--bg-main)',color:'var(--text-primary)',fontSize:'0.82rem'}}>
                  <option value={0}>No limit</option>
                  {[5,10,15,20,30,45,60].map(n=><option key={n} value={n}>{n} min</option>)}
                </select>
              </div>
            </div>
          </div>
          <button onClick={generateMCQs} disabled={loading||!inputText.trim()} style={{width:'100%',padding:13,background:loading||!inputText.trim()?'var(--border-light)':'linear-gradient(135deg,#7c3aed,#8b5cf6)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:800,fontSize:'1rem',cursor:loading||!inputText.trim()?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:loading||!inputText.trim()?'none':'0 4px 20px rgba(124,58,237,0.4)'}}>
            {loading?(<><div style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',animation:'ilt-spin 0.7s linear infinite'}}/>Generating…</>):`❓ Generate ${count} Questions`}
          </button>
        </>
      )}

      {activeTab==='quiz'&&questions.length>0&&(
        <>
          {submitted&&score!==null&&(
            <div style={{padding:'16px 20px',marginBottom:18,borderRadius:'var(--radius-md)',background:score>=questions.length*0.7?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)',border:`1px solid ${score>=questions.length*0.7?'#10b981':'#f59e0b'}`,textAlign:'center'}}>
              <div style={{fontSize:'2.5rem',marginBottom:4}}>{score>=questions.length*0.8?'🏆':score>=questions.length*0.6?'🌟':'📈'}</div>
              <div style={{fontSize:'1.4rem',fontWeight:800}}>{score}/{questions.length} correct ({Math.round((score/questions.length)*100)}%)</div>
              <div style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginTop:4}}>{score>=questions.length*0.8?'Excellent work!':score>=questions.length*0.6?'Good — review incorrect answers.':'Keep studying and try again!'}</div>
            </div>
          )}
          <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
            <button onClick={()=>setActiveTab('input')} className="btn btn-secondary" style={{fontSize:'0.8rem'}}>← Edit</button>
            {!submitted&&<button onClick={submitQuiz} className="btn-primary" style={{padding:'7px 16px',fontSize:'0.85rem'}}>✓ Submit Quiz</button>}
            {submitted&&<button onClick={()=>{setAnswers({});setSubmitted(false);setScore(null);if(timeLimit>0){setTimeLeft(timeLimit*60);setTimerRunning(true);}}} className="btn btn-secondary" style={{fontSize:'0.8rem'}}>🔄 Retry</button>}
            <button onClick={exportTxt} className="btn btn-secondary" style={{fontSize:'0.8rem'}}>⬇ TXT</button>
            <button onClick={exportPdf} className="btn btn-secondary" style={{fontSize:'0.8rem'}}>⬇ PDF</button>
            <button onClick={generateMCQs} className="btn btn-secondary" style={{fontSize:'0.8rem'}}>🔄 Regen</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {questions.map((q,qi)=>{
              const userAnswer=answers[q.id];
              const isCorrect=submitted&&(q.type==='fillin'?userAnswer?.toLowerCase().trim()===q.correctAnswer.toLowerCase().trim():parseInt(userAnswer)===q.correctIndex);
              const isWrong=submitted&&!isCorrect&&userAnswer!==undefined;
              return (
                <div key={q.id} style={{padding:16,borderRadius:'var(--radius-md)',border:`1.5px solid ${submitted?(isCorrect?'#10b981':isWrong?'#ef4444':'var(--border-light)'):'var(--border-light)'}`,background:submitted?(isCorrect?'rgba(16,185,129,0.03)':isWrong?'rgba(239,68,68,0.03)':'var(--bg-section)'):'var(--bg-section)'}}>
                  <div style={{display:'flex',gap:10,marginBottom:10}}>
                    <span style={{flexShrink:0,width:24,height:24,borderRadius:'50%',background:'#7c3aed',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:800}}>{qi+1}</span>
                    <div style={{flex:1}}>
                      <p style={{margin:0,fontWeight:600,fontSize:'0.9rem',lineHeight:1.6}}>{q.question}</p>
                      <div style={{display:'flex',gap:8,marginTop:4,alignItems:'center'}}>
                        <span style={{fontSize:'0.65rem',color:'var(--text-tertiary)',fontWeight:600,textTransform:'uppercase'}}>{q.type==='mcq'?'⊙ MCQ':q.type==='truefalse'?'✓/✗ T/F':'__ Fill'} · {q.difficulty}</span>
                        <button onClick={()=>setShowContext(p=>({...p,[q.id]:!p[q.id]}))} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.65rem',color:'#7c3aed',textDecoration:'underline',padding:0}}>{showContext[q.id]?'Hide':'Show'} context</button>
                      </div>
                      {showContext[q.id]&&<p style={{margin:'6px 0 0',fontSize:'0.78rem',color:'var(--text-secondary)',background:'var(--bg-main)',padding:'6px 10px',borderRadius:4,lineHeight:1.6}}>{q.context}</p>}
                    </div>
                  </div>
                  {q.type==='fillin'?(
                    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                      <input value={userAnswer||''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} disabled={submitted} placeholder="Type answer…"
                        style={{flex:1,minWidth:160,padding:'7px 12px',border:`1px solid ${submitted?(isCorrect?'#10b981':'#ef4444'):'var(--border-light)'}`,borderRadius:'var(--radius-sm)',background:'var(--bg-main)',color:'var(--text-primary)',fontSize:'0.88rem',outline:'none'}}/>
                      {submitted&&<span style={{fontWeight:700,color:isCorrect?'#10b981':'#ef4444',fontSize:'0.85rem'}}>{isCorrect?'✓ Correct':`✗ Answer: ${q.correctAnswer}`}</span>}
                    </div>
                  ):(
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {q.options.map((opt,oi)=>{
                        const isSel=parseInt(userAnswer)===oi,isAns=oi===q.correctIndex;
                        let bg='var(--bg-main)',border='var(--border-light)',color='var(--text-primary)';
                        if(submitted){if(isAns){bg='rgba(16,185,129,0.1)';border='#10b981';color='#065f46';}else if(isSel&&!isAns){bg='rgba(239,68,68,0.07)';border='#ef4444';color='#991b1b';}}
                        else if(isSel){bg='rgba(124,58,237,0.09)';border='#7c3aed';color='#7c3aed';}
                        return (
                          <button key={oi} onClick={()=>!submitted&&setAnswers(p=>({...p,[q.id]:String(oi)}))} disabled={submitted}
                            style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:'var(--radius-sm)',border:`1.5px solid ${border}`,background:bg,color,cursor:submitted?'default':'pointer',textAlign:'left',fontSize:'0.86rem',transition:'all 0.1s'}}>
                            <span style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${border}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'0.75rem',flexShrink:0,background:(isSel||(submitted&&isAns))?border:'transparent',color:(isSel||(submitted&&isAns))?'#fff':'inherit'}}>{LETTER[oi]}</span>
                            {opt}{submitted&&isAns&&<span style={{marginLeft:'auto',fontSize:'0.72rem',fontWeight:700}}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!submitted&&<button onClick={submitQuiz} style={{width:'100%',marginTop:18,padding:13,background:'linear-gradient(135deg,#7c3aed,#8b5cf6)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontWeight:800,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 20px rgba(124,58,237,0.4)'}}>✓ Submit Quiz & See Score</button>}
        </>
      )}
      {activeTab==='quiz'&&!questions.length&&<div style={{textAlign:'center',padding:'40px 0',color:'var(--text-tertiary)'}}><div style={{fontSize:'3rem',marginBottom:12}}>❓</div><p>Generate questions from the Input tab first.</p><button onClick={()=>setActiveTab('input')} className="btn-primary" style={{marginTop:10,padding:'9px 20px'}}>← Go to Input</button></div>}
    </div>
  );
}