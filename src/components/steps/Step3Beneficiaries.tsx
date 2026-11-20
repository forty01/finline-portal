import React from 'react';
import { AlertTriangle, Plus, Trash2, UserPlus } from 'lucide-react';
import type { Beneficiary, BeneficiaryType, ClientCase } from '../../types/portal';
import { getBeneficiaryTotals, parseNum } from '../../utils/calculations';
import { StepHeader } from './StepHeader';

interface Step3BeneficiariesProps {
  clientCase: ClientCase;
  privacyMask: boolean;
  onUpdate: (patch: Partial<ClientCase>) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export const Step3Beneficiaries: React.FC<Step3BeneficiariesProps> = ({
  clientCase,
  privacyMask,
  onUpdate,
  onToast
}) => {
  const totals = getBeneficiaryTotals(clientCase);
  const maskType = privacyMask ? 'password' : 'text';

  const addBeneficiary = (type: BeneficiaryType) => {
    const id = 'b' + Date.now() + Math.floor(Math.random() * 100);
    const sameType = clientCase.beneficiaries.filter((b) => b.type === type);
    const next: Beneficiary[] = [
      ...clientCase.beneficiaries,
      {
        id,
        type,
        name: '',
        relationship: '',
        dob: '',
        ssn: '',
        contact: '',
        share: sameType.length === 0 ? 100 : 0
      }
    ];
    onUpdate({ beneficiaries: next });
  };

  const removeBeneficiary = (id: string) => {
    if (clientCase.beneficiaries.length <= 1) {
      onToast('At least one Primary Beneficiary row is required.', 'warning');
      return;
    }
    onUpdate({ beneficiaries: clientCase.beneficiaries.filter((b) => b.id !== id) });
  };

  const updateBeneficiary = (id: string, key: keyof Beneficiary, rawVal: string) => {
    const next = clientCase.beneficiaries.map((b) => {
      if (b.id !== id) return b;
      if (key === 'share') {
        const val = rawVal === '' ? '' : Math.max(0, Math.min(100, Math.round(parseNum(rawVal))));
        return { ...b, share: val };
      }
      return { ...b, [key]: rawVal };
    });
    onUpdate({ beneficiaries: next });
  };

  const equalSplit = (targetType: BeneficiaryType) => {
    const matching = clientCase.beneficiaries.filter((b) => b.type === targetType);
    if (!matching.length) {
      onToast(`No ${targetType} beneficiaries to split.`, 'warning');
      return;
    }
    const base = Math.floor(100 / matching.length);
    const rem = 100 - base * matching.length;
    let idx = 0;
    const next = clientCase.beneficiaries.map((b) => {
      if (b.type !== targetType) return b;
      const share = base + (idx < rem ? 1 : 0);
      idx++;
      return { ...b, share };
    });
    onUpdate({ beneficiaries: next });
    onToast(
      `Evenly split 100% across ${matching.length} ${targetType} beneficiar${matching.length === 1 ? 'y' : 'ies'}.`
    );
  };

  return (
    <>
      <StepHeader
        num={3}
        title="Beneficiary Designations (Primary & Contingent)"
        subtitle="Specify who receives contract values upon passing. Percentages must use whole numbers and total 100%."
      />
      <div className="step-body">
        {/* Live Allocation Meters */}
        <div className="grid-2">
          <div
            className={`callout ${totals.primaryTotal === 100 ? 'callout-emerald' : 'callout-amber'}`}
            style={{ flexDirection: 'column', gap: 8 }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Primary Beneficiaries Total
              </span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{totals.primaryTotal}% / 100%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, totals.primaryTotal)}%`,
                  background:
                    totals.primaryTotal === 100
                      ? '#10b981'
                      : totals.primaryTotal > 100
                        ? '#f43f5e'
                        : '#f59e0b'
                }}
              />
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span>{totals.primaryTotal === 100 ? 'Ready (100% allocated)' : 'Must equal exactly 100%'}</span>
              <button
                type="button"
                onClick={() => equalSplit('Primary')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  color: '#0f172a',
                  fontSize: 11.5
                }}
              >
                Equal Split Primary
              </button>
            </div>
          </div>

          <div
            className={`callout ${
              totals.contingentCount === 0 || totals.contingentTotal === 100
                ? 'callout-slate'
                : 'callout-amber'
            }`}
            style={{ flexDirection: 'column', gap: 8 }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Contingent Beneficiaries Total
              </span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>
                {totals.contingentCount === 0
                  ? 'None Added (Optional)'
                  : `${totals.contingentTotal}% / 100%`}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, totals.contingentTotal)}%`,
                  background: totals.contingentTotal === 100 ? '#10b981' : '#f59e0b'
                }}
              />
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span>Paid if all Primary Beneficiaries predecease</span>
              <button
                type="button"
                onClick={() => equalSplit('Contingent')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  color: '#0f172a',
                  fontSize: 11.5
                }}
              >
                Equal Split Contingent
              </button>
            </div>
          </div>
        </div>

        {totals.hasEstateWarning && (
          <div className="callout callout-amber">
            <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Probate &amp; Carrier Guideline Warning ("Estate" Detected):</strong> Naming an
              "Estate" as beneficiary subjects annuity/life proceeds to court probate delays,
              potential creditor claims, and less favorable tax distribution rules per American
              Equity guidelines. Consider naming specific individual(s) or an established Living
              Trust instead.
            </div>
          </div>
        )}

        {/* Beneficiary Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {clientCase.beneficiaries.map((b, idx) => (
            <div
              key={b.id}
              style={{
                padding: 18,
                borderRadius: 14,
                border: b.type === 'Primary' ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                background: b.type === 'Primary' ? '#fff' : '#f8fafc'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  paddingBottom: 12,
                  marginBottom: 14,
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${b.type === 'Primary' ? 'badge-navy' : 'badge-slate'}`}>
                    #{idx + 1} {b.type}
                  </span>
                  <select
                    className="select"
                    style={{ width: 'auto', padding: '5px 10px', fontSize: 12, fontWeight: 600 }}
                    value={b.type}
                    onChange={(e) => updateBeneficiary(b.id, 'type', e.target.value)}
                  >
                    <option value="Primary">Primary Beneficiary</option>
                    <option value="Contingent">Contingent Beneficiary</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeBeneficiary(b.id)}
                  className="btn btn-sm btn-danger-ghost"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>

              <div className="grid-6">
                <div className="span-2">
                  <label className="field-label">Full Legal Name *</label>
                  <input
                    className="input"
                    value={b.name}
                    onChange={(e) => updateBeneficiary(b.id, 'name', e.target.value)}
                    placeholder="First, MI, Last"
                  />
                </div>
                <div>
                  <label className="field-label">Relationship *</label>
                  <input
                    className="input"
                    value={b.relationship}
                    onChange={(e) => updateBeneficiary(b.id, 'relationship', e.target.value)}
                    placeholder="Spouse, Child..."
                  />
                </div>
                <div>
                  <label className="field-label">Date of Birth</label>
                  <input
                    type="date"
                    className="input"
                    value={b.dob}
                    onChange={(e) => updateBeneficiary(b.id, 'dob', e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">SSN (Optional)</label>
                  <input
                    type={maskType}
                    className="input mono"
                    value={b.ssn}
                    onChange={(e) => updateBeneficiary(b.id, 'ssn', e.target.value)}
                    placeholder="XXX-XX-XXXX"
                  />
                </div>
                <div>
                  <label className="field-label">Share % *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="input"
                    style={{ fontWeight: 700 }}
                    value={b.share}
                    onChange={(e) => updateBeneficiary(b.id, 'share', e.target.value)}
                  />
                </div>
                <div className="span-full">
                  <label className="field-label">Phone or Email (Helpful for claim notification)</label>
                  <input
                    className="input"
                    value={b.contact}
                    onChange={(e) => updateBeneficiary(b.id, 'contact', e.target.value)}
                    placeholder="(555) 555-0199 or email@example.com"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={() => addBeneficiary('Primary')} className="btn btn-primary">
            <UserPlus size={15} color="#fbbf24" />
            <span>Add Primary Beneficiary</span>
          </button>
          <button type="button" onClick={() => addBeneficiary('Contingent')} className="btn btn-secondary">
            <Plus size={15} />
            <span>Add Contingent Beneficiary</span>
          </button>
        </div>
      </div>
    </>
  );
};
