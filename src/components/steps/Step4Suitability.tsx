import React from 'react';
import { Activity, Briefcase, PiggyBank, Sliders } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { HEALTH_CONDITIONS } from '../../data/knowledgeBase';
import type { ClientCase } from '../../types/portal';
import { evaluateIGO, fmtCurrency, parseNum } from '../../utils/calculations';
import { StepHeader } from './StepHeader';

interface Step4SuitabilityProps {
  clientCase: ClientCase;
  onUpdate: (patch: Partial<ClientCase>) => void;
}

export const Step4Suitability: React.FC<Step4SuitabilityProps> = ({
  clientCase,
  onUpdate
}) => {
  const igo = evaluateIGO(clientCase);
  const showHealthBlock = clientCase.track === 'life' || clientCase.dualReview;

  const toggleIncomeSource = (src: string) => {
    const exists = clientCase.incomeSources.includes(src);
    const next = exists
      ? clientCase.incomeSources.filter((s) => s !== src)
      : [...clientCase.incomeSources, src];
    onUpdate({ incomeSources: next });
  };

  const toggleHealthCondition = (cond: string) => {
    if (cond === 'None') {
      onUpdate({ healthConditions: ['None'] });
      return;
    }
    const withoutNone = clientCase.healthConditions.filter((c) => c !== 'None');
    const exists = withoutNone.includes(cond);
    const next = exists
      ? withoutNone.filter((c) => c !== cond)
      : [...withoutNone, cond];
    onUpdate({ healthConditions: next.length ? next : ['None'] });
  };

  const liquidNW = parseNum(clientCase.liquidNetWorth);
  const depositAmt = parseNum(clientCase.estimatedPremium);
  const gaugeSafe = igo.remainingLiquid >= 15000 && (!igo.drawsFromLiquid || igo.premiumToLiquidPct <= 75);

  const liquidityChartData = igo.drawsFromLiquid
    ? [
        { name: 'Proposed Cash Deposit', value: Math.min(depositAmt, liquidNW || depositAmt), color: '#d97706' },
        { name: 'Remaining Liquid Reserve', value: Math.max(0, igo.remainingLiquid), color: '#10b981' }
      ]
    : [
        { name: 'Rollover / 1035 Deposit', value: depositAmt || 1, color: '#0f172a' },
        { name: 'Preserved Liquid Cash', value: liquidNW || 1, color: '#10b981' }
      ];

  return (
    <>
      <StepHeader
        num={4}
        title="Financial Suitability & Best Interest Profile (NAIC / Form 4106)"
        subtitle="Regulatory Best Interest standards require verifying income, liquid emergency reserves, and retirement horizon."
      />
      <div className="step-body">
        {/* Employment & Cash Flow */}
        <div>
          <h3 className="section-heading">
            <Briefcase size={16} color="#d97706" />
            <span>Employment &amp; Household Cash Flow</span>
          </h3>
          <div className="grid-4">
            <div>
              <label className="field-label">Employment Status *</label>
              <select
                className="select"
                value={clientCase.employmentStatus}
                onChange={(e) => onUpdate({ employmentStatus: e.target.value })}
              >
                {['Retired', 'Employed', 'Self-Employed', 'Homemaker'].map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Occupation / Former Role</label>
              <input
                className="input"
                value={clientCase.occupation}
                onChange={(e) => onUpdate({ occupation: e.target.value })}
                placeholder="e.g., Retired Educator"
              />
            </div>
            <div>
              <label className="field-label">Employer Name</label>
              <input
                className="input"
                value={clientCase.employer}
                onChange={(e) => onUpdate({ employer: e.target.value })}
                placeholder="Employer or Self"
              />
            </div>
            <div>
              <label className="field-label">Estimated Fed Tax Bracket</label>
              <select
                className="select"
                value={clientCase.taxBracket}
                onChange={(e) => onUpdate({ taxBracket: e.target.value })}
              >
                {['10%', '12%', '22%', '24%', '32%', '35%', '37%'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Annual Gross Household Income ($) *</label>
              <input
                type="number"
                min={0}
                step={1000}
                className="input"
                style={{ fontWeight: 600 }}
                value={clientCase.annualIncome}
                onChange={(e) => onUpdate({ annualIncome: e.target.value })}
                placeholder="95000"
              />
            </div>
            <div>
              <label className="field-label">Monthly Living Expenses ($) *</label>
              <input
                type="number"
                min={0}
                step={100}
                className="input"
                style={{ fontWeight: 600 }}
                value={clientCase.monthlyExpenses}
                onChange={(e) => onUpdate({ monthlyExpenses: e.target.value })}
                placeholder="4500"
              />
            </div>
            <div className="span-2">
              <label className="field-label">Household Income Sources (Select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 }}>
                {['Wages', 'Social Security', 'Pension', 'Rentals', 'Investments'].map((src) => {
                  const active = clientCase.incomeSources.includes(src);
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => toggleIncomeSource(src)}
                      className={`chip ${active ? 'active' : ''}`}
                    >
                      {src}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Net Worth & Interactive Suitability Gauge */}
        <div className="section-divider">
          <h3 className="section-heading" style={{ marginBottom: 4 }}>
            <PiggyBank size={16} color="#d97706" />
            <span>Net Worth &amp; Liquid Emergency Reserves</span>
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
            Carriers verify you retain sufficient accessible cash outside any annuity surrender period.
          </p>

          <div className="grid-4">
            <div>
              <label className="field-label">Total Net Worth (Excl. Home) *</label>
              <input
                type="number"
                min={0}
                step={5000}
                className="input"
                style={{ fontWeight: 600 }}
                value={clientCase.totalNetWorth}
                onChange={(e) => onUpdate({ totalNetWorth: e.target.value })}
                placeholder="650000"
              />
            </div>
            <div>
              <label className="field-label">Liquid Net Worth (Cash/Brokerage) *</label>
              <input
                type="number"
                min={0}
                step={1000}
                className="input"
                style={{ fontWeight: 600 }}
                value={clientCase.liquidNetWorth}
                onChange={(e) => onUpdate({ liquidNetWorth: e.target.value })}
                placeholder="120000"
              />
            </div>
            <div>
              <label className="field-label">Existing Life / Annuity Assets ($)</label>
              <input
                type="number"
                min={0}
                step={5000}
                className="input"
                value={clientCase.existingLifeAnnuity}
                onChange={(e) => onUpdate({ existingLifeAnnuity: e.target.value })}
                placeholder="200000"
              />
            </div>
            <div>
              <label className="field-label" style={{ color: '#b45309' }}>
                Est. Proposed Deposit / Premium ($)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                className="input"
                style={{ borderColor: '#f59e0b', background: '#fffbeb', fontWeight: 700 }}
                value={clientCase.estimatedPremium}
                onChange={(e) => onUpdate({ estimatedPremium: e.target.value })}
                placeholder="150000"
              />
            </div>
          </div>

          {/* Interactive Suitability & Liquidity Visual Panel */}
          <div
            className={`callout ${gaugeSafe ? 'callout-emerald' : 'callout-amber'}`}
            style={{ marginTop: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
          >
            <div style={{ flex: '1 1 280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Activity size={16} color={gaugeSafe ? '#059669' : '#d97706'} />
                <strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                  Live Suitability &amp; Liquidity Buffer Check
                </strong>
                <span className={`badge ${gaugeSafe ? 'badge-emerald' : 'badge-gold'}`}>
                  {gaugeSafe ? 'Healthy Reserve' : 'Review Concentration'}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Post-Funding Liquid Reserve: {fmtCurrency(igo.remainingLiquid)}
                {igo.emergencyMonths !== null ? ` (~${igo.emergencyMonths} months expenses)` : ''}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                {igo.drawsFromLiquid
                  ? `Non-Qualified cash deposit represents ${igo.premiumToLiquidPct}% of current Liquid Net Worth.`
                  : `Funded via ${clientCase.taxQualification} — preserves 100% of existing non-retirement cash reserves (${fmtCurrency(clientCase.liquidNetWorth)}).`}
              </p>
            </div>

            <div style={{ width: 170, height: 96, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={liquidityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="85%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={42}
                    outerRadius={66}
                    paddingAngle={2}
                  >
                    {liquidityChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Horizon, Risk & Liquidity Preferences */}
        <div className="section-divider">
          <h3 className="section-heading">
            <Sliders size={16} color="#d97706" />
            <span>Risk Tolerance, Horizon &amp; Income Plans</span>
          </h3>
          <div className="grid-3">
            <div>
              <label className="field-label">Risk Tolerance</label>
              <select
                className="select"
                value={clientCase.riskTolerance}
                onChange={(e) => onUpdate({ riskTolerance: e.target.value })}
              >
                {[
                  'Conservative (Principal Safety First)',
                  'Moderately Conservative',
                  'Moderate',
                  'Growth'
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Holding Time Horizon</label>
              <select
                className="select"
                value={clientCase.timeHorizon}
                onChange={(e) => onUpdate({ timeHorizon: e.target.value })}
              >
                {['3-5 yrs', '5-7 yrs', '7-10 yrs', '10+ yrs'].map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Anticipated Income Start Timing</label>
              <select
                className="select"
                value={clientCase.incomeStartTiming}
                onChange={(e) => onUpdate({ incomeStartTiming: e.target.value })}
              >
                {[
                  'Immediate (<12 Months)',
                  '1-3 Years',
                  '4-7 Years',
                  '8-10+ Years',
                  'Legacy / Do Not Plan to Turn On'
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="span-2">
              <label className="field-label">Planned Use of 10% Annual Penalty-Free Withdrawals</label>
              <select
                className="select"
                value={clientCase.freeWithdrawalPlan}
                onChange={(e) => onUpdate({ freeWithdrawalPlan: e.target.value })}
              >
                {[
                  'No planned withdrawals (Emergency / RMD only)',
                  'RMDs / Systematic Lifetime Income Rider',
                  'Systematic up to 10% free annual withdrawals',
                  'Occasional supplemental liquidity'
                ].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Existing Long-Term Care Coverage?</label>
              <select
                className="select"
                value={clientCase.hasLTC}
                onChange={(e) => onUpdate({ hasLTC: e.target.value })}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conditional Life / IUL Health Block */}
        {showHealthBlock && (
          <div className="section-divider">
            <div
              className="callout callout-slate"
              style={{ flexDirection: 'column', gap: 16, padding: 20 }}
            >
              <div>
                <span className="badge badge-gold">Life / IUL / Final Expense Underwriting Profile</span>
                <h3 style={{ margin: '8px 0 2px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Health, Build &amp; Lifestyle Pre-Screen
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Helps match the client with the most lenient non-medical or accelerated carrier (Foresters, LGA, Mutual of Omaha, AAMA).
                </p>
              </div>

              <div className="grid-4" style={{ width: '100%' }}>
                <div>
                  <label className="field-label">Desired Death Benefit ($)</label>
                  <input
                    type="number"
                    min={2000}
                    step={5000}
                    className="input"
                    style={{ fontWeight: 700 }}
                    value={clientCase.desiredFaceAmount}
                    onChange={(e) => onUpdate({ desiredFaceAmount: e.target.value })}
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="field-label">Height (Ft / In)</label>
                  <div className="grid-2" style={{ gap: 8 }}>
                    <input
                      type="number"
                      min={3}
                      max={7}
                      className="input"
                      value={clientCase.heightFt}
                      onChange={(e) => onUpdate({ heightFt: e.target.value })}
                      placeholder="Ft"
                    />
                    <input
                      type="number"
                      min={0}
                      max={11}
                      className="input"
                      value={clientCase.heightIn}
                      onChange={(e) => onUpdate({ heightIn: e.target.value })}
                      placeholder="In"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Weight (lbs)</label>
                  <input
                    type="number"
                    min={50}
                    max={600}
                    className="input"
                    value={clientCase.weightLbs}
                    onChange={(e) => onUpdate({ weightLbs: e.target.value })}
                    placeholder="180"
                  />
                </div>
                <div>
                  <label className="field-label">Nicotine / Substance Profile</label>
                  <select
                    className="select"
                    value={clientCase.nicotineProfile}
                    onChange={(e) => onUpdate({ nicotineProfile: e.target.value })}
                  >
                    {[
                      'None',
                      'Cigarettes',
                      'Occasional Cigars <=2/mo',
                      'Vape/Patches',
                      'Marijuana'
                    ].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ width: '100%' }}>
                <label className="field-label" style={{ marginBottom: 8 }}>
                  Health Conditions (Select any that apply)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {HEALTH_CONDITIONS.map((c) => {
                    const active = clientCase.healthConditions.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleHealthCondition(c)}
                        className={`chip ${active ? 'active' : ''}`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={clientCase.isPilot}
                  onChange={(e) => onUpdate({ isPilot: e.target.checked })}
                />
                <span>Client is an active Commercial or Private Pilot / Scuba Diver</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
