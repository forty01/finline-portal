import React from 'react';
import { Activity, Briefcase, PiggyBank, Sliders } from 'lucide-react';
import { HEALTH_CONDITIONS } from '../../data/knowledgeBase';
import type { ClientCase } from '../../types/portal';
import { evaluateIGO, fmtCurrencyExact, parseNum } from '../../utils/calculations';
import { CurrencyInput } from '../CurrencyInput';
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
    onUpdate({ healthConditions: next });
  };

  const hasLiquidEntered = clientCase.liquidNetWorth.trim() !== '';
  const liquidNW = parseNum(clientCase.liquidNetWorth);
  const depositAmt = parseNum(clientCase.estimatedPremium);
  const gaugeSafe =
    !hasLiquidEntered ||
    (igo.remainingLiquid >= 15000 && (!igo.drawsFromLiquid || igo.premiumToLiquidPct <= 75));

  const preservedPct =
    liquidNW > 0 ? Math.max(0, Math.min(100, Math.round((igo.remainingLiquid / liquidNW) * 100))) : 0;

  return (
    <>
      <StepHeader
        num={4}
        title="Financial Suitability & Profile"
        subtitle="Carriers require verifying your household income, liquid reserves, and time horizon to ensure any recommendation fits your needs."
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
                <option value="">Select...</option>
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
                placeholder="Occupation"
              />
            </div>
            <div>
              <label className="field-label">Employer Name</label>
              <input
                className="input"
                value={clientCase.employer}
                onChange={(e) => onUpdate({ employer: e.target.value })}
                placeholder="Employer"
              />
            </div>
            <div>
              <label className="field-label">Estimated Fed Tax Bracket</label>
              <select
                className="select"
                value={clientCase.taxBracket}
                onChange={(e) => onUpdate({ taxBracket: e.target.value })}
              >
                <option value="">Select...</option>
                {['10%', '12%', '22%', '24%', '32%', '35%', '37%'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Annual Gross Household Income *</label>
              <CurrencyInput
                id="inputAnnualIncome"
                ariaLabel="Annual Gross Household Income"
                style={{ fontWeight: 600 }}
                value={clientCase.annualIncome}
                onChange={(val) => onUpdate({ annualIncome: val })}
              />
            </div>
            <div>
              <label className="field-label">Monthly Living Expenses *</label>
              <CurrencyInput
                id="inputMonthlyExpenses"
                ariaLabel="Monthly Living Expenses"
                style={{ fontWeight: 600 }}
                value={clientCase.monthlyExpenses}
                onChange={(val) => onUpdate({ monthlyExpenses: val })}
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

        {/* Net Worth & Clean Liquidity Buffer Bar */}
        <div className="section-divider">
          <h3 className="section-heading" style={{ marginBottom: 4 }}>
            <PiggyBank size={16} color="#d97706" />
            <span>Net Worth &amp; Liquid Emergency Reserves</span>
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
            Carriers verify you retain sufficient accessible cash outside any policy surrender period. (Proposed deposit is entered in Step 5.)
          </p>

          <div className="grid-3">
            <div>
              <label className="field-label">Total Net Worth (Excl. Home) *</label>
              <CurrencyInput
                id="inputTotalNetWorth"
                ariaLabel="Total Net Worth"
                style={{ fontWeight: 600 }}
                value={clientCase.totalNetWorth}
                onChange={(val) => onUpdate({ totalNetWorth: val })}
              />
            </div>
            <div>
              <label className="field-label">Liquid Net Worth (Cash/Brokerage) *</label>
              <CurrencyInput
                id="inputLiquidNetWorth"
                ariaLabel="Liquid Net Worth"
                style={{ fontWeight: 600 }}
                value={clientCase.liquidNetWorth}
                onChange={(val) => onUpdate({ liquidNetWorth: val })}
              />
            </div>
            <div>
              <label className="field-label">Existing Life / Annuity Assets</label>
              <CurrencyInput
                id="inputExistingAssets"
                ariaLabel="Existing Life or Annuity Assets"
                value={clientCase.existingLifeAnnuity}
                onChange={(val) => onUpdate({ existingLifeAnnuity: val })}
              />
            </div>
          </div>

          {/* Clean Horizontal Liquidity Buffer Card */}
          <div
            className={`callout ${
              !hasLiquidEntered ? 'callout-slate' : gaugeSafe ? 'callout-emerald' : 'callout-amber'
            }`}
            style={{ marginTop: 16, flexDirection: 'column', gap: 10 }}
          >
            <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity
                  size={16}
                  color={!hasLiquidEntered ? '#64748b' : gaugeSafe ? '#059669' : '#d97706'}
                />
                <strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                  Live Suitability &amp; Liquidity Reserve
                </strong>
              </div>
              {hasLiquidEntered && (
                <span className={`badge ${gaugeSafe ? 'badge-emerald' : 'badge-gold'}`}>
                  {gaugeSafe ? 'Healthy Reserve' : 'Review Concentration'}
                </span>
              )}
            </div>

            {!hasLiquidEntered ? (
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                Enter your Liquid Net Worth above to calculate your post-funding emergency reserve.
              </p>
            ) : (
              <>
                <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    Post-Funding Liquid Reserve: {fmtCurrencyExact(igo.remainingLiquid)}
                    {igo.emergencyMonths !== null ? ` (~${igo.emergencyMonths} months expenses)` : ''}
                  </span>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    {preservedPct}% of Liquid Net Worth Retained
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${preservedPct}%`,
                      background: gaugeSafe ? '#10b981' : '#f59e0b'
                    }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
                  {depositAmt === 0
                    ? `Current liquid reserves: ${fmtCurrencyExact(liquidNW)}. Enter your proposed deposit in Step 5 to verify final reserve impact.`
                    : igo.drawsFromLiquid
                      ? `Proposed Non-Qualified cash deposit (${fmtCurrencyExact(depositAmt)}) represents ${igo.premiumToLiquidPct}% of Liquid Net Worth.`
                      : `Funded via ${clientCase.taxQualification || 'Rollover'} — preserves 100% of existing non-retirement cash reserves (${fmtCurrencyExact(liquidNW)}).`}
                </p>
              </>
            )}
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
                <option value="">Select...</option>
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
                <option value="">Select...</option>
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
                <option value="">Select...</option>
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
                <option value="">Select...</option>
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
                <option value="">Select...</option>
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
                <span className="badge badge-gold">Life Insurance Health Pre-Screen</span>
                <h3 style={{ margin: '8px 0 2px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Health, Build &amp; Lifestyle Profile
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Helps match you with the best carrier and fastest approval process.
                </p>
              </div>

              <div className="grid-4" style={{ width: '100%' }}>
                <div>
                  <label className="field-label">Desired Death Benefit</label>
                  <CurrencyInput
                    id="inputDesiredFaceAmount"
                    ariaLabel="Desired Death Benefit"
                    style={{ fontWeight: 700 }}
                    value={clientCase.desiredFaceAmount}
                    onChange={(val) => onUpdate({ desiredFaceAmount: val })}
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
                    placeholder="lbs"
                  />
                </div>
                <div>
                  <label className="field-label">Nicotine / Substance Profile</label>
                  <select
                    className="select"
                    value={clientCase.nicotineProfile}
                    onChange={(e) => onUpdate({ nicotineProfile: e.target.value })}
                  >
                    <option value="">Select...</option>
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
                <span>Active Commercial or Private Pilot / Scuba Diver</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
