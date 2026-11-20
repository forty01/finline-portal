import React from 'react';
import {
  AlertOctagon,
  Banknote,
  CalendarClock,
  Info,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { INDEX_STRATEGIES } from '../../data/knowledgeBase';
import type { ClientCase, IndexAllocations } from '../../types/portal';
import {
  calculateAge,
  getAllocationTotal,
  isQualifiedPlan,
  isRmdBlocked,
  parseNum
} from '../../utils/calculations';
import { CurrencyInput } from '../CurrencyInput';
import { StepHeader } from './StepHeader';

interface Step5FundingProps {
  clientCase: ClientCase;
  onUpdate: (patch: Partial<ClientCase>) => void;
}

export const Step5Funding: React.FC<Step5FundingProps> = ({ clientCase, onUpdate }) => {
  const ownerAge = calculateAge(clientCase.ownerDOB);
  const qualified = isQualifiedPlan(clientCase.taxQualification);
  const showRMD = ownerAge !== null && ownerAge >= 73 && qualified;
  const rmdBlocked = isRmdBlocked(clientCase);
  const showTransferBlock =
    ['Direct Transfer/Rollover', '1035 Exchange'].includes(clientCase.fundingMethod) ||
    clientCase.isReplacement === 'Yes' ||
    clientCase.taxQualification === '1035 Tax-Free Exchange';
  const allocTotal = getAllocationTotal(clientCase);

  const updateAllocation = (key: keyof IndexAllocations, rawVal: string) => {
    const whole = Math.max(0, Math.min(100, Math.round(parseNum(rawVal))));
    onUpdate({
      allocations: {
        ...clientCase.allocations,
        [key]: whole
      }
    });
  };

  const applyPreset = (preset: 'balanced' | 'growth' | 'fixed' | 'zero') => {
    const map: Record<typeof preset, IndexAllocations> = {
      balanced: { sp500Cap: 35, sp500Trigger: 20, dividendAristocrats: 15, blackrockAdaptive: 20, nasdaqPremier: 0, fixedAccount: 10 },
      growth: { sp500Cap: 40, sp500Trigger: 15, dividendAristocrats: 15, blackrockAdaptive: 15, nasdaqPremier: 15, fixedAccount: 0 },
      fixed: { sp500Cap: 0, sp500Trigger: 0, dividendAristocrats: 0, blackrockAdaptive: 0, nasdaqPremier: 0, fixedAccount: 100 },
      zero: { sp500Cap: 0, sp500Trigger: 0, dividendAristocrats: 0, blackrockAdaptive: 0, nasdaqPremier: 0, fixedAccount: 0 }
    };
    onUpdate({ allocationMode: 'custom', allocations: map[preset] });
  };

  const pieData = INDEX_STRATEGIES.map((s) => ({
    name: s.shortLabel,
    value: Math.round(parseNum(clientCase.allocations[s.key])),
    color: s.color
  })).filter((d) => d.value > 0);

  return (
    <>
      <StepHeader
        num={5}
        title="Funding, Rollovers, Replacements & Index Allocations"
        subtitle="Specify account type, proposed deposit, rollover details, RMD status, and index strategy."
        badgeText={rmdBlocked ? 'RMD / Form 4083 Required' : undefined}
        badgeTone={rmdBlocked ? 'blocked' : 'ok'}
      />
      <div className="step-body">
        {/* Tax Qualification & Deposit (Single Source of Truth) */}
        <div>
          <h3 className="section-heading">
            <Banknote size={16} color="#d97706" />
            <span>Account Type &amp; Funding Source</span>
          </h3>
          <div className="grid-4">
            <div>
              <label className="field-label">Tax Qualification Type *</label>
              <select
                className="select"
                style={{ fontWeight: 600 }}
                value={clientCase.taxQualification}
                onChange={(e) => onUpdate({ taxQualification: e.target.value })}
              >
                <option value="">Select...</option>
                {[
                  'Non-Qualified',
                  'Traditional IRA',
                  'Roth IRA',
                  '401(k)/403(b)/457 Rollover',
                  'SEP-IRA',
                  '1035 Tax-Free Exchange'
                ].map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">
                {clientCase.track === 'life'
                  ? 'Planned Annual / Initial Premium *'
                  : 'Proposed Deposit / Rollover Amount *'}
              </label>
              <CurrencyInput
                id="inputEstimatedPremium"
                ariaLabel="Proposed Deposit or Premium"
                style={{ fontWeight: 700 }}
                value={clientCase.estimatedPremium}
                onChange={(val) => onUpdate({ estimatedPremium: val })}
              />
            </div>

            <div className="span-2">
              <label className="field-label">Funding Method *</label>
              <select
                className="select"
                value={clientCase.fundingMethod}
                onChange={(e) => onUpdate({ fundingMethod: e.target.value })}
              >
                <option value="">Select...</option>
                {[
                  'Direct Transfer/Rollover',
                  '1035 Exchange',
                  'Personal Check',
                  'ACH/Wire'
                ].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {clientCase.taxQualification === 'Roth IRA' && (
            <div className="callout callout-blue" style={{ marginTop: 12 }}>
              <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
              <span>
                <strong>Roth IRA Note:</strong> Form 5305-RA (Roth IRA Endorsement) will be included with your formal carrier application.
              </span>
            </div>
          )}

          {qualified && clientCase.ownershipType === 'Joint' && (
            <div className="callout callout-rose" style={{ marginTop: 12 }}>
              <AlertOctagon size={16} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <strong>Cross-Check Warning:</strong> Qualified accounts ({clientCase.taxQualification})
                cannot have a Joint Owner. Switch Ownership in Step 2 to <strong>Individual</strong> or
                change Tax Qualification to <strong>Non-Qualified</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Age 73+ RMD Gate */}
        {showRMD && (
          <div
            className={`callout ${rmdBlocked ? 'callout-rose' : 'callout-emerald'}`}
            style={{ flexDirection: 'column', gap: 12, borderWidth: 2 }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: rmdBlocked ? '#e11d48' : '#059669',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <CalendarClock size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: rmdBlocked ? '#9f1239' : '#065f46' }}>
                  Age 73+ Required Minimum Distribution (RMD) Verification *
                </div>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: rmdBlocked ? '#881337' : '#065f46' }}>
                  Because the owner is age <strong>{ownerAge}</strong> and funding via a Qualified account ({clientCase.taxQualification}), IRS rules require satisfying the current calendar year&apos;s RMD or submitting Form 4083 before an IRA transfer can proceed.
                </p>
              </div>
            </div>
            <div className="grid-2" style={{ width: '100%' }}>
              <button
                type="button"
                onClick={() => onUpdate({ rmdSatisfied: 'Yes' })}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  padding: '11px 14px',
                  background: clientCase.rmdSatisfied === 'Yes' ? '#047857' : '#fff',
                  color: clientCase.rmdSatisfied === 'Yes' ? '#fff' : '#1e293b',
                  borderColor: clientCase.rmdSatisfied === 'Yes' ? '#047857' : '#cbd5e1',
                  whiteSpace: 'normal',
                  textAlign: 'left'
                }}
              >
                ✓ Yes — Current-year RMD has already been satisfied
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ rmdSatisfied: 'No' })}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  padding: '11px 14px',
                  background: clientCase.rmdSatisfied === 'No' ? '#be123c' : '#fff',
                  color: clientCase.rmdSatisfied === 'No' ? '#fff' : '#1e293b',
                  borderColor: clientCase.rmdSatisfied === 'No' ? '#be123c' : '#cbd5e1',
                  whiteSpace: 'normal',
                  textAlign: 'left'
                }}
              >
                ! No — Distribute RMD first / Complete Form 4083
              </button>
            </div>
            {rmdBlocked && (
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9f1239' }}>
                Submission hold: Your application cannot be submitted until your current-year RMD is satisfied or Form 4083 is completed.
              </div>
            )}
          </div>
        )}

        {/* Replacement & Custodian Details */}
        <div className="section-divider">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <h3 className="section-heading" style={{ marginBottom: 2 }}>
                Existing Policy Replacement Check
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Are you replacing or exchanging an existing life insurance policy or annuity contract?
              </p>
            </div>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: 4, borderRadius: 11, border: '1px solid #cbd5e1', gap: 4 }}>
              <button
                type="button"
                onClick={() => onUpdate({ isReplacement: 'No' })}
                className={`btn btn-sm ${clientCase.isReplacement === 'No' ? 'btn-primary' : 'btn-ghost'}`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ isReplacement: 'Yes' })}
                className={`btn btn-sm ${clientCase.isReplacement === 'Yes' ? 'btn-gold' : 'btn-ghost'}`}
              >
                Yes (Replacement)
              </button>
            </div>
          </div>

          {showTransferBlock && (
            <div className="callout callout-slate" style={{ marginTop: 14, flexDirection: 'column', gap: 14 }}>
              <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="kicker-label" style={{ marginBottom: 0 }}>
                  Current Custodian / Surrendering Carrier Details
                </span>
                {clientCase.isReplacement === 'Yes' && (
                  <span className="badge badge-gold">
                    State Replacement &amp; Side-by-Side Comparison Required
                  </span>
                )}
              </div>
              <div className="grid-3" style={{ width: '100%' }}>
                <div>
                  <label className="field-label">Current Institution / Carrier Name *</label>
                  <input
                    className="input"
                    value={clientCase.currentCarrier}
                    onChange={(e) => onUpdate({ currentCarrier: e.target.value })}
                    placeholder="Institution or carrier name"
                  />
                </div>
                <div>
                  <label className="field-label">Existing Account / Policy Number *</label>
                  <input
                    className="input mono"
                    value={clientCase.currentPolicyNumber}
                    onChange={(e) => onUpdate({ currentPolicyNumber: e.target.value })}
                    placeholder="Account or Policy #"
                  />
                </div>
                <div>
                  <label className="field-label">Institution Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    value={clientCase.currentCarrierPhone}
                    onChange={(e) => onUpdate({ currentCarrierPhone: e.target.value })}
                    placeholder="(800) 555-0100"
                  />
                </div>
                <div>
                  <label className="field-label">Estimated Current Value</label>
                  <CurrencyInput
                    id="inputCurrentAccountValue"
                    ariaLabel="Estimated Current Value"
                    value={clientCase.currentAccountValue}
                    onChange={(val) => onUpdate({ currentAccountValue: val })}
                  />
                </div>
                <div>
                  <label className="field-label">Current Surrender Charge %</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    step={0.5}
                    className="input"
                    value={clientCase.currentSurrenderPct}
                    onChange={(e) => onUpdate({ currentSurrenderPct: e.target.value })}
                    placeholder="0%"
                  />
                </div>
              </div>
              <label
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={clientCase.hasRecentStatement}
                  onChange={(e) => onUpdate({ hasRecentStatement: e.target.checked })}
                  style={{ marginTop: 2 }}
                />
                <span style={{ fontSize: 12.5, color: '#334155' }}>
                  <strong>Recent Account Statement Ready:</strong> I have a recent statement from my
                  current custodian/carrier ready to verify exact registration and account values.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Index Crediting Allocation Builder */}
        {(clientCase.track === 'annuity' || clientCase.dualReview) && (
          <div className="section-divider">
            <h3 className="section-heading" style={{ marginBottom: 4 }}>
              <PieChartIcon size={16} color="#d97706" />
              <span>Index &amp; Fixed Crediting Allocations</span>
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
              All custom index allocations must use whole numbers and equal 100%.
            </p>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => onUpdate({ allocationMode: 'strategist' })}
                className={`goal-tile ${clientCase.allocationMode === 'strategist' ? 'active' : ''}`}
                style={{ flexDirection: 'column', gap: 3 }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Decide Together During Our Review
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.78 }}>
                  We&apos;ll go over current rates and options together before locking anything in
                </div>
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ allocationMode: 'custom' })}
                className={`choice-tile ${clientCase.allocationMode === 'custom' ? 'selected' : ''}`}
                style={{ padding: 13, flexDirection: 'column', gap: 3 }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  Enter Custom Whole-Number Allocations (Must = 100%)
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                  Specify exact index &amp; fixed strategy percentages now
                </div>
              </button>
            </div>

            {clientCase.allocationMode === 'custom' && (
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: 18,
                  background: '#fff'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    paddingBottom: 14,
                    marginBottom: 16,
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Presets:</span>
                    <button type="button" onClick={() => applyPreset('balanced')} className="btn btn-sm btn-secondary">
                      Balanced FIA
                    </button>
                    <button type="button" onClick={() => applyPreset('growth')} className="btn btn-sm btn-secondary">
                      Diversified Index
                    </button>
                    <button type="button" onClick={() => applyPreset('fixed')} className="btn btn-sm btn-secondary">
                      100% Fixed
                    </button>
                    <button type="button" onClick={() => applyPreset('zero')} className="btn btn-sm btn-danger-ghost">
                      Zero All
                    </button>
                  </div>
                  <span className={`badge ${allocTotal === 100 ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: 13, padding: '5px 12px' }}>
                    Total: {allocTotal}% / 100%
                  </span>
                </div>

                <div className="grid-3" style={{ alignItems: 'center' }}>
                  <div className="span-2" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {INDEX_STRATEGIES.map((strat) => {
                      const val = Math.round(parseNum(clientCase.allocations[strat.key]));
                      return (
                        <div
                          key={strat.key}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.3fr 1fr 78px',
                            alignItems: 'center',
                            gap: 12,
                            padding: '9px 12px',
                            borderRadius: 11,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: strat.color,
                                flexShrink: 0
                              }}
                            />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                                {strat.shortLabel}
                              </div>
                              <div style={{ fontSize: 10.5, color: '#64748b' }}>{strat.tag}</div>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={val}
                            onChange={(e) => updateAllocation(strat.key, e.target.value)}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              className="input"
                              style={{ padding: '6px 22px 6px 8px', textAlign: 'right', fontWeight: 700, fontSize: 12.5 }}
                              value={val}
                              onChange={(e) => updateAllocation(strat.key, e.target.value)}
                            />
                            <span style={{ position: 'absolute', right: 8, top: 7, fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                              %
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      minHeight: 250
                    }}
                  >
                    <div style={{ width: '100%', height: 195 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData.length ? pieData : [{ name: 'Unallocated', value: 100, color: '#cbd5e1' }]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={78}
                            paddingAngle={2}
                          >
                            {(pieData.length ? pieData : [{ color: '#cbd5e1' }]).map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => `${val}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: allocTotal === 100 ? '#047857' : '#e11d48' }}>
                      {allocTotal === 100
                        ? '100% Index Mix Balanced'
                        : allocTotal < 100
                          ? `${100 - allocTotal}% Remaining to Allocate`
                          : `${allocTotal - 100}% Over 100% Limit`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
