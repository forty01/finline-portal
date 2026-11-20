import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileDown,
  FileText
} from 'lucide-react';
import { INDEX_STRATEGIES } from '../data/knowledgeBase';
import type { CaseStatus, ClientCase } from '../types/portal';
import { calculateAge, fmtCurrency, maskValue } from '../utils/calculations';

interface CarrierEntrySheetProps {
  clientCase: ClientCase;
  privacyMask: boolean;
  onTogglePrivacyMask: () => void;
  onBackToInbox: () => void;
  onEditInWizard: () => void;
  onCopyFullSummary: () => void;
  onDownloadPDF: () => void;
  onChangeStatus: (status: CaseStatus) => void;
  onToast: (msg: string) => void;
}

interface CopyFieldProps {
  label: string;
  value: string;
  displayValue?: string;
  mono?: boolean;
  onCopy: (label: string, val: string) => void;
  copiedKey: string | null;
}

const CopyField: React.FC<CopyFieldProps> = ({
  label,
  value,
  displayValue,
  mono,
  onCopy,
  copiedKey
}) => {
  const isCopied = copiedKey === label;
  const shown = displayValue ?? (value || '—');
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: '#f8fafc'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
          {label}
        </div>
        <div
          className={mono ? 'mono' : undefined}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: value ? '#0f172a' : '#94a3b8',
            marginTop: 2,
            wordBreak: 'break-word'
          }}
        >
          {shown}
        </div>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onCopy(label, value)}
          className={`btn btn-sm ${isCopied ? 'btn-gold' : 'btn-secondary'}`}
          style={{ flexShrink: 0, padding: '5px 9px', fontSize: 11 }}
          title={`Copy ${label}`}
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
      )}
    </div>
  );
};

export const CarrierEntrySheet: React.FC<CarrierEntrySheetProps> = ({
  clientCase,
  privacyMask,
  onTogglePrivacyMask,
  onBackToInbox,
  onEditInWizard,
  onCopyFullSummary,
  onDownloadPDF,
  onChangeStatus,
  onToast
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const age = calculateAge(clientCase.ownerDOB);

  const copyField = async (label: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(label);
    onToast(`Copied ${label}`);
    setTimeout(() => setCopiedKey((prev) => (prev === label ? null : prev)), 1800);
  };

  const fullAddress = [
    clientCase.ownerStreet,
    clientCase.ownerCity,
    clientCase.ownerState,
    clientCase.ownerZip
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="card">
      {/* Top Action Header */}
      <div className="step-banner">
        <div>
          <button
            type="button"
            onClick={onBackToInbox}
            className="btn btn-sm btn-dark"
            style={{ marginBottom: 10 }}
          >
            <ArrowLeft size={13} />
            <span>Back to All Submissions</span>
          </button>
          <div className="step-kicker">Carrier E-Application Data Entry Sheet</div>
          <h2 className="step-title">
            {clientCase.ownerName.trim() || 'Untitled Client'}{' '}
            {age !== null ? `(Age ${age})` : ''}
          </h2>
          <p className="step-subtitle">
            Click any field below to copy raw values straight into FireLight, American Equity, Mutual of Omaha, or any carrier portal.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select
            className="select"
            style={{ width: 'auto', fontSize: 12, fontWeight: 700, padding: '7px 10px' }}
            value={clientCase.status}
            onChange={(e) => onChangeStatus(e.target.value as CaseStatus)}
          >
            <option value="Draft">Draft</option>
            <option value="In Review">In Review</option>
            <option value="IGO Ready">IGO Ready</option>
            <option value="Submitted">Entered in Carrier</option>
          </select>

          <button type="button" onClick={onTogglePrivacyMask} className="btn btn-sm btn-dark">
            {privacyMask ? <EyeOff size={13} color="#fbbf24" /> : <Eye size={13} color="#fbbf24" />}
            <span>{privacyMask ? 'Unmask SSN/ID' : 'Mask SSN/ID'}</span>
          </button>

          <button type="button" onClick={onEditInWizard} className="btn btn-sm btn-dark">
            <Edit3 size={13} />
            <span>Edit Form</span>
          </button>

          <button type="button" onClick={onDownloadPDF} className="btn btn-sm btn-gold">
            <FileDown size={14} />
            <span>PDF Packet</span>
          </button>

          <button type="button" onClick={onCopyFullSummary} className="btn btn-sm btn-dark">
            <FileText size={13} color="#fbbf24" />
            <span>Copy All</span>
          </button>
        </div>
      </div>

      <div className="step-body">
        {/* 1. Owner & Registration */}
        <div>
          <span className="kicker-label">1. Owner &amp; Contact Information</span>
          <div className="grid-2">
            <CopyField label="Full Legal Name" value={clientCase.ownerName} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Date of Birth" value={clientCase.ownerDOB} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField
              label="SSN / TIN (Copies Raw)"
              value={clientCase.ownerSSN}
              displayValue={maskValue(clientCase.ownerSSN, privacyMask, 'ssn')}
              mono
              onCopy={copyField}
              copiedKey={copiedKey}
            />
            <CopyField label="Gender / Marital" value={`${clientCase.ownerGender || '—'} / ${clientCase.ownerMarital}`} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Email Address" value={clientCase.ownerEmail} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Mobile Phone" value={clientCase.ownerPhone} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Full Street Address" value={fullAddress} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Ownership Structure" value={clientCase.ownershipType} onCopy={copyField} copiedKey={copiedKey} />
          </div>
        </div>

        {/* 2. Patriot Act Photo ID */}
        <div className="section-divider">
          <span className="kicker-label">2. USA PATRIOT Act Government Photo ID</span>
          <div className="grid-3">
            <CopyField label="ID Type & State" value={`${clientCase.idType} (${clientCase.idState})`} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField
              label="ID Number (Copies Raw)"
              value={clientCase.idNumber}
              displayValue={maskValue(clientCase.idNumber, privacyMask, 'id')}
              mono
              onCopy={copyField}
              copiedKey={copiedKey}
            />
            <CopyField label="Expiration Date" value={clientCase.idExpDate} onCopy={copyField} copiedKey={copiedKey} />
          </div>
        </div>

        {/* 3. Beneficiaries */}
        <div className="section-divider">
          <span className="kicker-label">3. Beneficiaries</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {clientCase.beneficiaries.map((b, i) => (
              <div key={b.id} className="grid-4" style={{ padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff' }}>
                <CopyField label={`#${i + 1} ${b.type} Name`} value={b.name} onCopy={copyField} copiedKey={copiedKey} />
                <CopyField label="Relationship & Share" value={`${b.relationship} — ${b.share}%`} onCopy={copyField} copiedKey={copiedKey} />
                <CopyField label="DOB" value={b.dob} onCopy={copyField} copiedKey={copiedKey} />
                <CopyField
                  label="Beneficiary SSN"
                  value={b.ssn}
                  displayValue={maskValue(b.ssn, privacyMask, 'ssn')}
                  mono
                  onCopy={copyField}
                  copiedKey={copiedKey}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4. Suitability & Financials */}
        <div className="section-divider">
          <span className="kicker-label">4. NAIC Suitability &amp; Financial Profile</span>
          <div className="grid-3">
            <CopyField label="Employment / Occupation" value={`${clientCase.employmentStatus} — ${clientCase.occupation || 'N/A'}`} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Annual Household Income" value={clientCase.annualIncome} displayValue={fmtCurrency(clientCase.annualIncome)} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Monthly Living Expenses" value={clientCase.monthlyExpenses} displayValue={fmtCurrency(clientCase.monthlyExpenses)} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Total Net Worth (Excl. Home)" value={clientCase.totalNetWorth} displayValue={fmtCurrency(clientCase.totalNetWorth)} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Liquid Net Worth" value={clientCase.liquidNetWorth} displayValue={fmtCurrency(clientCase.liquidNetWorth)} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Tax Bracket / Risk / Horizon" value={`${clientCase.taxBracket} • ${clientCase.riskTolerance} • ${clientCase.timeHorizon}`} onCopy={copyField} copiedKey={copiedKey} />
          </div>
        </div>

        {/* 5. Funding, Rollover & Allocations */}
        <div className="section-divider">
          <span className="kicker-label">5. Funding, Rollover / Replacement &amp; Product</span>
          <div className="grid-3">
            <CopyField label="Target Product Series" value={clientCase.targetProduct} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Tax Qualification" value={clientCase.taxQualification} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Proposed Deposit / Premium" value={clientCase.estimatedPremium} displayValue={fmtCurrency(clientCase.estimatedPremium)} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Funding Method" value={clientCase.fundingMethod} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Surrendering Carrier" value={clientCase.currentCarrier} onCopy={copyField} copiedKey={copiedKey} />
            <CopyField label="Existing Acct / Policy #" value={clientCase.currentPolicyNumber} mono onCopy={copyField} copiedKey={copiedKey} />
          </div>

          {(clientCase.track === 'annuity' || clientCase.dualReview) && (
            <div style={{ marginTop: 12 }}>
              <CopyField
                label="Index Crediting Allocations"
                value={
                  clientCase.allocationMode === 'strategist'
                    ? 'Advisor to finalize allocations'
                    : INDEX_STRATEGIES.filter((s) => clientCase.allocations[s.key] > 0)
                        .map((s) => `${s.shortLabel}: ${clientCase.allocations[s.key]}%`)
                        .join(' | ')
                }
                onCopy={copyField}
                copiedKey={copiedKey}
              />
            </div>
          )}

          {(clientCase.track === 'life' || clientCase.dualReview) && (
            <div className="grid-3" style={{ marginTop: 12 }}>
              <CopyField label="Desired Death Benefit" value={clientCase.desiredFaceAmount} displayValue={fmtCurrency(clientCase.desiredFaceAmount)} onCopy={copyField} copiedKey={copiedKey} />
              <CopyField label="Height / Weight / Nicotine" value={`${clientCase.heightFt}'${clientCase.heightIn}" • ${clientCase.weightLbs} lbs • ${clientCase.nicotineProfile}`} onCopy={copyField} copiedKey={copiedKey} />
              <CopyField label="Health Conditions" value={clientCase.healthConditions.join(', ')} onCopy={copyField} copiedKey={copiedKey} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
