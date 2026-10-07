'use client';
import BulkGeneratorEngine from './BulkGeneratorEngine';
import s from './BulkGenerator.module.css';

/* ═══════════════════════════════════════════════
   TOOL 2: Bulk Report Card Generator
   Upload student marks → calculate totals →
   generate individual report cards
   ═══════════════════════════════════════════════ */

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Student Name', required: true, sample: 'Aarav Sharma' },
  { key: 'rollNo', label: 'Roll Number', required: true, sample: '101' },
  { key: 'class', label: 'Class / Grade', required: true, sample: '10-A' },
];

const OPTIONAL_FIELDS = [
  { key: 'subject1Name', label: 'Subject 1 Name', sample: 'Mathematics' },
  { key: 'subject1Marks', label: 'Subject 1 Marks', sample: '92' },
  { key: 'subject2Name', label: 'Subject 2 Name', sample: 'Science' },
  { key: 'subject2Marks', label: 'Subject 2 Marks', sample: '88' },
  { key: 'subject3Name', label: 'Subject 3 Name', sample: 'English' },
  { key: 'subject3Marks', label: 'Subject 3 Marks', sample: '85' },
  { key: 'subject4Name', label: 'Subject 4 Name', sample: 'Hindi' },
  { key: 'subject4Marks', label: 'Subject 4 Marks', sample: '90' },
  { key: 'subject5Name', label: 'Subject 5 Name', sample: 'Social Studies' },
  { key: 'subject5Marks', label: 'Subject 5 Marks', sample: '78' },
  { key: 'subject6Name', label: 'Subject 6 Name', sample: 'Computer' },
  { key: 'subject6Marks', label: 'Subject 6 Marks', sample: '95' },
  { key: 'attendance', label: 'Attendance %', sample: '94' },
  { key: 'remarks', label: 'Remarks', sample: 'Excellent performance' },
  { key: 'parentName', label: 'Parent/Guardian Name', sample: 'Mr. Rajesh Sharma' },
];

const SAMPLE_DATA = [
  { 'Student Name': 'Aarav Sharma', 'Roll Number': '101', 'Class / Grade': '10-A', 'Subject 1 Name': 'Mathematics', 'Subject 1 Marks': 92, 'Subject 2 Name': 'Science', 'Subject 2 Marks': 88, 'Subject 3 Name': 'English', 'Subject 3 Marks': 85, 'Subject 4 Name': 'Hindi', 'Subject 4 Marks': 90, 'Subject 5 Name': 'Social Studies', 'Subject 5 Marks': 78, 'Subject 6 Name': 'Computer', 'Subject 6 Marks': 95, 'Attendance %': 94, 'Remarks': 'Excellent student', 'Parent/Guardian Name': 'Mr. Rajesh Sharma' },
  { 'Student Name': 'Priya Patel', 'Roll Number': '102', 'Class / Grade': '10-A', 'Subject 1 Name': 'Mathematics', 'Subject 1 Marks': 76, 'Subject 2 Name': 'Science', 'Subject 2 Marks': 82, 'Subject 3 Name': 'English', 'Subject 3 Marks': 91, 'Subject 4 Name': 'Hindi', 'Subject 4 Marks': 85, 'Subject 5 Name': 'Social Studies', 'Subject 5 Marks': 88, 'Subject 6 Name': 'Computer', 'Subject 6 Marks': 79, 'Attendance %': 97, 'Remarks': 'Good progress', 'Parent/Guardian Name': 'Mrs. Meena Patel' },
];

const DEFAULT_SETTINGS = {
  schoolName: 'Vidya Bharati Public School',
  schoolAddress: 'Sector 12, New Delhi — 110085',
  examName: 'Annual Examination 2026',
  maxMarks: 100,
  passingMarks: 33,
  primaryColor: '#1a365d',
  accentColor: '#e8b931',
  gradingSystem: 'percentage', // percentage | gpa | grade
};

function TemplateEditor({ settings, onChange }) {
  const up = (k, v) => onChange({ ...settings, [k]: v });
  return <>
    <label>School Name <input value={settings.schoolName} onChange={e => up('schoolName', e.target.value)} /></label>
    <label>School Address <input value={settings.schoolAddress} onChange={e => up('schoolAddress', e.target.value)} /></label>
    <label>Exam Name <input value={settings.examName} onChange={e => up('examName', e.target.value)} /></label>
    <label>Max Marks per Subject <input type="number" value={settings.maxMarks} onChange={e => up('maxMarks', parseInt(e.target.value) || 100)} /></label>
    <label>Passing Marks <input type="number" value={settings.passingMarks} onChange={e => up('passingMarks', parseInt(e.target.value) || 33)} /></label>
    <label>Primary Color <input type="color" value={settings.primaryColor} onChange={e => up('primaryColor', e.target.value)} /></label>
    <label>Accent Color <input type="color" value={settings.accentColor} onChange={e => up('accentColor', e.target.value)} /></label>
    <label>Grading System
      <select value={settings.gradingSystem} onChange={e => up('gradingSystem', e.target.value)}>
        <option value="percentage">Percentage</option>
        <option value="gpa">GPA (10-point)</option>
        <option value="grade">Letter Grade</option>
      </select>
    </label>
  </>;
}

function getSubjects(row) {
  const subjects = [];
  for (let i = 1; i <= 6; i++) {
    const name = row[`subject${i}Name`];
    const marks = parseFloat(row[`subject${i}Marks`]);
    if (name && !isNaN(marks)) subjects.push({ name, marks });
  }
  return subjects;
}

function getGrade(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
}

function getGPA(pct) {
  return Math.min(10, (pct / 10)).toFixed(1);
}

async function renderReportCardCanvas(row, mapping, settings, index) {
  const W = 850;
  const H = 1100;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = settings.primaryColor;
  ctx.fillRect(0, 0, W, 110);
  ctx.fillStyle = settings.accentColor;
  ctx.fillRect(0, 110, W, 5);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(settings.schoolName, W / 2, 45);
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText(settings.schoolAddress, W / 2, 68);
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.fillText(settings.examName, W / 2, 96);

  // Student Info
  ctx.textAlign = 'left';
  ctx.fillStyle = '#333';
  ctx.font = '14px Inter, system-ui, sans-serif';
  const infoY = 145;
  ctx.fillText(`Student Name: ${row.name || '—'}`, 40, infoY);
  ctx.fillText(`Roll No: ${row.rollNo || '—'}`, 450, infoY);
  ctx.fillText(`Class: ${row.class || '—'}`, 40, infoY + 24);
  if (row.parentName) ctx.fillText(`Parent/Guardian: ${row.parentName}`, 450, infoY + 24);

  // Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, infoY + 42);
  ctx.lineTo(W - 40, infoY + 42);
  ctx.stroke();

  // Marks Table
  const subjects = getSubjects(row);
  const tableY = infoY + 62;
  const colX = [40, 300, 440, 560, 680];
  const colHeaders = ['Subject', 'Max Marks', 'Obtained', settings.gradingSystem === 'gpa' ? 'GPA' : 'Grade', 'Status'];

  // Table header
  ctx.fillStyle = settings.primaryColor;
  ctx.fillRect(40, tableY, W - 80, 32);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  colHeaders.forEach((h, i) => ctx.fillText(h, colX[i] + 10, tableY + 21));

  // Table rows
  let totalObtained = 0;
  let totalMax = 0;
  subjects.forEach((sub, i) => {
    const rowY = tableY + 32 + i * 34;
    ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#fff';
    ctx.fillRect(40, rowY, W - 80, 34);

    ctx.fillStyle = '#333';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillText(sub.name, colX[0] + 10, rowY + 22);
    ctx.fillText(String(settings.maxMarks), colX[1] + 10, rowY + 22);
    ctx.fillText(String(sub.marks), colX[2] + 10, rowY + 22);

    const pct = (sub.marks / settings.maxMarks) * 100;
    if (settings.gradingSystem === 'gpa') {
      ctx.fillText(getGPA(pct), colX[3] + 10, rowY + 22);
    } else {
      ctx.fillText(getGrade(pct), colX[3] + 10, rowY + 22);
    }

    const pass = sub.marks >= settings.passingMarks;
    ctx.fillStyle = pass ? '#16a34a' : '#dc2626';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillText(pass ? 'PASS' : 'FAIL', colX[4] + 10, rowY + 22);

    totalObtained += sub.marks;
    totalMax += settings.maxMarks;
  });

  // Total row
  const totalRowY = tableY + 32 + subjects.length * 34;
  ctx.fillStyle = settings.primaryColor;
  ctx.fillRect(40, totalRowY, W - 80, 36);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Inter, system-ui, sans-serif';
  ctx.fillText('TOTAL', colX[0] + 10, totalRowY + 24);
  ctx.fillText(String(totalMax), colX[1] + 10, totalRowY + 24);
  ctx.fillText(String(totalObtained), colX[2] + 10, totalRowY + 24);
  const overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  ctx.fillText(`${overallPct.toFixed(1)}%`, colX[3] + 10, totalRowY + 24);
  ctx.fillText(overallPct >= settings.passingMarks ? 'PASS' : 'FAIL', colX[4] + 10, totalRowY + 24);

  // Result Summary
  const summaryY = totalRowY + 60;
  ctx.fillStyle = '#333';
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText(`Total Marks: ${totalObtained} / ${totalMax}`, 40, summaryY);
  ctx.fillText(`Percentage: ${overallPct.toFixed(1)}%`, 300, summaryY);
  ctx.fillText(`Overall Grade: ${getGrade(overallPct)}`, 500, summaryY);

  if (row.attendance) {
    ctx.fillText(`Attendance: ${row.attendance}%`, 40, summaryY + 26);
  }
  if (row.remarks) {
    ctx.fillText(`Remarks: ${row.remarks}`, 300, summaryY + 26);
  }

  // Signature lines
  const sigY = H - 100;
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(40, sigY); ctx.lineTo(200, sigY);
  ctx.moveTo(320, sigY); ctx.lineTo(500, sigY);
  ctx.moveTo(620, sigY); ctx.lineTo(W - 40, sigY);
  ctx.stroke();

  ctx.fillStyle = '#666';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillText('Class Teacher', 70, sigY + 16);
  ctx.fillText('Principal', 380, sigY + 16);
  ctx.fillText("Parent's Signature", 650, sigY + 16);

  // Footer
  ctx.fillStyle = settings.primaryColor;
  ctx.fillRect(0, H - 40, W, 40);
  ctx.fillStyle = '#fff';
  ctx.font = '10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('This is a computer-generated report card. Generated at ilovetexts.com', W / 2, H - 18);

  return canvas;
}

/* React Preview Card */
function ReportCardPreview({ row, settings }) {
  const subjects = getSubjects(row);
  let totalObt = 0, totalMax = 0;
  subjects.forEach(sub => { totalObt += sub.marks; totalMax += settings.maxMarks; });
  const pct = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;

  return (
    <div className={s.cardPreview} style={{ maxWidth: 520, fontSize: 12 }}>
      <div style={{ background: settings.primaryColor, color: '#fff', padding: '16px 20px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{settings.schoolName}</div>
        <div style={{ fontSize: 10, opacity: .7 }}>{settings.schoolAddress}</div>
        <div style={{ fontWeight: 600, marginTop: 4, fontSize: 12, color: settings.accentColor }}>{settings.examName}</div>
      </div>
      <div style={{ padding: '14px 20px', background: '#fff', color: '#333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span><strong>Name:</strong> {row.name || '—'}</span>
          <span><strong>Roll:</strong> {row.rollNo || '—'}</span>
          <span><strong>Class:</strong> {row.class || '—'}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left' }}>Subject</th>
              <th style={{ padding: '6px 8px' }}>Max</th>
              <th style={{ padding: '6px 8px' }}>Marks</th>
              <th style={{ padding: '6px 8px' }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((sub, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '5px 8px' }}>{sub.name}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>{settings.maxMarks}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>{sub.marks}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: sub.marks >= settings.passingMarks ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                  {getGrade((sub.marks / settings.maxMarks) * 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '8px 0', borderTop: '2px solid ' + settings.primaryColor, fontWeight: 600 }}>
          <span>Total: {totalObt}/{totalMax}</span>
          <span>Percentage: {pct.toFixed(1)}%</span>
          <span>Grade: {getGrade(pct)}</span>
        </div>
        {row.remarks && <div style={{ marginTop: 6, fontSize: 11, color: '#666' }}>Remarks: {row.remarks}</div>}
      </div>
    </div>
  );
}

export default function BulkReportCardGenerator() {
  return (
    <div>
      <div className={s.toolHero}>
        <span className={s.toolEyebrow}>📊 Free Bulk Tool</span>
        <h1>Bulk Report Card Generator</h1>
        <p>Upload student marks in Excel — auto-calculate totals, percentages and grades. Generate individual report cards as professional PDFs. Perfect for schools and tuition centres.</p>
      </div>
      <BulkGeneratorEngine
        toolName="Bulk Report Card Generator"
        toolIcon="📊"
        toolDescription="Generate student report cards in bulk"
        requiredFields={REQUIRED_FIELDS}
        optionalFields={OPTIONAL_FIELDS}
        sampleData={SAMPLE_DATA}
        renderPreview={renderReportCardCanvas}
        renderCard={(row, mapping, settings) => <ReportCardPreview row={row} settings={settings} />}
        templateSettings={DEFAULT_SETTINGS}
        templateEditor={TemplateEditor}
        maxRows={500}
        filePrefix="report_card"
      />
    </div>
  );
}
