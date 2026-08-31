'use client';
import { useState } from 'react';
import { getXLSX } from '../utils.js';

// ─── Template definitions ─────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'srs',
    icon: '📋', name: 'SRS — Software Requirements Specification',
    desc: 'Complete SRS template with functional/non-functional requirements, scope, constraints, assumptions and acceptance criteria.',
    category: 'BA Documents',
    sheets: [
      { name: 'Cover', data: [
        ['Software Requirements Specification (SRS)'],
        ['Project Name:', ''],
        ['Version:', '1.0'],
        ['Date:', new Date().toLocaleDateString()],
        ['Prepared By:', ''],
        ['Reviewed By:', ''],
        ['Status:', 'Draft'],
      ]},
      { name: 'Functional Requirements', data: [
        ['REQ_ID','Module','Requirement Description','Priority','Status','Acceptance Criteria','Notes'],
        ['FR-001','Authentication','Users shall be able to log in with email and password','High','Open','Login succeeds with valid credentials; shows error on invalid',''],
        ['FR-002','Dashboard','System shall display summary KPIs on the home dashboard','High','Open','KPIs load within 2 seconds',''],
        ['FR-003','Reports','Users shall export reports to PDF and Excel formats','Medium','Open','Export produces valid file with all data',''],
        ['FR-004','','','','','',''],
        ['FR-005','','','','','',''],
      ]},
      { name: 'Non-Functional Requirements', data: [
        ['NFR_ID','Category','Requirement','Metric','Priority','Status'],
        ['NFR-001','Performance','Page load time < 3 seconds under normal load','< 3s at 100 concurrent users','High','Open'],
        ['NFR-002','Security','All passwords must be stored as bcrypt hashes','OWASP compliant hashing','Critical','Open'],
        ['NFR-003','Availability','System uptime ≥ 99.5%','Monthly uptime SLA','High','Open'],
        ['NFR-004','Scalability','Support up to 10,000 concurrent users','Load test result','Medium','Open'],
        ['NFR-005','Usability','UI must pass WCAG 2.1 AA accessibility','Automated + manual audit','Medium','Open'],
      ]},
      { name: 'Use Cases', data: [
        ['UC_ID','Use Case Name','Actor','Preconditions','Main Flow','Alternate Flow','Postconditions'],
        ['UC-001','User Login','Registered User','User has an active account','1. User navigates to login\n2. Enters email & password\n3. System validates\n4. System redirects to dashboard','Invalid credentials: show error message','User is authenticated and session created'],
        ['UC-002','Generate Report','Manager','User is logged in','1. Navigate to Reports\n2. Select report type\n3. Set date range\n4. Click Generate\n5. Download file','No data: show "No data for selected range"','Report file is created'],
      ]},
      { name: 'Assumptions & Constraints', data: [
        ['ID','Type','Description','Impact','Owner'],
        ['A-001','Assumption','Users have a modern web browser (Chrome, Edge, Firefox latest)','Low — standard requirement','Dev Team'],
        ['A-002','Assumption','All users have internet access','High — offline mode not required','Product Owner'],
        ['C-001','Constraint','System must be built on existing AWS infrastructure','Medium — limits tech choices','Architecture'],
        ['C-002','Constraint','Budget is fixed at $X — no scope creep','High — must prioritise features','Project Manager'],
      ]},
      { name: 'Glossary', data: [
        ['Term','Definition','Source'],
        ['SRS','Software Requirements Specification — formal document describing system requirements','IEEE 830'],
        ['Functional Requirement','A requirement describing what the system SHALL do','IEEE 830'],
        ['Non-Functional Requirement','A requirement describing system quality attributes (performance, security, etc.)','IEEE 830'],
        ['Acceptance Criteria','Conditions that must be met for a requirement to be accepted as complete','Agile / BABOK'],
      ]},
    ],
  },
  {
    id: 'brd',
    icon: '📄', name: 'BRD — Business Requirements Document',
    desc: 'Business Requirements Document with problem statement, business objectives, stakeholder analysis and high-level requirements.',
    category: 'BA Documents',
    sheets: [
      { name: 'Executive Summary', data: [
        ['Business Requirements Document (BRD)'],
        ['Project Name:', ''],
        ['Business Sponsor:', ''],
        ['BA Author:', ''],
        ['Date:', new Date().toLocaleDateString()],
        ['Version:', '1.0'],
      ]},
      { name: 'Problem Statement', data: [
        ['Section','Content'],
        ['Current State','Describe what the business does today and the pain points'],
        ['Problem','What specific problem needs to be solved?'],
        ['Impact','What is the cost/risk of NOT solving this?'],
        ['Proposed Solution','High-level description of the proposed solution'],
        ['Success Criteria','How will we know the project is successful?'],
        ['Out of Scope','What is explicitly NOT being done?'],
      ]},
      { name: 'Stakeholders', data: [
        ['Name','Role','Department','Interest','Influence','Contact'],
        ['','Project Sponsor','Executive','High','High',''],
        ['','Business Analyst','IT / Business','High','Medium',''],
        ['','End Users','Operations','High','Low',''],
        ['','IT Manager','IT','Medium','High',''],
      ]},
      { name: 'Business Requirements', data: [
        ['BR_ID','Category','Business Requirement','Priority','Stakeholder','Status','Notes'],
        ['BR-001','Process','System must reduce manual data entry by 80%','Must Have','Operations','Open',''],
        ['BR-002','Reporting','Finance team needs daily P&L report by 8am','Must Have','Finance','Open',''],
        ['BR-003','Compliance','All data changes must be auditable for 7 years','Must Have','Compliance','Open',''],
        ['BR-004','Integration','System must integrate with existing SAP ERP','Should Have','IT','Open',''],
        ['BR-005','UX','Mobile-friendly interface for field staff','Could Have','Operations','Open',''],
      ]},
      { name: 'Cost-Benefit Analysis', data: [
        ['Item','Type','Year 1','Year 2','Year 3','Notes'],
        ['Development Cost','Cost','$0','$0','$0','Estimated development hours × rate'],
        ['Infrastructure','Cost','$0','$0','$0','Cloud hosting, licences'],
        ['Training','Cost','$0','$0','$0','Staff training hours'],
        ['Labour Saving','Benefit','$0','$0','$0','Hours saved × hourly rate'],
        ['Error Reduction','Benefit','$0','$0','$0','Cost of current errors'],
        ['Net Benefit','=SUM','','','',''],
      ]},
    ],
  },
  {
    id: 'rtm',
    icon: '🔗', name: 'RTM — Requirements Traceability Matrix',
    desc: 'Full traceability matrix linking business requirements → functional requirements → test cases → status.',
    category: 'BA Documents',
    sheets: [
      { name: 'RTM', data: [
        ['BR_ID','Business Requirement','FR_ID','Functional Requirement','Design Doc Ref','Test Case ID','Test Status','UAT Status','Sign-Off','Notes'],
        ['BR-001','Reduce manual data entry by 80%','FR-001','Auto-import data from source system','DD-001','TC-001,TC-002','Pass','Pass','✓',''],
        ['BR-001','Reduce manual data entry by 80%','FR-002','Validate imported data before saving','DD-001','TC-003','Pass','Pending','',''],
        ['BR-002','Daily P&L report by 8am','FR-003','Scheduled report generation at 7:45am','DD-002','TC-004,TC-005','Fail','','','Retry logic needed'],
        ['BR-003','Audit trail for 7 years','FR-004','Log all data change events with user/timestamp','DD-003','TC-006','Pass','Pass','✓',''],
        ['','','','','','','','','',''],
      ]},
      { name: 'Test Cases', data: [
        ['TC_ID','FR_ID','Test Description','Test Steps','Expected Result','Actual Result','Status','Tester','Date'],
        ['TC-001','FR-001','Import CSV file successfully','1. Upload CSV\n2. Click Import\n3. Check data loaded','All rows imported, no errors','','Not Run','',''],
        ['TC-002','FR-001','Reject invalid CSV format','1. Upload non-CSV file\n2. Click Import','Error message displayed','','Not Run','',''],
        ['TC-003','FR-002','Validate required fields','1. Import file with blank mandatory fields','Validation error shown','','Not Run','',''],
        ['TC-004','FR-003','Report generates at scheduled time','1. Wait for 7:45am\n2. Check report exists','Report in output folder','','Not Run','',''],
      ]},
      { name: 'Coverage Summary', data: [
        ['Metric','Count','Status'],
        ['Total Business Requirements','','=COUNTA(RTM!A2:A100)-1'],
        ['Total Functional Requirements','',''],
        ['Test Cases Written','',''],
        ['Tests Passed','',''],
        ['Tests Failed','',''],
        ['Tests Not Run','',''],
        ['Requirements with Full Coverage','',''],
        ['Requirements Missing Tests','',''],
      ]},
    ],
  },
  {
    id: 'mis',
    icon: '📊', name: 'MIS Report — Monthly Management Information',
    desc: 'Monthly MIS report template with KPI dashboard, variance analysis and trend sheet.',
    category: 'Reports',
    sheets: [
      { name: 'Dashboard', data: [
        ['Monthly MIS Report — ' + new Date().toLocaleString('default',{month:'long',year:'numeric'})],
        [''],
        ['KPI','Target','Actual','Variance','Variance %','Status'],
        ['Revenue','','','=D4-C4','=IF(C4>0,E4/C4*100,0)','=IF(F4>=0,"✅ On Track","🔴 Below Target")'],
        ['Gross Margin %','','','=D5-C5','=IF(C5>0,E5/C5*100,0)','=IF(F5>=0,"✅ On Track","🔴 Below Target")'],
        ['Operating Cost','','','=D6-C6','=IF(C6>0,E6/C6*100,0)','=IF(F6<=0,"✅ Under Budget","🔴 Over Budget")'],
        ['Customer Count','','','=D7-C7','=IF(C7>0,E7/C7*100,0)','=IF(F7>=0,"✅ On Track","🔴 Below Target")'],
        ['NPS Score','','','=D8-C8','=IF(C8>0,E8/C8*100,0)','=IF(F8>=0,"✅ On Track","🔴 Below Target")'],
        ['Open Support Tickets','','','=D9-C9','=IF(C9>0,E9/C9*100,0)','=IF(F9<=0,"✅ Improving","🔴 Increasing")'],
      ]},
      { name: 'Raw Data', data: [
        ['Month','Revenue','Costs','Gross Margin','Customers','NPS','Tickets'],
        ['Jan','','','=C2-D2','','',''],
        ['Feb','','','=C3-D3','','',''],
        ['Mar','','','=C4-D4','','',''],
        ['Apr','','','=C5-D5','','',''],
        ['May','','','=C6-D6','','',''],
        ['Jun','','','=C7-D7','','',''],
        ['Jul','','','=C8-D8','','',''],
        ['Aug','','','=C9-D9','','',''],
        ['Sep','','','=C10-D10','','',''],
        ['Oct','','','=C11-D11','','',''],
        ['Nov','','','=C12-D12','','',''],
        ['Dec','','','=C13-D13','','',''],
        ['TOTAL','=SUM(B2:B13)','=SUM(C2:C13)','=SUM(D2:D13)','=SUM(E2:E13)','=AVERAGE(F2:F13)','=SUM(G2:G13)'],
      ]},
      { name: 'Variance Analysis', data: [
        ['Item','Budget','Actual','Variance','Variance %','Root Cause','Action Required'],
        ['Revenue','','','=C2-B2','=IF(B2>0,D2/B2*100,0)','',''],
        ['COGS','','','=C3-B3','=IF(B3>0,D3/B3*100,0)','',''],
        ['Salaries','','','=C4-B4','=IF(B4>0,D4/B4*100,0)','',''],
        ['Marketing','','','=C5-B5','=IF(B5>0,D5/B5*100,0)','',''],
        ['Operations','','','=C6-B6','=IF(B6>0,D6/B6*100,0)','',''],
        ['Total','=SUM(B2:B6)','=SUM(C2:C6)','=C7-B7','=IF(B7>0,D7/B7*100,0)','',''],
      ]},
    ],
  },
  {
    id: 'issue_log',
    icon: '🐛', name: 'Issue Log & Bug Tracker',
    desc: 'Project issue tracker with priority, severity, status, owner and resolution tracking.',
    category: 'Project Management',
    sheets: [
      { name: 'Issue Log', data: [
        ['Issue_ID','Title','Category','Priority','Severity','Status','Reported By','Assigned To','Date Reported','Target Date','Resolution Date','Description','Root Cause','Resolution','Notes'],
        ['ISS-001','Login page timeout error','Bug','High','Critical','Open','QA Team','Dev Team',new Date().toLocaleDateString(),'','','Users get logged out after 5 minutes of inactivity unexpectedly','Session timeout set too low in config','',''],
        ['ISS-002','Export to PDF missing header','Bug','Medium','Major','In Progress','User','Dev Team',new Date().toLocaleDateString(),'','','PDF export does not include company header logo','','Fix in progress',''],
        ['ISS-003','Add bulk import feature','Enhancement','Low','Minor','Backlog','Product','Dev Team','','','','Allow importing 1000+ records via CSV','N/A — enhancement','',''],
      ]},
      { name: 'Summary', data: [
        ['Status','Count'],
        ['Open','=COUNTIF(\'Issue Log\'!F:F,"Open")'],
        ['In Progress','=COUNTIF(\'Issue Log\'!F:F,"In Progress")'],
        ['Resolved','=COUNTIF(\'Issue Log\'!F:F,"Resolved")'],
        ['Closed','=COUNTIF(\'Issue Log\'!F:F,"Closed")'],
        ['Backlog','=COUNTIF(\'Issue Log\'!F:F,"Backlog")'],
        ['',''],
        ['Priority','Count'],
        ['Critical','=COUNTIF(\'Issue Log\'!D:D,"Critical")'],
        ['High','=COUNTIF(\'Issue Log\'!D:D,"High")'],
        ['Medium','=COUNTIF(\'Issue Log\'!D:D,"Medium")'],
        ['Low','=COUNTIF(\'Issue Log\'!D:D,"Low")'],
      ]},
    ],
  },
  {
    id: 'effort',
    icon: '⏱️', name: 'Effort Estimation — Story Points & Hours',
    desc: 'Sprint effort estimation sheet with story points, hours, resource allocation and velocity tracking.',
    category: 'Project Management',
    sheets: [
      { name: 'Sprint Estimation', data: [
        ['Feature / User Story','Module','Story Points','Estimated Hours','Assigned To','Complexity','Status','Notes'],
        ['User authentication (login/logout)','Auth','3','8','Dev 1','Low','Planned',''],
        ['Password reset flow','Auth','2','5','Dev 1','Low','Planned',''],
        ['User profile page','Profile','5','12','Dev 2','Medium','Planned',''],
        ['Dashboard KPI cards','Dashboard','8','20','Dev 2','High','Planned',''],
        ['Export to Excel','Reports','3','8','Dev 3','Low','Planned',''],
        ['Export to PDF','Reports','5','13','Dev 3','Medium','Planned',''],
        ['','','','','','','',''],
        ['TOTALS','','=SUM(C2:C7)','=SUM(D2:D7)','','','',''],
      ]},
      { name: 'Resource Planning', data: [
        ['Resource','Role','Available Hours/Sprint','Allocated Hours','Remaining Capacity','Utilisation %'],
        ['Dev 1','Frontend','80','=SUMIF(\'Sprint Estimation\'!E:E,A2,\'Sprint Estimation\'!D:D)','=C2-D2','=IF(C2>0,D2/C2*100,0)'],
        ['Dev 2','Backend','80','=SUMIF(\'Sprint Estimation\'!E:E,A3,\'Sprint Estimation\'!D:D)','=C3-D3','=IF(C3>0,D3/C3*100,0)'],
        ['Dev 3','Full Stack','80','=SUMIF(\'Sprint Estimation\'!E:E,A4,\'Sprint Estimation\'!D:D)','=C4-D4','=IF(C4>0,D4/C4*100,0)'],
        ['QA','QA Engineer','60','0','=C5-D5','=IF(C5>0,D5/C5*100,0)'],
        ['BA','Business Analyst','40','0','=C6-D6','=IF(C6>0,D6/C6*100,0)'],
      ]},
      { name: 'Velocity History', data: [
        ['Sprint','Committed Points','Completed Points','Velocity %','Notes'],
        ['Sprint 1','','','=IF(B2>0,C2/B2*100,0)',''],
        ['Sprint 2','','','=IF(B3>0,C3/B3*100,0)',''],
        ['Sprint 3','','','=IF(B4>0,C4/B4*100,0)',''],
        ['Sprint 4','','','=IF(B5>0,C5/B5*100,0)',''],
        ['Average','=AVERAGE(B2:B5)','=AVERAGE(C2:C5)','=IF(B6>0,C6/B6*100,0)',''],
      ]},
    ],
  },
  {
    id: 'change_log',
    icon: '📝', name: 'Change Log & Version History',
    desc: 'Document version control log with change descriptions, author, review and approval status.',
    category: 'BA Documents',
    sheets: [
      { name: 'Change Log', data: [
        ['Version','Date','Changed By','Reviewed By','Approved By','Section Changed','Change Description','Reason for Change','Status'],
        ['1.0',new Date().toLocaleDateString(),'','','','All','Initial draft created','Project kickoff','Draft'],
        ['1.1','','','','','Requirements','Updated FR-003 acceptance criteria','Stakeholder feedback','Under Review'],
        ['2.0','','','','','All','Major revision after UAT feedback','UAT findings','Draft'],
      ]},
      { name: 'Open Action Items', data: [
        ['Action_ID','Description','Owner','Due Date','Priority','Status','Date Completed','Notes'],
        ['ACT-001','Get sign-off on Section 3 from Finance','Finance Lead','','High','Open','',''],
        ['ACT-002','Clarify NFR-002 metric with Security team','Security','','High','Open','',''],
        ['ACT-003','Add glossary terms for new modules','BA','','Low','Open','',''],
      ]},
    ],
  },
];

export default function BATemplatesTab({ setSheets, setFileName, setActiveTab, setActiveSheet, showToast }) {
  const [category, setCategory] = useState('All');
  const [generating, setGenerating] = useState(null);

  const categories = ['All', ...new Set(TEMPLATES.map(t => t.category))];
  const filtered = category === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === category);

  const generate = async (tpl) => {
    setGenerating(tpl.id);
    try {
      const XLSX = await getXLSX();
      const wb = XLSX.utils.book_new();
      tpl.sheets.forEach(sh => {
        const ws = XLSX.utils.aoa_to_sheet(sh.data);
        // Style the header row (bold) — basic column widths
        const cols = sh.data[0]?.length || 5;
        ws['!cols'] = Array(cols).fill(null).map(() => ({ wch: 22 }));
        XLSX.utils.book_append_sheet(wb, ws, sh.name);
      });
      XLSX.writeFile(wb, `${tpl.id}_template_${Date.now()}.xlsx`);
      showToast(`✓ Downloaded "${tpl.name}" template`);
    } catch (e) {
      showToast('Download failed: ' + e.message, 'error');
    } finally {
      setGenerating(null);
    }
  };

  const openInEditor = (tpl) => {
    setSheets(tpl.sheets.map(sh => ({ name: sh.name, data: sh.data, formulas: null })));
    setFileName(`${tpl.id}_template.xlsx`);
    setActiveSheet(0);
    setActiveTab('edit');
    showToast(`Opened "${tpl.name}" in editor`, 'info');
  };

  return (
    <div>
      <p style={{ fontSize:'.88rem', color:'var(--text-secondary)', marginBottom:16 }}>
        One-click professional templates for Business Analysts and project teams. Open in the editor to customise, or download as .xlsx immediately.
      </p>

      {/* Category filter */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            style={{ padding:'5px 14px', borderRadius:20, border:'1px solid var(--border-light)',
              background: category===c ? '#16a34a' : 'var(--bg-main)',
              color: category===c ? '#fff' : 'var(--text-primary)',
              cursor:'pointer', fontSize:'.82rem', fontFamily:'inherit', transition:'all .15s' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.map(tpl => (
          <div key={tpl.id} className="xd-card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:'1.8rem', flexShrink:0 }}>{tpl.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'.9rem', marginBottom:4 }}>{tpl.name}</div>
                <span className="xd-badge" style={{ background:'#dbeafe', color:'#1d4ed8', marginBottom:6, display:'inline-block' }}>{tpl.category}</span>
                <p style={{ fontSize:'.8rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{tpl.desc}</p>
                <div style={{ fontSize:'.75rem', color:'var(--text-tertiary)', marginTop:4 }}>
                  {tpl.sheets.length} sheet{tpl.sheets.length!==1?'s':''}: {tpl.sheets.map(s=>s.name).join(', ')}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
              <button className="xd-btn primary" style={{ flex:1, justifyContent:'center' }}
                onClick={() => generate(tpl)} disabled={generating===tpl.id}>
                {generating===tpl.id ? '…' : '⬇ Download .xlsx'}
              </button>
              <button className="xd-btn" style={{ flex:1, justifyContent:'center' }}
                onClick={() => openInEditor(tpl)}>
                ✏️ Open in Editor
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
