import type {
  CarrierRecommendation,
  ClientCase,
  IGOCheck,
  IGOEvaluation
} from '../types/portal';

export function calculateAge(dobStr: string): number | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr + 'T00:00:00');
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 && age < 125 ? age : null;
}

export function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function fmtCurrency(val: unknown): string {
  const n = parseNum(val);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n);
}

export function fmtCurrencyExact(val: unknown): string {
  if (val === null || val === undefined || String(val).trim() === '') return '—';
  const n = parseNum(val);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

export function maskValue(val: string, masked: boolean, type: 'ssn' | 'id' = 'ssn'): string {
  if (!val) return '—';
  if (!masked) return val;
  const str = String(val);
  if (str.length <= 4) return '••••';
  const last4 = str.slice(-4);
  return type === 'ssn' ? `•••-••-${last4}` : `••••••${last4}`;
}

export function isIdExpired(expDateStr: string): boolean {
  if (!expDateStr) return false;
  const exp = new Date(expDateStr + 'T23:59:59');
  return exp < new Date();
}

export function isQualifiedPlan(taxQualification: string): boolean {
  return [
    'Traditional IRA',
    'Roth IRA',
    '401(k)/403(b)/457 Rollover',
    'SEP-IRA'
  ].includes(taxQualification);
}

export function isRmdBlocked(c: ClientCase): boolean {
  const age = calculateAge(c.ownerDOB);
  return age !== null && age >= 73 && isQualifiedPlan(c.taxQualification) && c.rmdSatisfied !== 'Yes';
}

export function getBeneficiaryTotals(c: ClientCase) {
  let primaryTotal = 0;
  let contingentTotal = 0;
  let contingentCount = 0;
  let hasEstateWarning = false;

  c.beneficiaries.forEach((b) => {
    const pct = Math.round(parseNum(b.share));
    if (b.type === 'Primary') primaryTotal += pct;
    else {
      contingentTotal += pct;
      contingentCount++;
    }
    const combined = `${b.name} ${b.relationship}`.toLowerCase();
    if (combined.includes('estate')) hasEstateWarning = true;
  });

  return { primaryTotal, contingentTotal, contingentCount, hasEstateWarning };
}

export function getAllocationTotal(c: ClientCase): number {
  if (c.allocationMode === 'strategist') return 100;
  return Object.values(c.allocations).reduce((acc, v) => acc + Math.round(parseNum(v)), 0);
}

export function evaluateIGO(c: ClientCase): IGOEvaluation {
  const ownerAge = calculateAge(c.ownerDOB);
  const benTotals = getBeneficiaryTotals(c);
  const allocTotal = getAllocationTotal(c);
  const premium = parseNum(c.estimatedPremium);
  const liquidNW = parseNum(c.liquidNetWorth);
  const monthlyExp = parseNum(c.monthlyExpenses);
  const qualified = isQualifiedPlan(c.taxQualification);
  const rmdBlocked = isRmdBlocked(c);
  const needsTransferInfo =
    ['Direct Transfer/Rollover', '1035 Exchange'].includes(c.fundingMethod) ||
    c.isReplacement === 'Yes' ||
    c.taxQualification === '1035 Tax-Free Exchange';

  const drawsFromLiquid =
    Boolean(c.taxQualification) &&
    !qualified &&
    c.taxQualification !== '1035 Tax-Free Exchange' &&
    c.fundingMethod !== '1035 Exchange';
  const remainingLiquid = drawsFromLiquid ? Math.max(0, liquidNW - premium) : liquidNW;
  const premiumToLiquidPct = liquidNW > 0 ? Math.round((premium / liquidNW) * 100) : 0;
  const emergencyMonths = monthlyExp > 0 ? Number((remainingLiquid / monthlyExp).toFixed(1)) : null;

  const checks: IGOCheck[] = [
    {
      id: 'owner_rules',
      title: 'Owner & Annuitant Structure',
      status:
        (qualified && c.ownershipType === 'Joint') || (qualified && !c.annuitantSameAsOwner)
          ? 'fail'
          : c.ownershipType &&
              c.ownerName.trim() &&
              c.ownerDOB &&
              c.ownerSSN.trim() &&
              (c.ownershipType !== 'Trust' || (c.trustName.trim() && c.trusteeName.trim()))
            ? 'pass'
            : 'warn',
      detail:
        qualified && c.ownershipType === 'Joint'
          ? 'IGO Error: Joint Owners are only permitted on Non-Qualified contracts.'
          : qualified && !c.annuitantSameAsOwner
            ? 'IGO Error: Qualified IRA/Rollover requires Owner and Annuitant to be the same person.'
            : c.ownershipType === 'Trust'
              ? c.trustName
                ? 'Trust-Owned: Attach Trust Cover, Trustee Pages & Signature Page.'
                : 'Missing Trust Name / Trustee details.'
              : c.ownershipType && c.ownerName.trim() && c.ownerDOB && c.ownerSSN.trim()
                ? 'Valid Owner/Annuitant legal profile.'
                : 'Complete Ownership Type, Owner Name, DOB, and SSN/TIN.'
    },
    {
      id: 'patriot_id',
      title: 'USA PATRIOT Act Photo ID',
      status:
        !c.idType || !c.idNumber.trim() || !c.idExpDate
          ? 'warn'
          : isIdExpired(c.idExpDate)
            ? 'fail'
            : 'pass',
      detail: isIdExpired(c.idExpDate)
        ? `Expired ID (${c.idExpDate}) — Unexpired government photo ID is mandatory.`
        : c.idType && c.idNumber.trim() && c.idExpDate
          ? `${c.idType} (${c.idState || '—'}) valid through ${c.idExpDate}.`
          : 'Enter Government Photo ID type, number, and expiration date.'
    },
    {
      id: 'beneficiaries',
      title: 'Beneficiary Whole-Number Split',
      status:
        benTotals.primaryTotal === 100 &&
        (benTotals.contingentCount === 0 || benTotals.contingentTotal === 100) &&
        c.beneficiaries[0]?.name.trim()
          ? benTotals.hasEstateWarning
            ? 'warn'
            : 'pass'
          : 'fail',
      detail:
        benTotals.primaryTotal !== 100
          ? `Primary Beneficiaries total ${benTotals.primaryTotal}% (Must equal 100%).`
          : benTotals.contingentCount > 0 && benTotals.contingentTotal !== 100
            ? `Contingent Beneficiaries total ${benTotals.contingentTotal}% (Must equal 100% or remove).`
            : benTotals.hasEstateWarning
              ? 'Warning: "Estate" listed — triggers probate & loses direct beneficiary stretch options.'
              : c.beneficiaries[0]?.name.trim()
                ? `Primary 100%${benTotals.contingentCount ? ' & Contingent 100%' : ''} verified.`
                : 'Enter Primary Beneficiary full legal name.'
    },
    {
      id: 'suitability_liquidity',
      title: 'NAIC Form 4106 Liquidity & Suitability',
      status:
        !c.annualIncome || !c.liquidNetWorth
          ? 'warn'
          : (drawsFromLiquid && premium > liquidNW * 0.75) || remainingLiquid < 10000
            ? 'fail'
            : 'pass',
      detail:
        !c.annualIncome || !c.liquidNetWorth
          ? 'Enter Household Income and Liquid Net Worth for Best Interest review.'
          : drawsFromLiquid && premium > liquidNW * 0.75
            ? `High concentration: Cash deposit is ${premiumToLiquidPct}% of Liquid Net Worth (${fmtCurrencyExact(remainingLiquid)} left).`
            : `Post-funding liquid reserve: ${fmtCurrencyExact(remainingLiquid)}${emergencyMonths !== null ? ` (~${emergencyMonths} mos expenses)` : ''}.`
    },
    {
      id: 'allocations',
      title:
        c.track === 'life'
          ? 'Coverage Face Amount & Health Profile'
          : 'Index Crediting Allocations (100%)',
      status:
        c.track === 'life'
          ? parseNum(c.desiredFaceAmount) > 0
            ? 'pass'
            : 'warn'
          : allocTotal === 100
            ? 'pass'
            : 'fail',
      detail:
        c.track === 'life'
          ? parseNum(c.desiredFaceAmount) > 0
            ? `Target Coverage: ${fmtCurrencyExact(c.desiredFaceAmount)} • Nicotine: ${c.nicotineProfile || '—'}.`
            : 'Enter desired Life / IUL face amount.'
          : c.allocationMode === 'strategist'
            ? 'Advisor-guided whole-number strategy selection.'
            : allocTotal === 100
              ? 'Custom whole-number index allocations equal 100%.'
              : `Custom allocations total ${allocTotal}% (Must equal exactly 100%).`
    },
    {
      id: 'rmd_alert',
      title: 'Age 73+ RMD & Form 4083 Check',
      status: rmdBlocked ? 'fail' : 'pass',
      detail: rmdBlocked
        ? `BLOCKED (Age ${ownerAge}): Satisfy current-year RMD or submit Form 4083 prior to IRA transfer!`
        : ownerAge !== null && ownerAge >= 73 && qualified
          ? `Client Age ${ownerAge}: Current-year RMD confirmed satisfied.`
          : 'No current-year RMD transfer restriction triggered.'
    },
    {
      id: 'replacement_docs',
      title: 'Rollover / 1035 / Replacement Details',
      status: !needsTransferInfo
        ? 'pass'
        : c.currentCarrier.trim() && c.currentPolicyNumber.trim()
          ? 'pass'
          : 'warn',
      detail: !needsTransferInfo
        ? 'New cash funding (no transfer/replacement forms required).'
        : c.currentCarrier.trim() && c.currentPolicyNumber.trim()
          ? `${c.currentCarrier} (#${c.currentPolicyNumber})${c.hasRecentStatement ? ' • Recent Statement ready' : ''}.`
          : 'Transfer/Replacement requires Current Institution/Carrier Name and Account/Policy #.'
    }
  ];

  const passCount = checks.filter((ck) => ck.status === 'pass').length;
  const failCount = checks.filter((ck) => ck.status === 'fail').length;
  const scorePct = Math.round((passCount / checks.length) * 100);

  return {
    checks,
    ownerAge,
    remainingLiquid,
    premiumToLiquidPct,
    emergencyMonths,
    drawsFromLiquid,
    passCount,
    failCount,
    scorePct
  };
}

export function getReadinessSummary(c: ClientCase) {
  const igo = evaluateIGO(c);
  const rmdBlocked = isRmdBlocked(c);
  const isIgoReady = !rmdBlocked && igo.failCount === 0 && igo.passCount === igo.checks.length;
  const label = rmdBlocked
    ? 'HOLD: RMD / FORM 4083 REQUIRED'
    : isIgoReady
      ? 'IGO READY'
      : 'PENDING REQUIRED DETAILS';
  return {
    igo,
    rmdBlocked,
    isIgoReady,
    label,
    countText: `${igo.passCount}/${igo.checks.length}`
  };
}

export function getStepStatus(c: ClientCase, stepNum: number): 'complete' | 'incomplete' {
  const ben = getBeneficiaryTotals(c);
  switch (stepNum) {
    case 1:
      return Boolean(c.track) && c.goals.length > 0 ? 'complete' : 'incomplete';
    case 2:
      return c.ownershipType &&
        c.ownerName.trim() &&
        c.ownerDOB &&
        c.ownerSSN.trim() &&
        c.idType &&
        c.idNumber.trim() &&
        !isIdExpired(c.idExpDate)
        ? 'complete'
        : 'incomplete';
    case 3:
      return ben.primaryTotal === 100 &&
        Boolean(c.beneficiaries[0]?.name.trim()) &&
        (ben.contingentCount === 0 || ben.contingentTotal === 100)
        ? 'complete'
        : 'incomplete';
    case 4:
      return parseNum(c.annualIncome) > 0 && c.liquidNetWorth !== ''
        ? 'complete'
        : 'incomplete';
    case 5:
      if (isRmdBlocked(c)) return 'incomplete';
      if (c.track === 'life') {
        return parseNum(c.estimatedPremium) > 0 || parseNum(c.desiredFaceAmount) > 0
          ? 'complete'
          : 'incomplete';
      }
      return parseNum(c.estimatedPremium) >= 5000 && getAllocationTotal(c) === 100
        ? 'complete'
        : 'incomplete';
    case 6:
      return !isRmdBlocked(c) && c.clientAcknowledged && c.clientSignature.trim().length > 2
        ? 'complete'
        : 'incomplete';
    default:
      return 'incomplete';
  }
}

export function getRecommendations(c: ClientCase): CarrierRecommendation[] {
  const recs: CarrierRecommendation[] = [];
  const age = calculateAge(c.ownerDOB) || 62;
  const premium = parseNum(c.estimatedPremium);
  const goals = c.goals;
  const conds = c.healthConditions;
  const nic = c.nicotineProfile;

  if (c.track === 'annuity' || c.dualReview) {
    if (
      goals.includes('Lifetime Guaranteed Income') ||
      goals.includes('Healthcare / Wellbeing Cost Offset') ||
      c.targetProduct.includes('IncomeShield')
    ) {
      recs.push({
        carrier: 'American Equity',
        rating: 'A- (AM Best / S&P / Fitch)',
        product: 'IncomeShield 10 (or IncomeShield 7)',
        badge: 'Primary FIA Match • Lifetime Income',
        highlight: true,
        fitReason:
          'Ideal for guaranteed lifetime retirement income with American Equity’s signature Wellbeing Benefit (income Rider payout doubling for qualifying healthcare/ADL needs) and 0% principal floor.',
        specs:
          'Min: $5k–$10k • 10% Annual Free Withdrawal after Yr 1 • S&P 500, BlackRock Adaptive & Dividend Aristocrats indexes',
        agentCrib:
          'Commission: 5%–8% FIA (age/term dependent) • Mandatory: Complete IncomeShield PST at agent.american-equity.com BEFORE signature date.'
      });
    }

    if (
      goals.includes('Accumulation / Premium Bonus') ||
      goals.includes('Principal Protection (0% Floor)') ||
      c.targetProduct.includes('AssetShield')
    ) {
      recs.push({
        carrier: 'American Equity',
        rating: 'A- (AM Best / S&P / Fitch)',
        product: 'AssetShield 10 / AssetShield BONUS 10',
        badge: 'Top Accumulation + Bonus FIA',
        highlight: !recs.length,
        fitReason:
          'Engineered for tax-deferred principal-protected accumulation with 10%–17% first-year premium bonus options (helpful for offsetting minor surrender charges on rollovers).',
        specs: 'Terms: 5, 7, or 10 Yrs • 0% Floor • Annual reset locks in index gains • No rider fee options available',
        agentCrib:
          'Commission: 5%–8% FIA • Trade-off note: AssetShield prioritizes bonus/caps and omits the Wellbeing Benefit rider.'
      });
    }

    if (goals.includes('Legacy / Estate Transfer') || c.targetProduct.includes('EstateShield')) {
      recs.push({
        carrier: 'American Equity',
        rating: 'A- (AM Best / S&P / Fitch)',
        product: 'EstateShield 10 (or 7)',
        badge: 'Legacy & Wealth Transfer FIA',
        highlight: false,
        fitReason:
          'Built for legacy-focused retirees wanting principal protection plus an Enhanced Death Benefit (beneficiaries can receive 75% of Benefit Base as a lump sum or 100% over 5 yrs).',
        specs: 'Min: $5k–$10k • Terminal Illness & Nursing Home Waivers included',
        agentCrib:
          'Commission: 5%–7.5% FIA • Great alternative when health conditions disqualify life/IUL underwriting.'
      });
    }

    if (c.timeHorizon === '3-5 yrs' || c.targetProduct.includes('Guarantee Shield')) {
      recs.push({
        carrier: 'American Equity',
        rating: 'A- (AM Best / S&P / Fitch)',
        product: 'Guarantee Shield 3 or 5 (Fixed MYGA)',
        badge: 'Short-Horizon Fixed Rate',
        highlight: false,
        fitReason:
          'Matches shorter 3-to-5 year time horizons with a CD-like guaranteed fixed interest rate, tax deferral, and nursing home/terminal illness riders.',
        specs: 'Surrender: 3 or 5 Yrs • Principal 100% Guaranteed',
        agentCrib: 'Commission: 1%–3% Fixed Annuity.'
      });
    }

    recs.push({
      carrier: 'North American (Sammons)',
      rating: 'A+ Superior (AM Best / S&P / Fitch)',
      product: 'VersaChoice 10℠ / PrimePath Pro®',
      badge: 'High Liquidity & A+ Private Carrier',
      highlight: false,
      fitReason:
        'Strong alternative for conservative clients wanting A+ ratings, ultra-low complaint history (0.46 NAIC index), up to 20% liquidity after Year 1, and Return of Premium after Year 3.',
      specs: 'Min: $5k–$25k • Nursing Home Waiver standard',
      agentCrib: 'Commission: 5%–7% FIA (1%–3% MYGA) • Privately held Sammons Financial Group.'
    });

    if (premium >= 20000 || premium === 0) {
      recs.push({
        carrier: 'F&G (Fidelity & Guaranty)',
        rating: 'A Excellent (AM Best)',
        product: 'Performance Pro® / Safe Income Advantage®',
        badge: 'High Bonus + Home Health Care',
        highlight: false,
        fitReason:
          'Up to 17% vesting premium bonus (age/state dependent) plus built-in living benefits unlocking full access for Nursing Home, Home Health Care, and Terminal Illness after Year 1.',
        specs: 'Minimum Premium: $20,000 ($2.5M max) • 10% Free Withdrawals after Yr 1',
        agentCrib: 'Commission: 5%–7% FIA + trail options.'
      });
    }

    recs.push({
      carrier: 'Corebridge Financial (AIG)',
      rating: 'A (AM Best) / A+ (S&P)',
      product: 'Power Series Index Annuity / MarketLock RILA',
      badge: 'High Payout Rate Alternative',
      highlight: false,
      fitReason:
        'Features Lifetime Income Max rider (up to 7.35% annual withdrawal rates depending on age) and $380B+ AUM institutional scale.',
      specs: 'Broad index & Lock Strategy options',
      agentCrib: 'Commission: 1%–7% Annuity (Note: RILA/Variable requires securities license).'
    });
  }

  if (c.track === 'life' || c.dualReview) {
    const hasSevereHealth = conds.some((x) =>
      ['Cancer Remission 2+ yrs', 'Stable Heart Condition', 'Mild COPD'].includes(x)
    );
    const hasDiabetesOrBP = conds.some((x) =>
      ['Controlled High Blood Pressure', 'Diabetes Type 1', 'Diabetes Type 2', 'Bipolar/Treated'].includes(x)
    );
    const usesAltNicotine = ['Occasional Cigars <=2/mo', 'Vape/Patches', 'Marijuana'].includes(nic);

    if (hasSevereHealth || (goals.includes('Final Expense / Mortgage Protection') && age >= 55)) {
      recs.push({
        carrier: 'AAMA (American-Amicable)',
        rating: 'A- Excellent (AM Best • Waco, TX)',
        product: 'Whole Life Final Expense / Simplified Term',
        badge: 'Best Health-Impaired & TX Final Expense',
        highlight: true,
        fitReason:
          'Accepts Cancer (2+ yrs remission), Stable Heart Conditions (2+ yrs), Mild-Moderate COPD, and Controlled Type 2 Diabetes with no medical exam and 24–48 hr decisions.',
        specs: 'Final Expense: $2k–$40k (Ages 0–85, immediate day-one level benefit) • Simplified Term: up to $150k',
        agentCrib: 'Commission: 80%–110% First Year + 2%–5% Renewals • Quick Pay available.'
      });
    }

    if (usesAltNicotine) {
      recs.push({
        carrier: 'Foresters Financial',
        rating: 'A Excellent (27 Consecutive Yrs)',
        product: 'Strong Foundation Non-Med Term / PlanRight WL',
        badge: 'Non-Tobacco Rates for Vape/Cigar/Marijuana',
        highlight: true,
        fitReason:
          'Expanded non-tobacco definition gives NON-SMOKER rates to Cigar, Pipe, Vape, Nicotine Patch, Chewing Tobacco, and Marijuana users—plus free Fraternal Scholarships & LawAssure legal tools.',
        specs: 'Non-Med Term up to $500k (ages 18–55) or $250k (56+) • Charity 1% Benefit Rider included',
        agentCrib: 'Commission: 85%–110% First Year • Also offers Quit Smoking 2-yr non-smoker incentive.'
      });
    }

    if (hasDiabetesOrBP || (age <= 45 && !goals.includes('Tax-Free Retirement (LIRP / IUL)'))) {
      recs.push({
        carrier: 'LGA (Legal & General / Banner Life)',
        rating: 'A+ (AM Best) / AA- (S&P & Fitch)',
        product: 'Standard Term (10–40 Yrs) / GUL',
        badge: '#1 Hypertension, Diabetes & 40-Yr Term',
        highlight: hasDiabetesOrBP,
        fitReason:
          'Industry-leading underwriting for Controlled Hypertension, Type 1 Diabetes (<50 units insulin/day), Type 2 Diabetes (age 50+), and longest 35–40 year level terms.',
        specs: 'Coverage $100k+ • Accelerated no-exam UW for ages 50 & under',
        agentCrib: 'Commission: 70%–100% Term / 80%–100% UL.'
      });
    }

    if (
      goals.includes('Tax-Free Retirement (LIRP / IUL)') ||
      nic === 'Occasional Cigars <=2/mo' ||
      conds.includes('Sleep Apnea w/ CPAP') ||
      c.isPilot
    ) {
      recs.push({
        carrier: 'Mutual of Omaha',
        rating: 'A+ Superior (AM Best)',
        product: 'Income Advantage IUL / AccumUL Answers / Term',
        badge: 'Premier IUL + Fit Credit Underwriting',
        highlight: goals.includes('Tax-Free Retirement (LIRP / IUL)'),
        fitReason:
          'Top-tier LIRP/IUL cash value strategies with LTC/Chronic Illness riders. Eligible for Non-Tobacco rates on <=2 cigars/mo & marijuana, Preferred with CPAP sleep apnea, Pilots, and up to 2 Table Fit Credits.',
        specs: 'Accelerated UW: $100k–$2M (ages 18–60, 48–72 hrs) • Term up to $10M+',
        agentCrib:
          'Commission: 85%–110% IUL • 50%–100% Term • Income Multiples: <30 (40x), 30–39 (35x), 40–49 (30x), 50–59 (20x).'
      });
    }

    if (c.ownerState !== 'NY') {
      recs.push({
        carrier: 'SBLI & Ethos Digital',
        rating: 'SBLI: A+ Mutual • Ethos: BBB A+',
        product: 'SBLI Accelerated Term/WL • Ethos 4-Tier Ladder',
        badge: 'Fastest Digital No-Exam & Free Estate Tools',
        highlight: false,
        fitReason:
          'SBLI offers no-exam Accelerated UW up to $1M (ages 18–55) with free LegacyShield estate vault; Ethos provides instant decisions with automatic 4-tier laddering so clients are never declined.',
        specs: 'Available in 49 states + DC (Not in NY) • Free Will & Estate Planning included',
        agentCrib: 'Commission: SBLI 70%–100% Term / 75%–100% WL • Quick issue = fast commission.'
      });
    }
  }

  return recs;
}

// =========================================================================
// STRATEGY CALCULATORS (FIA INCOME & IUL LIRP PROJECTIONS)
// =========================================================================
export interface FIAPoint {
  year: number;
  age: number;
  benefitBase: number;
  accountValue: number;
  annualIncome: number;
  wellbeingIncome: number;
}

export function calculateFIAProjection(params: {
  initialPremium: number;
  currentAge: number;
  deferralYears: number;
  bonusPct: number;
  rollupRatePct: number;
  indexedCreditPct: number;
  jointPayout: boolean;
}): {
  points: FIAPoint[];
  incomeStartAge: number;
  payoutRatePct: number;
  guaranteedAnnualIncome: number;
  wellbeingAnnualIncome: number;
  projectedBenefitBase: number;
} {
  const {
    initialPremium,
    currentAge,
    deferralYears,
    bonusPct,
    rollupRatePct,
    indexedCreditPct,
    jointPayout
  } = params;

  const incomeStartAge = currentAge + deferralYears;
  // Illustrative payout factor table modeled on FIA lifetime income riders
  let basePayout = 0.045;
  if (incomeStartAge >= 80) basePayout = 0.072;
  else if (incomeStartAge >= 75) basePayout = 0.067;
  else if (incomeStartAge >= 70) basePayout = 0.062;
  else if (incomeStartAge >= 65) basePayout = 0.056;
  else if (incomeStartAge >= 60) basePayout = 0.050;

  const payoutRate = Math.max(0.038, jointPayout ? basePayout - 0.005 : basePayout);
  const startBase = initialPremium * (1 + bonusPct / 100);
  const totalYears = Math.max(15, deferralYears + 10);

  const points: FIAPoint[] = [];
  let benefitBase = startBase;
  let accountValue = initialPremium * (1 + (bonusPct * 0.5) / 100);
  let lockedAnnualIncome = 0;

  for (let yr = 0; yr <= totalYears; yr++) {
    const age = currentAge + yr;
    if (yr > 0) {
      if (yr <= deferralYears) {
        // Simple roll-up on initial benefit base
        benefitBase = startBase * (1 + (rollupRatePct / 100) * yr);
        accountValue = accountValue * (1 + indexedCreditPct / 100);
      } else {
        if (lockedAnnualIncome === 0) {
          lockedAnnualIncome = Math.round(benefitBase * payoutRate);
        }
        accountValue = Math.max(0, accountValue * (1 + indexedCreditPct / 100) - lockedAnnualIncome);
      }
    }
    if (yr === deferralYears && deferralYears === 0) {
      lockedAnnualIncome = Math.round(benefitBase * payoutRate);
    }

    const activeIncome = yr >= deferralYears ? (lockedAnnualIncome || Math.round(benefitBase * payoutRate)) : 0;

    points.push({
      year: yr,
      age,
      benefitBase: Math.round(benefitBase),
      accountValue: Math.round(accountValue),
      annualIncome: activeIncome,
      wellbeingIncome: activeIncome * 2
    });
  }

  const finalBenefitBase = Math.round(startBase * (1 + (rollupRatePct / 100) * deferralYears));
  const guaranteedAnnualIncome = Math.round(finalBenefitBase * payoutRate);

  return {
    points,
    incomeStartAge,
    payoutRatePct: Number((payoutRate * 100).toFixed(2)),
    guaranteedAnnualIncome,
    wellbeingAnnualIncome: guaranteedAnnualIncome * 2,
    projectedBenefitBase: finalBenefitBase
  };
}

export interface IULPoint {
  year: number;
  age: number;
  totalPremiumsPaid: number;
  cashSurrenderValue: number;
  deathBenefit: number;
  taxFreeIncome: number;
}

export function calculateIULProjection(params: {
  annualPremium: number;
  currentAge: number;
  retirementAge: number;
  illustratedRatePct: number;
  taxBracketPct: number;
  initialDeathBenefit: number;
}): {
  points: IULPoint[];
  totalContributed: number;
  cashValueAtRetirement: number;
  estTaxFreeAnnualIncome: number;
  taxableEquivalentIncome: number;
} {
  const {
    annualPremium,
    currentAge,
    retirementAge,
    illustratedRatePct,
    taxBracketPct,
    initialDeathBenefit
  } = params;

  const fundingYears = Math.max(5, retirementAge - currentAge);
  const totalYears = fundingYears + 15;
  const netRate = Math.max(0.02, (illustratedRatePct - 1.15) / 100); // Illustrative net of COI/admin drag

  let cashValue = 0;
  let totalPaid = 0;
  let retirementCV = 0;
  let annualLoan = 0;
  const points: IULPoint[] = [];

  for (let yr = 1; yr <= totalYears; yr++) {
    const age = currentAge + yr;
    if (yr <= fundingYears) {
      totalPaid += annualPremium;
      // Early year policy load taper
      const loadFactor = yr === 1 ? 0.72 : yr === 2 ? 0.86 : 0.94;
      cashValue = (cashValue + annualPremium * loadFactor) * (1 + netRate);
      if (yr === fundingYears) {
        retirementCV = Math.round(cashValue);
        // Illustrative 20-yr tax-free policy loan distribution (~6.2% of accumulated CV)
        annualLoan = Math.round(retirementCV * 0.062);
      }
    } else {
      cashValue = Math.max(0, cashValue * (1 + netRate * 0.85) - annualLoan);
    }

    const db = Math.max(initialDeathBenefit, Math.round(cashValue * 1.18));

    points.push({
      year: yr,
      age,
      totalPremiumsPaid: Math.round(totalPaid),
      cashSurrenderValue: Math.round(cashValue),
      deathBenefit: db,
      taxFreeIncome: yr > fundingYears ? annualLoan : 0
    });
  }

  const taxableEquivalentIncome = Math.round(annualLoan / (1 - taxBracketPct / 100));

  return {
    points,
    totalContributed: Math.round(totalPaid),
    cashValueAtRetirement: retirementCV,
    estTaxFreeAnnualIncome: annualLoan,
    taxableEquivalentIncome
  };
}
