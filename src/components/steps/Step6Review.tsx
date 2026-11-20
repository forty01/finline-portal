import React from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileDown,
  FileSignature,
  PenTool,
  Printer,
  Send,
  Sparkles
} from 'lucide-react';
import type { CaseStatus, ClientCase } from '../../types/portal';
import {
  fmtCurrencyExact,
  getAllocationTotal,
  getBeneficiaryTotals,
  getReadinessSummary,
  isIdExpired,
  isQualifiedPlan,
  maskValue,
  parseNum
} from '../../utils/calculations';
import { StepHeader } from './StepHeader';

interface Step6ReviewProps {
  clientCase: ClientCase;
  privacyMask: boolean;
  isAdvisor: boolean;
  submitting?: boolean;
  onUpdate: (patch: Partial<ClientCase>) => void;
  onGoToStep: (step: number) => void;
  onSubmitClientApplication: () => void;
  onDownloadPDF: () => void;
  onCopyFireLight: () => void;
  onExportJSON: () => void;
}

export const Step6Review: React.FC<Step6ReviewProps> = ({
  clientCase,
  privacyMask,
  isAdvisor,
  submitting = false,
  onUpdate,
  onGoToStep,
  onSubmitClientApplication,
  onDownloadPDF,
  onCopyFireLight,
  onExportJSON
}) => {
  const readiness = getReadinessSummary(clientCase);
  const { igo, rmdBlocked, isIgoReady: igoReady, countText } = readiness;
  const benTotals = getBeneficiaryTotals(clientCase);
  const allocTotal = getAllocationTotal(clientCase);

  const personalReady =
    Boolean(clientCase.ownershipType) &&
    Boolean(clientCase.ownerName.trim()) &&
    Boolean(clientCase.ownerDOB) &&
    Boolean(clientCase.ownerSSN.trim()) &&
    benTotals.primaryTotal === 100 &&
    Boolean(clientCase.beneficiaries[0]?.name.trim()) &&
    Boolean(clientCase.idType) &&
    !isIdExpired(clientCase.idExpDate) &&
    Boolean(clientCase.idNumber.trim());

  const financialReady =
    parseNum(clientCase.annualIncome) > 0 &&
    clientCase.liquidNetWorth.trim() !== '' &&
    parseNum(clientCase.estimatedPremium) > 0;

  const signedAndAcked =
    clientCase.clientAcknowledged && clientCase.clientSignature.trim().length > 2;

  const canSubmit = !rmdBlocked && signedAndAcked && !submitting;

  const headerBadgeText = rmdBlocked
    ? `Blocked: RMD / Form 4083 (${countText})`
    : igoReady
      ? `IGO Ready (${countText})`
      : `Pending Details (${countText})`;
  const headerBadgeTone: 'blocked' | 'ok' | 'pending' = rmdBlocked
    ? 'blocked'
    : igoReady
      ? 'ok'
      : 'pending';

  const statuses: CaseStatus[] = ['Draft', 'In Review', 'IGO Ready', 'Submitted'];

  const disabledReason = rmdBlocked
    ? 'Action required: Satisfy current-year RMD or submit Form 4083 on Step 5 before submitting.'
    : !clientCase.clientAcknowledged
      ? 'Check the acknowledgment box above to enable submission.'
      : clientCase.clientSignature.trim().length <= 2
        ? 'Type your full legal name as your electronic signature above to enable submission.'
        : '';

  return (
    <>
      <StepHeader
        num={6}
        title={isAdvisor ? 'Review, IGO Readiness & Export' : 'Review & Submit Your Application'}
        subtitle={
          isAdvisor
            ? 'Verify application details, update status, and export for carrier entry.'
            : 'Please review your details below, type your signature, and send your application over to me.'
        }
        badgeText={headerBadgeText}
        badgeTone={headerBadgeTone}
      />
      <div className="step-body">
        {/* HARD RMD BLOCKING BANNER (Age 73+ Qualified Plan with RMD Unsatisfied) */}
        {rmdBlocked && (
          <div
            id="rmdBlockingAlert"
            role="alert"
            className="callout callout-rose"
            style={{ borderWidth: 2, flexDirection: 'column', gap: 10 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertOctagon size={20} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#9f1239' }}>
                  Submission Blocked — Age 73+ RMD / Form 4083 Required Before Transfer
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#881337', lineHeight: 1.55 }}>
                  Because the owner is age <strong>{igo.ownerAge}</strong> and funding via{' '}
                  <strong>{clientCase.taxQualification}</strong>, IRS rules prohibit transferring
                  funds until the current-year Required Minimum Distribution (RMD) is satisfied or{' '}
                  <strong>Form 4083</strong> is submitted prior to the IRA transfer. Update your
                  RMD confirmation on Step 5 once satisfied to unlock submission.
                </p>
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onGoToStep(5)}
                className="btn btn-sm btn-danger"
              >
                Return to Step 5 to Update RMD Status
              </button>
            </div>
          </div>
        )}

        {/* Readiness Status Pills */}
        <div className="grid-3">
          <div className={`callout ${personalReady ? 'callout-emerald' : 'callout-amber'}`}>
            {personalReady ? (
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
            ) : (
              <Clock size={20} color="#d97706" style={{ flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isAdvisor ? 'Form 2000 & Patriot ID' : 'Personal Info & ID'}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                {personalReady ? 'Complete' : 'Missing Required Info'}
              </div>
            </div>
          </div>

          <div className={`callout ${financialReady ? 'callout-emerald' : 'callout-amber'}`}>
            {financialReady ? (
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
            ) : (
              <Clock size={20} color="#d97706" style={{ flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isAdvisor ? 'Form 4106 Suitability' : 'Financial Profile'}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                {financialReady ? 'Complete' : 'Pending Financials / Deposit'}
              </div>
            </div>
          </div>

          <div
            className={`callout ${
              rmdBlocked
                ? 'callout-rose'
                : igoReady && signedAndAcked
                  ? 'callout-emerald'
                  : 'callout-slate'
            }`}
          >
            {rmdBlocked ? (
              <AlertOctagon size={20} color="#e11d48" style={{ flexShrink: 0 }} />
            ) : igoReady && signedAndAcked ? (
              <Sparkles size={20} color="#059669" style={{ flexShrink: 0 }} />
            ) : (
              <FileSignature size={20} color="#64748b" style={{ flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Compliance &amp; Readiness
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                {rmdBlocked
                  ? 'Blocked — RMD / Form 4083'
                  : igoReady && signedAndAcked
                    ? 'IGO Ready to Submit'
                    : igoReady
                      ? 'IGO Ready — Sign Below'
                      : 'Pending Required Fields'}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid-2">
          <div className="callout callout-slate" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>
                Plan &amp; Funding
              </strong>
              <button
                type="button"
                onClick={() => onGoToStep(5)}
                style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>
            <div style={{ width: '100%', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Application Type:</span>
                <strong>
                  {clientCase.track === 'annuity'
                    ? 'Retirement Savings & Income'
                    : clientCase.track === 'life'
                      ? 'Life Insurance & Family Protection'
                      : '—'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Account Type:</span>
                <strong>{clientCase.taxQualification || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Proposed Deposit:</span>
                <strong style={{ color: '#0f172a' }}>
                  {fmtCurrencyExact(clientCase.estimatedPremium)}
                </strong>
              </div>
              {clientCase.currentAccountValue && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: '#64748b' }}>Current Account Value:</span>
                  <strong>{fmtCurrencyExact(clientCase.currentAccountValue)}</strong>
                </div>
              )}
              {igo.ownerAge !== null && igo.ownerAge >= 73 && isQualifiedPlan(clientCase.taxQualification) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: '#64748b' }}>Current-Year RMD Satisfied:</span>
                  <strong style={{ color: rmdBlocked ? '#e11d48' : '#047857' }}>
                    {clientCase.rmdSatisfied || 'Not Answered'}
                  </strong>
                </div>
              )}
            </div>
          </div>

          <div className="callout callout-slate" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>
                Personal Details &amp; ID
              </strong>
              <button
                type="button"
                onClick={() => onGoToStep(2)}
                style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>
            <div style={{ width: '100%', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Ownership:</span>
                <strong>{clientCase.ownershipType || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Full Name:</span>
                <strong>
                  {clientCase.ownerName || '—'} {igo.ownerAge !== null ? `(Age ${igo.ownerAge})` : ''}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>SSN / TIN:</span>
                <strong className="mono">{maskValue(clientCase.ownerSSN, privacyMask, 'ssn')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Photo ID:</span>
                <strong className="mono">
                  {clientCase.idType || '—'} {maskValue(clientCase.idNumber, privacyMask, 'id')}
                </strong>
              </div>
            </div>
          </div>

          <div className="callout callout-slate" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>
                Beneficiaries ({benTotals.primaryTotal}% Primary)
              </strong>
              <button
                type="button"
                onClick={() => onGoToStep(3)}
                style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>
            <div style={{ width: '100%', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {clientCase.beneficiaries.map((b) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>
                    [{b.type}] <strong>{b.name || 'Unnamed'}</strong> ({b.relationship || '—'})
                  </span>
                  <strong>{b.share}%</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="callout callout-slate" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <strong style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>
                Financial Profile
              </strong>
              <button
                type="button"
                onClick={() => onGoToStep(4)}
                style={{ background: 'none', border: 'none', color: '#b45309', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>
            <div style={{ width: '100%', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Income / Expenses:</span>
                <strong style={{ textAlign: 'right' }}>
                  {fmtCurrencyExact(clientCase.annualIncome)}/yr • {fmtCurrencyExact(clientCase.monthlyExpenses)}/mo
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Total / Liquid NW:</span>
                <strong style={{ textAlign: 'right' }}>
                  {fmtCurrencyExact(clientCase.totalNetWorth)} / {fmtCurrencyExact(clientCase.liquidNetWorth)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Horizon &amp; Risk:</span>
                <strong style={{ textAlign: 'right' }}>
                  {clientCase.timeHorizon || '—'} • {clientCase.riskTolerance || '—'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: '#64748b' }}>Index Strategy:</span>
                <strong>
                  {clientCase.allocationMode === 'strategist'
                    ? 'Finalize together'
                    : `Custom (${allocTotal}%)`}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Client Acknowledgment & Electronic Signature */}
        <div
          style={{
            border: '2px solid #e2e8f0',
            borderRadius: 16,
            padding: 20,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <h3 className="section-heading" style={{ margin: 0 }}>
              <PenTool size={16} color="#d97706" />
              <span>Applicant Acknowledgment &amp; Electronic Signature</span>
            </h3>
            {isAdvisor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Case Status:</span>
                <select
                  className="select"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: 12, fontWeight: 700 }}
                  value={clientCase.status}
                  onChange={(e) => onUpdate({ status: e.target.value as CaseStatus })}
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 13,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={clientCase.clientAcknowledged}
              onChange={(e) => onUpdate({ clientAcknowledged: e.target.checked })}
              style={{ marginTop: 2 }}
            />
            <span style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
              I confirm that the personal, beneficiary, and financial information provided above is accurate and authorize you to use this information to prepare my formal policy application.
            </span>
          </label>

          <div className="grid-3">
            <div>
              <label className="field-label">Typed Electronic Signature *</label>
              <input
                className="input signature-input"
                value={clientCase.clientSignature}
                onChange={(e) => onUpdate({ clientSignature: e.target.value })}
                placeholder="Type Full Legal Name"
              />
            </div>
            <div>
              <label className="field-label">City &amp; State Signed *</label>
              <input
                className="input"
                value={clientCase.signedCityState}
                onChange={(e) => onUpdate({ signedCityState: e.target.value })}
                placeholder="City, State"
              />
            </div>
            <div>
              <label className="field-label">Date</label>
              <input
                type="date"
                className="input"
                value={clientCase.signatureDate}
                onChange={(e) => onUpdate({ signatureDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Bottom CTA: ONE Submit Button Only (Client Mode) vs Advisor Export */}
        {!isAdvisor ? (
          <div
            style={{
              background: '#0f172a',
              color: '#fff',
              borderRadius: 16,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Final Step
                </div>
                <div style={{ fontSize: 13.5, color: '#e2e8f0', marginTop: 3 }}>
                  {disabledReason || "All set? Send your details over and I'll take it from here."}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button type="button" onClick={onDownloadPDF} className="btn btn-dark btn-lg">
                  <FileDown size={15} color="#fbbf24" />
                  <span>Download My Copy (PDF)</span>
                </button>
                <button
                  id="btnPrimarySubmitApplication"
                  type="button"
                  disabled={!canSubmit}
                  onClick={onSubmitClientApplication}
                  className="btn btn-gold btn-lg"
                  style={{ paddingLeft: 22, paddingRight: 22 }}
                >
                  <Send size={15} />
                  <span>{submitting ? 'Sending...' : 'Send My Application'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#0f172a',
              color: '#fff',
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 14
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Advisor Export &amp; Carrier Handoff
              </div>
              <div style={{ fontSize: 12.5, color: '#cbd5e1', marginTop: 3 }}>
                Download Form 2000/4106 PDF packet, copy for FireLight e-App, or save JSON.
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              <button type="button" onClick={onDownloadPDF} className="btn btn-gold btn-lg">
                <FileDown size={16} />
                <span>Download PDF Packet</span>
              </button>
              <button type="button" onClick={onCopyFireLight} className="btn btn-dark btn-lg">
                <Copy size={15} color="#fbbf24" />
                <span>Copy FireLight Summary</span>
              </button>
              <button type="button" onClick={() => window.print()} className="btn btn-dark">
                <Printer size={15} color="#94a3b8" />
                <span>Print</span>
              </button>
              <button type="button" onClick={onExportJSON} className="btn btn-dark">
                <Download size={15} color="#34d399" />
                <span>.JSON</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
