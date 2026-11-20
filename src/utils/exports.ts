import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLocalDateString, INDEX_STRATEGIES } from '../data/knowledgeBase';
import type { ClientCase } from '../types/portal';
import {
  fmtCurrencyExact,
  getReadinessSummary,
  isQualifiedPlan,
  maskValue,
  parseNum
} from './calculations';

export function buildPlainTextSummary(c: ClientCase, privacyMask: boolean, advisorMode: boolean): string {
  const { igo, rmdBlocked, label: statusBanner, countText } = getReadinessSummary(c);

  const lines = [
    '==============================================================',
    'THE FIN-LINE AGENCY | GFI ADVISORY — CLIENT APPLICATION SUMMARY',
    '==============================================================',
    `Status: ${statusBanner} | IGO Checks: ${countText} (${igo.scorePct}%)`,
    `Track: ${c.track === 'annuity' ? 'Retirement Savings & Income (Annuity)' : c.track === 'life' ? 'Life Insurance / IUL / Final Expense' : '—'}`,
    `Target Product Series: ${c.targetProduct}`,
    `Primary Objectives: ${c.goals.join(', ') || 'None selected'}`,
    '',
    '--- 1. OWNER, ANNUITANT & PATRIOT ACT ID ---',
    `Ownership Type: ${c.ownershipType || '—'}`,
    ...(c.ownershipType === 'Trust'
      ? [
          `Trust Name: ${c.trustName} (Est. ${c.trustDate}) | Trustee: ${c.trusteeName} | TIN: ${maskValue(c.trustTaxId, privacyMask, 'ssn')}`
        ]
      : []),
    `Owner Name: ${c.ownerName || '—'} | Gender: ${c.ownerGender || '—'} | DOB: ${c.ownerDOB || '—'} (Age: ${igo.ownerAge ?? '—'})`,
    `Owner SSN/TIN: ${maskValue(c.ownerSSN, privacyMask, 'ssn')} | Marital: ${c.ownerMarital || '—'}`,
    `Address: ${c.ownerStreet || '—'}, ${c.ownerCity || ''}, ${c.ownerState || ''} ${c.ownerZip || ''} (${c.yearsAtAddress || '—'} yrs)`,
    ...(parseNum(c.yearsAtAddress) < 5 && c.prevAddress ? [`Previous Address: ${c.prevAddress}`] : []),
    `Phone: ${c.ownerPhone || '—'} | Email: ${c.ownerEmail || '—'}`,
    `Annuitant: ${c.annuitantSameAsOwner ? 'Same as Owner' : `${c.annuitantName} (DOB: ${c.annuitantDOB}, Rel: ${c.annuitantRelationship})`}`,
    `Photo ID: ${c.idType || '—'} (${c.idState || '—'}) #${maskValue(c.idNumber, privacyMask, 'id')} | Exp: ${c.idExpDate || '—'}`,
    '',
    '--- 2. BENEFICIARIES ---',
    ...c.beneficiaries.map(
      (b, i) =>
        `  ${i + 1}. [${b.type}] ${b.name || '—'} (${b.relationship || '—'}) | Share: ${b.share}% | DOB: ${b.dob || '—'} | Contact: ${b.contact || '—'}`
    ),
    '',
    '--- 3. NAIC SUITABILITY & FINANCIAL PROFILE (FORM 4106) ---',
    `Employment: ${c.employmentStatus || '—'} | Occupation: ${c.occupation || '—'} | Tax Bracket: ${c.taxBracket || '—'}`,
    `Household Income: ${fmtCurrencyExact(c.annualIncome)}/yr (${c.incomeSources.join(', ') || '—'}) | Monthly Expenses: ${fmtCurrencyExact(c.monthlyExpenses)}/mo`,
    `Total Net Worth (excl. home): ${fmtCurrencyExact(c.totalNetWorth)} | Liquid Net Worth: ${fmtCurrencyExact(c.liquidNetWorth)}`,
    `Post-Funding Liquid Reserve: ${c.liquidNetWorth ? fmtCurrencyExact(igo.remainingLiquid) : '—'} | Existing Life/Annuity: ${fmtCurrencyExact(c.existingLifeAnnuity)}`,
    `Risk Tolerance: ${c.riskTolerance || '—'} | Horizon: ${c.timeHorizon || '—'} | Income Start: ${c.incomeStartTiming || '—'}`,
    `10% Free Withdrawal Plan: ${c.freeWithdrawalPlan || '—'} | Existing LTC Coverage: ${c.hasLTC || '—'}`,
    ...(c.track === 'life' || c.dualReview
      ? [
          `Life/IUL Pre-Screen: Face ${fmtCurrencyExact(c.desiredFaceAmount)} | ${c.heightFt || '—'}'${c.heightIn || '—'}" ${c.weightLbs || '—'} lbs | Nicotine: ${c.nicotineProfile || '—'} | Conditions: ${c.healthConditions.join(', ') || '—'}`
        ]
      : []),
    '',
    '--- 4. FUNDING, ROLLOVER & INDEX ALLOCATIONS ---',
    `Tax Qualification: ${c.taxQualification || '—'} | Proposed Deposit: ${fmtCurrencyExact(c.estimatedPremium)}`,
    `Funding Method: ${c.fundingMethod || '—'} | Replacement: ${c.isReplacement || '—'}`,
    ...(igo.ownerAge !== null && igo.ownerAge >= 73 && isQualifiedPlan(c.taxQualification)
      ? [`Age 73+ Current-Year RMD Satisfied: ${c.rmdSatisfied || 'Not Answered'}${rmdBlocked ? ' [BLOCKED — FORM 4083 / RMD REQUIRED]' : ''}`]
      : []),
    ...(c.currentCarrier || c.currentAccountValue
      ? [
          `Surrendering Carrier/Custodian: ${c.currentCarrier || '—'} | Acct #: ${c.currentPolicyNumber || '—'} | Value: ${fmtCurrencyExact(c.currentAccountValue)} | Surrender %: ${c.currentSurrenderPct || '0'}% | Statement Ready: ${c.hasRecentStatement ? 'Yes' : 'No'}`
        ]
      : []),
    ...(c.track === 'annuity' || c.dualReview
      ? [
          c.allocationMode === 'strategist'
            ? 'Index Allocations: Finalize exact whole-number percentages together'
            : 'Custom Index Allocations: ' +
              INDEX_STRATEGIES.map((s) => `${s.label}: ${c.allocations[s.key]}%`)
                .filter((x) => !x.endsWith(': 0%'))
                .join(' | ')
        ]
      : []),
    '',
    `Client Electronic Signature: ${c.clientSignature || 'Unsigned'} | Signed At: ${c.signedCityState || '—'} on ${c.signatureDate}`,
    ...(advisorMode && c.advisorNotes ? [`Strategist Notes: ${c.advisorNotes}`] : [])
  ];
  return lines.join('\n');
}

export function generateFactFinderPDF(c: ClientCase, privacyMask: boolean, advisorMode: boolean): void {
  const { igo, rmdBlocked, label: headerStatus, countText } = getReadinessSummary(c);
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Navy Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 74, 'F');
  doc.setFillColor(rmdBlocked ? 225 : 245, rmdBlocked ? 29 : 158, rmdBlocked ? 72 : 11);
  doc.rect(0, 74, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('The FIN-Line Agency | GFI Advisory', 36, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Confidential Client Application & Suitability Fact-Finder', 36, 50);

  doc.setTextColor(rmdBlocked ? 254 : 251, rmdBlocked ? 205 : 191, rmdBlocked ? 211 : 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${headerStatus}  |  IGO: ${countText}`, pageWidth - 36, 32, { align: 'right' });
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${c.signatureDate || getLocalDateString()}`, pageWidth - 36, 48, { align: 'right' });

  let cursorY = 92;

  const ensureSpace = (needed: number) => {
    if (cursorY + needed > pageHeight - 40) {
      doc.addPage();
      cursorY = 42;
    }
  };

  // Explicit RMD Hold Warning Box in PDF if blocked
  if (rmdBlocked) {
    doc.setDrawColor(225, 29, 72);
    doc.setFillColor(255, 241, 242);
    doc.roundedRect(36, cursorY, pageWidth - 72, 42, 5, 5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(159, 18, 57);
    doc.text(
      `COMPLIANCE HOLD (Age ${igo.ownerAge} — ${c.taxQualification}): Current-year RMD is NOT satisfied.`,
      46,
      cursorY + 16
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.text(
      'Required before IRA transfer: Satisfy current-year RMD or submit Form 4083 prior to transfer.',
      46,
      cursorY + 30
    );
    cursorY += 54;
  }

  // Section 1: Track & Objectives (Full-width colSpan header)
  autoTable(doc, {
    startY: cursorY,
    showHead: 'firstPage',
    head: [[{ content: '1. Application Track & Financial Objectives', colSpan: 2 }]],
    body: [
      [
        'Application Track',
        c.track === 'annuity'
          ? 'Retirement Savings & Income (Annuity / Rollover)'
          : c.track === 'life'
            ? 'Life Insurance & Family Protection'
            : '—'
      ],
      ['Target Product Series', c.targetProduct || '—'],
      ['Primary Objectives', c.goals.join(', ') || '—'],
      ['Dual Review', c.dualReview ? 'Yes (Retirement Income + Life Insurance)' : 'No']
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Section 2: Owner & Patriot Act ID
  ensureSpace(155);
  autoTable(doc, {
    startY: cursorY,
    showHead: 'firstPage',
    head: [[{ content: '2. Owner, Annuitant & USA PATRIOT Act Verification (Form 2000)', colSpan: 2 }]],
    body: [
      ['Ownership Registration', `${c.ownershipType || '—'}${c.ownershipType === 'Trust' ? ` — ${c.trustName} (Trustee: ${c.trusteeName})` : ''}`],
      ['Primary Owner', `${c.ownerName || '—'}  |  DOB: ${c.ownerDOB || '—'} ${igo.ownerAge !== null ? `(Age ${igo.ownerAge})` : ''}  |  ${c.ownerGender || '—'}`],
      ['SSN / TIN & Marital', `${maskValue(c.ownerSSN, privacyMask, 'ssn')}  |  Marital Status: ${c.ownerMarital || '—'}`],
      ['Residential Address', `${c.ownerStreet || '—'}, ${c.ownerCity || ''}, ${c.ownerState || ''} ${c.ownerZip || ''} (${c.yearsAtAddress || '—'} yrs)`],
      ['Contact Details', `Phone: ${c.ownerPhone || '—'}  |  Email: ${c.ownerEmail || '—'}`],
      ['Annuitant / Insured', c.annuitantSameAsOwner ? 'Same as Primary Owner' : `${c.annuitantName || '—'} (DOB: ${c.annuitantDOB || '—'}, Rel: ${c.annuitantRelationship || '—'})`],
      ['Government Photo ID', `${c.idType || '—'} (${c.idState || '—'}) #${maskValue(c.idNumber, privacyMask, 'id')}  |  Expires: ${c.idExpDate || '—'}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Section 3: Beneficiaries (Full-width colSpan banner + clean 2-column layout to guarantee strict text-layer ordering)
  ensureSpace(95);
  autoTable(doc, {
    startY: cursorY,
    showHead: 'firstPage',
    head: [[{ content: '3. Beneficiary Designations', colSpan: 2 }]],
    body: c.beneficiaries.map((b, idx) => [
      `${idx + 1}. ${b.type} Beneficiary (${b.share}%)`,
      `${b.name || '—'}  |  Relationship: ${b.relationship || '—'}  |  DOB: ${b.dob || '—'}${b.contact ? `  |  Contact: ${b.contact}` : ''}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Section 4: Financial Suitability (Strictly after Section 3)
  ensureSpace(175);
  autoTable(doc, {
    startY: cursorY,
    showHead: 'firstPage',
    head: [[{ content: '4. NAIC Financial Suitability & Liquidity Profile (Form 4106)', colSpan: 2 }]],
    body: [
      ['Employment & Tax Bracket', `${c.employmentStatus || '—'} (${c.occupation || '—'})  |  Fed Tax Bracket: ${c.taxBracket || '—'}`],
      ['Income & Expenses', `Annual Gross: ${fmtCurrencyExact(c.annualIncome)} (${c.incomeSources.join(', ') || '—'})  |  Monthly Exp: ${fmtCurrencyExact(c.monthlyExpenses)}`],
      ['Net Worth & Reserves', `Total NW (Excl. Home): ${fmtCurrencyExact(c.totalNetWorth)}  |  Liquid NW: ${fmtCurrencyExact(c.liquidNetWorth)}`],
      [
        'Post-Funding Liquidity',
        c.liquidNetWorth
          ? `${fmtCurrencyExact(igo.remainingLiquid)} remaining${igo.emergencyMonths !== null ? ` (~${igo.emergencyMonths} months expenses)` : ''}`
          : '—'
      ],
      ['Existing Life / Annuity', fmtCurrencyExact(c.existingLifeAnnuity)],
      ['Risk, Horizon & Income', `${c.riskTolerance || '—'}  |  Horizon: ${c.timeHorizon || '—'}  |  Income Start: ${c.incomeStartTiming || '—'}`],
      ['Free Withdrawal / LTC', `${c.freeWithdrawalPlan || '—'}  |  Existing LTC: ${c.hasLTC || '—'}`],
      ...(c.track === 'life' || c.dualReview
        ? [[
            'Life / IUL Health Pre-Screen',
            `Face: ${fmtCurrencyExact(c.desiredFaceAmount)} | ${c.heightFt || '—'}'${c.heightIn || '—'}" ${c.weightLbs || '—'} lbs | Nicotine: ${c.nicotineProfile || '—'} | Health: ${c.healthConditions.join(', ') || '—'}`
          ]]
        : [])
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Section 5: Funding & Allocations (Full-width colSpan banner)
  ensureSpace(160);
  const allocSummary =
    c.allocationMode === 'strategist'
      ? 'Finalize exact whole-number allocations together'
      : INDEX_STRATEGIES.filter((s) => c.allocations[s.key] > 0)
          .map((s) => `${s.shortLabel}: ${c.allocations[s.key]}%`)
          .join(' • ') || '—';

  autoTable(doc, {
    startY: cursorY,
    showHead: 'firstPage',
    head: [[{ content: '5. Funding, Rollover / Replacement & Index Strategy', colSpan: 2 }]],
    body: [
      ['Tax Qualification & Deposit', `${c.taxQualification || '—'}  |  Proposed Deposit: ${fmtCurrencyExact(c.estimatedPremium)}`],
      ['Funding Method & Replacement', `${c.fundingMethod || '—'}  |  Replacement: ${c.isReplacement || '—'}`],
      ...(igo.ownerAge !== null && igo.ownerAge >= 73 && isQualifiedPlan(c.taxQualification)
        ? [[
            'Age 73+ RMD Status',
            `Current-Year RMD Satisfied: ${c.rmdSatisfied || 'Not Answered'}${rmdBlocked ? ' — BLOCKED (Form 4083 / RMD Required)' : ''}`
          ]]
        : []),
      ...(c.currentCarrier || c.currentAccountValue || c.currentPolicyNumber
        ? [[
            'Surrendering Institution',
            `${c.currentCarrier || '—'} (#${c.currentPolicyNumber || '—'}) | Est. Value: ${fmtCurrencyExact(c.currentAccountValue)} | Surrender: ${c.currentSurrenderPct || '0'}%`
          ]]
        : []),
      ...(c.track === 'annuity' || c.dualReview ? [['Index Crediting Allocations', allocSummary]] : [])
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 4.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  // Section 6: Signature Block
  ensureSpace(90);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(36, cursorY, pageWidth - 72, 68, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('6. Client Fact-Finder Acknowledgment & Electronic Signature', 46, cursorY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Client confirms that personal, beneficiary, and financial suitability data above is accurate for formal policy application preparation.',
    46,
    cursorY + 32
  );

  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Signature: ${c.clientSignature || '______________________'}`, 46, cursorY + 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Signed At: ${c.signedCityState || '—'}   |   Date: ${c.signatureDate || getLocalDateString()}`, pageWidth - 46, cursorY + 54, { align: 'right' });

  if (advisorMode && c.advisorNotes) {
    cursorY += 80;
    ensureSpace(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text('Internal Strategist Notes:', 36, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(c.advisorNotes, pageWidth - 72), 36, cursorY + 13);
  }

  const cleanName = (c.ownerName || 'client').trim().replace(/[^a-z0-9]/gi, '_');
  doc.save(`FINLine_FactFinder_${cleanName}_${c.signatureDate || getLocalDateString()}.pdf`);
}

export function exportCaseJSON(c: ClientCase): void {
  const cleanName = (c.ownerName || 'client').trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `finline_intake_${cleanName}_${c.signatureDate || getLocalDateString()}.json`);
}

export function exportCasesCSV(cases: ClientCase[]): void {
  const headers = [
    'CaseID','Status','Track','TargetProduct','OwnershipType','OwnerName','OwnerDOB','OwnerState','OwnerPhone','OwnerEmail',
    'TaxQualification','EstimatedPremium','FundingMethod','AnnualIncome','MonthlyExpenses','TotalNetWorth','LiquidNetWorth',
    'RiskTolerance','TimeHorizon','IsReplacement','CurrentCarrier','CurrentPolicyNumber','ClientSignature','SignatureDate'
  ];

  const rows = cases.map((c) =>
    [
      c.id, c.status, c.track, c.targetProduct, c.ownershipType, c.ownerName, c.ownerDOB, c.ownerState, c.ownerPhone, c.ownerEmail,
      c.taxQualification, c.estimatedPremium, c.fundingMethod, c.annualIncome, c.monthlyExpenses, c.totalNetWorth, c.liquidNetWorth,
      c.riskTolerance, c.timeHorizon, c.isReplacement, c.currentCarrier, c.currentPolicyNumber, c.clientSignature, c.signatureDate
    ]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );

  const csvContent = headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const today = getLocalDateString();
  triggerDownload(blob, `finline_cases_export_${today}.csv`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
