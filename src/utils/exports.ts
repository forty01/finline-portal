import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INDEX_STRATEGIES } from '../data/knowledgeBase';
import type { ClientCase } from '../types/portal';
import {
  evaluateIGO,
  fmtCurrency,
  isQualifiedPlan,
  maskValue,
  parseNum
} from './calculations';

export function buildPlainTextSummary(c: ClientCase, privacyMask: boolean, advisorMode: boolean): string {
  const igo = evaluateIGO(c);
  const lines = [
    '==============================================================',
    'THE FIN-LINE AGENCY | GFI ADVISORY — FIRELIGHT E-APP FACT-FINDER',
    '==============================================================',
    `Case Status: ${c.status} | IGO Readiness: ${igo.passCount}/${igo.checks.length} (${igo.scorePct}%)`,
    `Track: ${c.track === 'annuity' ? 'Annuity & Retirement Rollover' : 'Life / IUL / Final Expense'}`,
    `Target Product Series: ${c.targetProduct}`,
    `Primary Objectives: ${c.goals.join(', ') || 'None selected'}`,
    '',
    '--- 1. OWNER, ANNUITANT & PATRIOT ACT ID ---',
    `Ownership Type: ${c.ownershipType}`,
    ...(c.ownershipType === 'Trust'
      ? [
          `Trust Name: ${c.trustName} (Est. ${c.trustDate}) | Trustee: ${c.trusteeName} | TIN: ${maskValue(c.trustTaxId, privacyMask, 'ssn')}`
        ]
      : []),
    `Owner Name: ${c.ownerName} | Gender: ${c.ownerGender} | DOB: ${c.ownerDOB} (Age: ${igo.ownerAge ?? '—'})`,
    `Owner SSN/TIN: ${maskValue(c.ownerSSN, privacyMask, 'ssn')} | Marital: ${c.ownerMarital}`,
    `Address: ${c.ownerStreet}, ${c.ownerCity}, ${c.ownerState} ${c.ownerZip} (${c.yearsAtAddress} yrs)`,
    ...(parseNum(c.yearsAtAddress) < 5 && c.prevAddress ? [`Previous Address: ${c.prevAddress}`] : []),
    `Phone: ${c.ownerPhone} | Email: ${c.ownerEmail}`,
    `Annuitant: ${c.annuitantSameAsOwner ? 'Same as Owner' : `${c.annuitantName} (DOB: ${c.annuitantDOB}, Rel: ${c.annuitantRelationship})`}`,
    `Photo ID: ${c.idType} (${c.idState}) #${maskValue(c.idNumber, privacyMask, 'id')} | Exp: ${c.idExpDate}`,
    '',
    '--- 2. BENEFICIARIES ---',
    ...c.beneficiaries.map(
      (b, i) =>
        `  ${i + 1}. [${b.type}] ${b.name} (${b.relationship}) | Share: ${b.share}% | DOB: ${b.dob || '—'} | Contact: ${b.contact || '—'}`
    ),
    '',
    '--- 3. NAIC SUITABILITY & FINANCIAL PROFILE (FORM 4106) ---',
    `Employment: ${c.employmentStatus} | Occupation: ${c.occupation || '—'} | Tax Bracket: ${c.taxBracket}`,
    `Household Income: ${fmtCurrency(c.annualIncome)}/yr (${c.incomeSources.join(', ')}) | Monthly Expenses: ${fmtCurrency(c.monthlyExpenses)}/mo`,
    `Total Net Worth (excl. home): ${fmtCurrency(c.totalNetWorth)} | Liquid Net Worth: ${fmtCurrency(c.liquidNetWorth)}`,
    `Post-Funding Liquid Reserve: ${fmtCurrency(igo.remainingLiquid)} | Existing Life/Annuity: ${fmtCurrency(c.existingLifeAnnuity)}`,
    `Risk Tolerance: ${c.riskTolerance} | Horizon: ${c.timeHorizon} | Income Start: ${c.incomeStartTiming}`,
    `10% Free Withdrawal Plan: ${c.freeWithdrawalPlan} | Existing LTC Coverage: ${c.hasLTC}`,
    ...(c.track === 'life' || c.dualReview
      ? [
          `Life/IUL Pre-Screen: Face ${fmtCurrency(c.desiredFaceAmount)} | ${c.heightFt}'${c.heightIn}" ${c.weightLbs} lbs | Nicotine: ${c.nicotineProfile} | Conditions: ${c.healthConditions.join(', ')}`
        ]
      : []),
    '',
    '--- 4. FUNDING, ROLLOVER & INDEX ALLOCATIONS ---',
    `Tax Qualification: ${c.taxQualification} | Estimated Premium: ${fmtCurrency(c.estimatedPremium)}`,
    `Funding Method: ${c.fundingMethod} | Replacement: ${c.isReplacement}`,
    ...(igo.ownerAge !== null && igo.ownerAge >= 73 && isQualifiedPlan(c.taxQualification)
      ? [`Age 73+ Current-Year RMD Satisfied: ${c.rmdSatisfied}`]
      : []),
    ...(c.currentCarrier
      ? [
          `Surrendering Carrier/Custodian: ${c.currentCarrier} | Acct #: ${c.currentPolicyNumber} | Value: ${fmtCurrency(c.currentAccountValue)} | Surrender %: ${c.currentSurrenderPct}% | Statement Ready: ${c.hasRecentStatement ? 'Yes' : 'No'}`
        ]
      : []),
    ...(c.track === 'annuity'
      ? [
          c.allocationMode === 'strategist'
            ? 'Index Allocations: Finalize exact whole-number percentages with Strategist'
            : 'Custom Index Allocations: ' +
              INDEX_STRATEGIES.map((s) => `${s.label}: ${c.allocations[s.key]}%`)
                .filter((x) => !x.endsWith(': 0%'))
                .join(' | ')
        ]
      : []),
    '',
    `Client Electronic Signature: ${c.clientSignature || 'Unsigned'} | Signed At: ${c.signedCityState} on ${c.signatureDate}`,
    ...(advisorMode && c.advisorNotes ? [`Strategist Notes: ${c.advisorNotes}`] : [])
  ];
  return lines.join('\n');
}

export function generateFactFinderPDF(c: ClientCase, privacyMask: boolean, advisorMode: boolean): void {
  const igo = evaluateIGO(c);
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Navy Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 74, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 74, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('The FIN-Line Agency | GFI Advisory', 36, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Confidential Client Application Intake, Form 2000 & NAIC Form 4106 Suitability Packet', 36, 50);

  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Status: ${c.status.toUpperCase()}  |  IGO: ${igo.passCount}/${igo.checks.length}`, pageWidth - 36, 32, { align: 'right' });
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${c.signatureDate}`, pageWidth - 36, 48, { align: 'right' });

  let cursorY = 96;

  // Section 1: Track & Objectives
  autoTable(doc, {
    startY: cursorY,
    head: [['1. Application Track, Target Product & Objectives', '']],
    body: [
      ['Application Track', c.track === 'annuity' ? 'Annuity & Retirement Rollover' : 'Life Insurance / IUL / Final Expense'],
      ['Target Product Series', c.targetProduct],
      ['Primary Objectives', c.goals.join(', ') || '—'],
      ['Holistic Dual Review', c.dualReview ? 'Yes (Annuity + Life/IUL)' : 'No']
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Section 2: Owner & Patriot Act ID
  autoTable(doc, {
    startY: cursorY,
    head: [['2. Owner, Annuitant & USA PATRIOT Act Verification (Form 2000)', '']],
    body: [
      ['Ownership Registration', `${c.ownershipType}${c.ownershipType === 'Trust' ? ` — ${c.trustName} (Trustee: ${c.trusteeName})` : ''}`],
      ['Primary Owner', `${c.ownerName || '—'}  |  DOB: ${c.ownerDOB || '—'} ${igo.ownerAge !== null ? `(Age ${igo.ownerAge})` : ''}  |  ${c.ownerGender || '—'}`],
      ['SSN / TIN & Marital', `${maskValue(c.ownerSSN, privacyMask, 'ssn')}  |  Marital Status: ${c.ownerMarital}`],
      ['Residential Address', `${c.ownerStreet || '—'}, ${c.ownerCity || ''}, ${c.ownerState} ${c.ownerZip} (${c.yearsAtAddress} yrs)`],
      ['Contact Details', `Phone: ${c.ownerPhone || '—'}  |  Email: ${c.ownerEmail || '—'}`],
      ['Annuitant / Insured', c.annuitantSameAsOwner ? 'Same as Primary Owner' : `${c.annuitantName} (DOB: ${c.annuitantDOB}, Rel: ${c.annuitantRelationship})`],
      ['Government Photo ID', `${c.idType} (${c.idState}) #${maskValue(c.idNumber, privacyMask, 'id')}  |  Expires: ${c.idExpDate || '—'}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Section 3: Beneficiaries
  autoTable(doc, {
    startY: cursorY,
    head: [['3. Beneficiaries — Type', 'Full Legal Name', 'Relationship', 'DOB', 'Share %']],
    body: c.beneficiaries.map((b) => [b.type, b.name || '—', b.relationship || '—', b.dob || '—', `${b.share}%`]),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Section 4: Suitability
  autoTable(doc, {
    startY: cursorY,
    head: [['4. NAIC Financial Suitability & Liquidity Profile (Form 4106)', '']],
    body: [
      ['Employment & Tax Bracket', `${c.employmentStatus} (${c.occupation || '—'})  |  Fed Tax Bracket: ${c.taxBracket}`],
      ['Income & Expenses', `Annual Gross: ${fmtCurrency(c.annualIncome)} (${c.incomeSources.join(', ')})  |  Monthly Exp: ${fmtCurrency(c.monthlyExpenses)}`],
      ['Net Worth & Reserves', `Total NW (Excl. Home): ${fmtCurrency(c.totalNetWorth)}  |  Liquid NW: ${fmtCurrency(c.liquidNetWorth)}`],
      ['Post-Funding Liquidity', `${fmtCurrency(igo.remainingLiquid)} remaining${igo.emergencyMonths !== null ? ` (~${igo.emergencyMonths} months expenses)` : ''}`],
      ['Risk, Horizon & Income', `${c.riskTolerance}  |  Horizon: ${c.timeHorizon}  |  Income Start: ${c.incomeStartTiming}`],
      ['Free Withdrawal / LTC', `${c.freeWithdrawalPlan}  |  Existing LTC: ${c.hasLTC}`],
      ...(c.track === 'life' || c.dualReview
        ? [[
            'Life / IUL Health Pre-Screen',
            `Face: ${fmtCurrency(c.desiredFaceAmount)} | ${c.heightFt}'${c.heightIn}" ${c.weightLbs} lbs | Nicotine: ${c.nicotineProfile} | Health: ${c.healthConditions.join(', ')}`
          ]]
        : [])
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Section 5: Funding & Allocations
  const allocSummary =
    c.allocationMode === 'strategist'
      ? 'Determine exact whole-number allocations with Strategist'
      : INDEX_STRATEGIES.filter((s) => c.allocations[s.key] > 0)
          .map((s) => `${s.shortLabel}: ${c.allocations[s.key]}%`)
          .join(' • ');

  autoTable(doc, {
    startY: cursorY,
    head: [['5. Funding, Rollover / Replacement & Index Strategy', '']],
    body: [
      ['Tax Qualification & Deposit', `${c.taxQualification}  |  Proposed Deposit: ${fmtCurrency(c.estimatedPremium)}`],
      ['Funding Method & Replacement', `${c.fundingMethod}  |  Replacement: ${c.isReplacement}`],
      ...(igo.ownerAge !== null && igo.ownerAge >= 73 && isQualifiedPlan(c.taxQualification)
        ? [['Age 73+ RMD Status', `Current-Year RMD Satisfied: ${c.rmdSatisfied}`]]
        : []),
      ...(c.currentCarrier
        ? [[
            'Surrendering Institution',
            `${c.currentCarrier} (#${c.currentPolicyNumber}) | Est. Value: ${fmtCurrency(c.currentAccountValue)} | Surrender: ${c.currentSurrenderPct}%`
          ]]
        : []),
      ...(c.track === 'annuity' || c.dualReview ? [['Index Crediting Allocations', allocSummary]] : [])
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [251, 191, 36], fontSize: 9.5 },
    styles: { fontSize: 8.5, cellPadding: 5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 165 } },
    margin: { left: 36, right: 36 }
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14;

  // Section 6: Signature Block
  if (cursorY > 690) {
    doc.addPage();
    cursorY = 42;
  }

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
    'Client confirms that personal, beneficiary, and financial suitability data above is accurate for formal carrier e-application preparation.',
    46,
    cursorY + 32
  );

  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Signature: ${c.clientSignature || '______________________'}`, 46, cursorY + 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Signed At: ${c.signedCityState || '—'}   |   Date: ${c.signatureDate}`, pageWidth - 46, cursorY + 54, { align: 'right' });

  if (advisorMode && c.advisorNotes) {
    cursorY += 80;
    if (cursorY > 710) {
      doc.addPage();
      cursorY = 42;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    doc.text('Internal Strategist Notes:', 36, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(c.advisorNotes, pageWidth - 72), 36, cursorY + 13);
  }

  const cleanName = (c.ownerName || 'client').trim().replace(/[^a-z0-9]/gi, '_');
  doc.save(`FINLine_FactFinder_${cleanName}_${c.signatureDate}.pdf`);
}

export function exportCaseJSON(c: ClientCase): void {
  const cleanName = (c.ownerName || 'client').trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `finline_intake_${cleanName}_${c.signatureDate}.json`);
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
  const today = new Date().toISOString().split('T')[0];
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
