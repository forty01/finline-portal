import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  HeartPulse,
  Landmark,
  ShieldCheck
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { ClientCase } from '../types/portal';
import {
  calculateAge,
  calculateFIAProjection,
  calculateIULProjection,
  fmtCurrency,
  parseNum
} from '../utils/calculations';

interface CalculatorsViewProps {
  activeCase: ClientCase;
  onApplyToCase: (patch: Partial<ClientCase>, label: string) => void;
}

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({
  activeCase,
  onApplyToCase
}) => {
  const clientAge = calculateAge(activeCase.ownerDOB) ?? (activeCase.track === 'annuity' ? 65 : 45);
  const clientBracket = parseNum(activeCase.taxBracket) || 24;

  const [tab, setTab] = useState<'fia' | 'iul'>(activeCase.track === 'life' ? 'iul' : 'fia');

  // FIA Calculator State
  const [fiaPremium, setFiaPremium] = useState<number>(
    parseNum(activeCase.estimatedPremium) >= 10000 ? parseNum(activeCase.estimatedPremium) : 250000
  );
  const [fiaAge, setFiaAge] = useState<number>(Math.max(45, Math.min(82, clientAge)));
  const [fiaDeferral, setFiaDeferral] = useState<number>(5);
  const [fiaBonus, setFiaBonus] = useState<number>(10);
  const [fiaRollup, setFiaRollup] = useState<number>(7.25);
  const [fiaCredit, setFiaCredit] = useState<number>(5.0);
  const [fiaJoint, setFiaJoint] = useState<boolean>(activeCase.ownerMarital === 'Married');

  // IUL Calculator State
  const [iulAnnual, setIulAnnual] = useState<number>(
    activeCase.track === 'life' && parseNum(activeCase.estimatedPremium) > 0
      ? parseNum(activeCase.estimatedPremium)
      : 18000
  );
  const [iulAge, setIulAge] = useState<number>(Math.max(20, Math.min(60, clientAge)));
  const [iulRetireAge, setIulRetireAge] = useState<number>(Math.max(60, Math.min(72, clientAge + 18)));
  const [iulRate, setIulRate] = useState<number>(6.25);
  const [iulTax, setIulTax] = useState<number>(clientBracket);
  const [iulFace, setIulFace] = useState<number>(
    parseNum(activeCase.desiredFaceAmount) > 0 ? parseNum(activeCase.desiredFaceAmount) : 1000000
  );

  const fia = useMemo(
    () =>
      calculateFIAProjection({
        initialPremium: fiaPremium,
        currentAge: fiaAge,
        deferralYears: fiaDeferral,
        bonusPct: fiaBonus,
        rollupRatePct: fiaRollup,
        indexedCreditPct: fiaCredit,
        jointPayout: fiaJoint
      }),
    [fiaPremium, fiaAge, fiaDeferral, fiaBonus, fiaRollup, fiaCredit, fiaJoint]
  );

  const iul = useMemo(
    () =>
      calculateIULProjection({
        annualPremium: iulAnnual,
        currentAge: iulAge,
        retirementAge: iulRetireAge,
        illustratedRatePct: iulRate,
        taxBracketPct: iulTax,
        initialDeathBenefit: iulFace
      }),
    [iulAnnual, iulAge, iulRetireAge, iulRate, iulTax, iulFace]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14
        }}
      >
        <div>
          <span className="kicker-label" style={{ marginBottom: 3, color: '#b45309' }}>
            Interactive Illustration &amp; Suitability Modeler
          </span>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>
            Carrier Strategy Calculators
          </h2>
        </div>

        <div
          style={{
            display: 'inline-flex',
            background: '#e2e8f0',
            padding: 4,
            borderRadius: 12,
            gap: 4
          }}
        >
          <button
            type="button"
            onClick={() => setTab('fia')}
            className={`btn ${tab === 'fia' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Landmark size={15} color={tab === 'fia' ? '#fbbf24' : undefined} />
            <span>FIA Lifetime Income &amp; Wellbeing</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('iul')}
            className={`btn ${tab === 'iul' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <HeartPulse size={15} color={tab === 'iul' ? '#fbbf24' : undefined} />
            <span>IUL Tax-Free LIRP Estimator</span>
          </button>
        </div>
      </div>

      {tab === 'fia' ? (
        <>
          {/* FIA KPIs */}
          <div className="grid-4">
            <div className="kpi-card">
              <span className="kpi-label">Projected Benefit Base</span>
              <span className="kpi-value">{fmtCurrency(fia.projectedBenefitBase)}</span>
              <span className="kpi-sub">At Age {fia.incomeStartAge} ({fiaDeferral} yr deferral)</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Guaranteed Lifetime Income</span>
              <span className="kpi-value" style={{ color: '#047857' }}>
                {fmtCurrency(fia.guaranteedAnnualIncome)}/yr
              </span>
              <span className="kpi-sub">
                {fmtCurrency(Math.round(fia.guaranteedAnnualIncome / 12))}/mo ({fia.payoutRatePct}% payout)
              </span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Wellbeing 2x Care Doubler</span>
              <span className="kpi-value" style={{ color: '#b45309' }}>
                {fmtCurrency(fia.wellbeingAnnualIncome)}/yr
              </span>
              <span className="kpi-sub">Qualifying ADL/Care benefit (up to 5 yrs)</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Principal Downside Floor</span>
              <span className="kpi-value">0.00%</span>
              <span className="kpi-sub">Zero market-loss exposure</span>
            </div>
          </div>

          <div className="grid-3" style={{ alignItems: 'start' }}>
            {/* FIA Inputs */}
            <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator size={16} color="#d97706" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>FIA Rider Assumptions</h3>
              </div>

              <div>
                <label className="field-label">
                  <span>Initial Rollover / Deposit</span>
                  <strong>{fmtCurrency(fiaPremium)}</strong>
                </label>
                <input
                  type="range"
                  min={25000}
                  max={1000000}
                  step={5000}
                  value={fiaPremium}
                  onChange={(e) => setFiaPremium(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="field-label">Current Age</label>
                  <input
                    type="number"
                    min={45}
                    max={85}
                    className="input"
                    value={fiaAge}
                    onChange={(e) => setFiaAge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="field-label">Deferral (Yrs)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    className="input"
                    value={fiaDeferral}
                    onChange={(e) => setFiaDeferral(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div>
                  <label className="field-label">Bonus %</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={1}
                    className="input"
                    value={fiaBonus}
                    onChange={(e) => setFiaBonus(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="field-label">Roll-Up %</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.25}
                    className="input"
                    value={fiaRollup}
                    onChange={(e) => setFiaRollup(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="field-label">Index %</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    step={0.5}
                    className="input"
                    value={fiaCredit}
                    onChange={(e) => setFiaCredit(Number(e.target.value))}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fiaJoint}
                  onChange={(e) => setFiaJoint(e.target.checked)}
                />
                <span>Joint Spousal Lifetime Income Payout (-0.50%)</span>
              </label>

              <button
                type="button"
                className="btn btn-gold"
                onClick={() =>
                  onApplyToCase(
                    {
                      track: 'annuity',
                      estimatedPremium: String(fiaPremium),
                      targetProduct: 'American Equity IncomeShield 10'
                    },
                    `Applied ${fmtCurrency(fiaPremium)} IncomeShield 10 projection to active case`
                  )
                }
              >
                <span>Apply Deposit to Active Case</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* FIA Chart */}
            <div className="card card-padded span-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Income Benefit Base vs. Account Value Trajectory
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                    Illustrative model showing rider Benefit Base roll-up and lifetime income activation at Age {fia.incomeStartAge}.
                  </p>
                </div>
                <span className="badge badge-emerald">
                  <ShieldCheck size={13} /> 0% Floor Protected
                </span>
              </div>

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fia.points} margin={{ top: 10, right: 14, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradAcct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="age" tickFormatter={(a) => `Age ${a}`} fontSize={11} />
                    <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} fontSize={11} />
                    <Tooltip
                      formatter={(val) => fmtCurrency(val)}
                      labelFormatter={(age) => `Client Age ${age}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="benefitBase"
                      name="Income Benefit Base"
                      stroke="#d97706"
                      strokeWidth={2.5}
                      fill="url(#gradBase)"
                    />
                    <Area
                      type="monotone"
                      dataKey="accountValue"
                      name="Est. Account Value"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fill="url(#gradAcct)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#64748b' }}>
                Hypothetical illustration for educational &amp; suitability planning only. Actual carrier rates, caps, and rider fees vary by state and issue date.
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* IUL KPIs */}
          <div className="grid-4">
            <div className="kpi-card">
              <span className="kpi-label">Total Premiums Funded</span>
              <span className="kpi-value">{fmtCurrency(iul.totalContributed)}</span>
              <span className="kpi-sub">Ages {iulAge} to {iulRetireAge}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Est. Cash Value at {iulRetireAge}</span>
              <span className="kpi-value" style={{ color: '#0f172a' }}>
                {fmtCurrency(iul.cashValueAtRetirement)}
              </span>
              <span className="kpi-sub">At {iulRate}% illustrated index crediting</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Est. Tax-Free Annual Income</span>
              <span className="kpi-value" style={{ color: '#047857' }}>
                {fmtCurrency(iul.estTaxFreeAnnualIncome)}/yr
              </span>
              <span className="kpi-sub">IRC §7702 tax-advantaged policy loans</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Taxable Equivalent Needed</span>
              <span className="kpi-value" style={{ color: '#b45309' }}>
                {fmtCurrency(iul.taxableEquivalentIncome)}/yr
              </span>
              <span className="kpi-sub">In a {iulTax}% marginal tax bracket</span>
            </div>
          </div>

          <div className="grid-3" style={{ alignItems: 'start' }}>
            {/* IUL Inputs */}
            <div className="card card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator size={16} color="#d97706" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>IUL / LIRP Funding Inputs</h3>
              </div>

              <div>
                <label className="field-label">
                  <span>Annual Overfunded Premium</span>
                  <strong>{fmtCurrency(iulAnnual)}/yr</strong>
                </label>
                <input
                  type="range"
                  min={3000}
                  max={60000}
                  step={1000}
                  value={iulAnnual}
                  onChange={(e) => setIulAnnual(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label className="field-label">Current Age</label>
                  <input
                    type="number"
                    min={18}
                    max={65}
                    className="input"
                    value={iulAge}
                    onChange={(e) => setIulAge(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="field-label">Income Age</label>
                  <input
                    type="number"
                    min={iulAge + 5}
                    max={80}
                    className="input"
                    value={iulRetireAge}
                    onChange={(e) => setIulRetireAge(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="field-label">Illustrated Rate %</label>
                  <input
                    type="number"
                    min={3}
                    max={7.5}
                    step={0.25}
                    className="input"
                    value={iulRate}
                    onChange={(e) => setIulRate(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="field-label">Tax Bracket %</label>
                  <input
                    type="number"
                    min={10}
                    max={37}
                    step={1}
                    className="input"
                    value={iulTax}
                    onChange={(e) => setIulTax(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Initial Death Benefit ($)</label>
                <input
                  type="number"
                  min={100000}
                  step={50000}
                  className="input"
                  value={iulFace}
                  onChange={(e) => setIulFace(Number(e.target.value))}
                />
              </div>

              <button
                type="button"
                className="btn btn-gold"
                onClick={() =>
                  onApplyToCase(
                    {
                      track: 'life',
                      estimatedPremium: String(iulAnnual),
                      desiredFaceAmount: String(iulFace),
                      targetProduct: 'Mutual of Omaha Income Advantage / AccumUL IUL'
                    },
                    `Applied ${fmtCurrency(iulAnnual)}/yr IUL LIRP design to active case`
                  )
                }
              >
                <span>Apply Design to Active Case</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* IUL Chart */}
            <div className="card card-padded span-2">
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Cumulative Premiums Paid vs. Projected Cash Value
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Illustrates tax-deferred cash value accumulation through Age {iulRetireAge} followed by tax-free policy loan distributions.
                </p>
              </div>

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={iul.points} margin={{ top: 10, right: 14, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="age" tickFormatter={(a) => `${a}`} fontSize={11} />
                    <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} fontSize={11} />
                    <Tooltip
                      formatter={(val) => fmtCurrency(val)}
                      labelFormatter={(age) => `Age ${age}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="totalPremiumsPaid"
                      name="Cumulative Premiums"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="cashSurrenderValue"
                      name="Projected Cash Value"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11, color: '#64748b' }}>
                Non-guaranteed hypothetical estimate. Official carrier NAIC AG49-B compliant illustration must be run via carrier portal prior to application.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
