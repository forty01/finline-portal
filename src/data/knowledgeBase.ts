import type { ClientCase } from '../types/portal';

export const STORAGE_KEY = 'finline_gfi_cases_v2';

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI',
  'SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
];

export interface GoalOption {
  id: string;
  label: string;
  desc: string;
  icon: string;
  track: 'both' | 'annuity' | 'life';
}

export const GOAL_OPTIONS: GoalOption[] = [
  { id: 'Lifetime Guaranteed Income', label: 'Lifetime Guaranteed Income', desc: 'Predictable retirement paycheck you cannot outlive', icon: 'wallet', track: 'both' },
  { id: 'Principal Protection (0% Floor)', label: 'Principal Protection (0% Floor)', desc: 'Shield retirement savings from market downturns', icon: 'shield', track: 'annuity' },
  { id: 'Accumulation / Premium Bonus', label: 'Accumulation / Premium Bonus', desc: 'Index-linked growth & first-year premium boost', icon: 'trending-up', track: 'annuity' },
  { id: 'Legacy / Estate Transfer', label: 'Legacy / Estate Transfer', desc: 'Pass enhanced wealth efficiently to loved ones', icon: 'landmark', track: 'both' },
  { id: 'Healthcare / Wellbeing Cost Offset', label: 'Healthcare / Wellbeing Offset', desc: 'Enhanced payouts or living benefits for care needs', icon: 'heart-handshake', track: 'both' },
  { id: 'Tax-Free Retirement (LIRP / IUL)', label: 'Tax-Free Retirement (LIRP / IUL)', desc: 'Tax-advantaged cash value growth & policy loans', icon: 'sparkles', track: 'life' },
  { id: 'Final Expense / Mortgage Protection', label: 'Final Expense / Family Protection', desc: 'Immediate peace of mind for burial or mortgage debt', icon: 'home', track: 'life' }
];

export const ANNUITY_SERIES = [
  'Recommend Best Fit (Advisor)',
  'American Equity IncomeShield 10',
  'American Equity IncomeShield 7',
  'American Equity AssetShield 10 / Bonus',
  'American Equity AssetShield 5 / 7',
  'American Equity EstateShield 10',
  'American Equity FlexShield 10',
  'American Equity Guarantee Shield (3 or 5 Yr MYGA)',
  'Other GFI Carrier (F&G / North American / Corebridge)'
];

export const LIFE_SERIES = [
  'Recommend Best Fit (Advisor)',
  'Mutual of Omaha Income Advantage / AccumUL IUL',
  'Corebridge / AIG Max Accumulator+ IUL or Term',
  'LGA / Banner Standard Term (10–40 Yr)',
  'Foresters Strong Foundation Non-Med Term / PlanRight FE',
  'Ethos Instant-Decision Term / TruStage WL',
  'SBLI Accelerated UW Term / Cherish Life FE',
  'AAMA (American-Amicable) Simplified Final Expense / Term'
];

export const HEALTH_CONDITIONS = [
  'None',
  'Controlled High Blood Pressure',
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Sleep Apnea w/ CPAP',
  'Cancer Remission 2+ yrs',
  'Stable Heart Condition',
  'Mild COPD',
  'Bipolar/Treated'
];

export interface IndexStrategyMeta {
  key: keyof ClientCase['allocations'];
  label: string;
  shortLabel: string;
  tag: string;
  color: string;
}

export const INDEX_STRATEGIES: IndexStrategyMeta[] = [
  { key: 'sp500Cap', label: 'S&P 500® Annual Point-to-Point (Cap)', shortLabel: 'S&P 500 Cap', tag: 'Core U.S. Benchmark', color: '#0f172a' },
  { key: 'sp500Trigger', label: 'S&P 500® Performance Trigger', shortLabel: 'S&P 500 Trigger', tag: 'Predictable Trigger Crediting', color: '#d97706' },
  { key: 'dividendAristocrats', label: 'S&P 500® Dividend Aristocrats® Daily Risk Control 5%', shortLabel: 'Dividend Aristocrats', tag: 'Volatility Control', color: '#059669' },
  { key: 'blackrockAdaptive', label: 'BlackRock® Adaptive U.S. Equity 5% / 7%', shortLabel: 'BlackRock Adaptive', tag: 'Dynamic Multi-Asset', color: '#2563eb' },
  { key: 'nasdaqPremier', label: 'Nasdaq Premier™ / Volatility Control', shortLabel: 'Nasdaq Premier', tag: 'Growth & Tech Tilt', color: '#7c3aed' },
  { key: 'fixedAccount', label: 'Fixed Account (Guaranteed Rate)', shortLabel: 'Fixed Account', tag: 'Declared Annual Rate', color: '#64748b' }
];

export const STEPS_META = [
  { num: 1, short: 'Track & Goals', title: 'Application Track & Objectives' },
  { num: 2, short: 'Owner & ID', title: 'Owner, Annuitant & Patriot Act ID' },
  { num: 3, short: 'Beneficiaries', title: 'Primary & Contingent Beneficiaries' },
  { num: 4, short: 'Suitability', title: 'Financial Suitability & Profile' },
  { num: 5, short: 'Funding & Index', title: 'Funding, Rollovers & Allocations' },
  { num: 6, short: 'Review & Sign', title: 'IGO Review, Signature & Export' }
];

export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createCaseId(): string {
  return 'case_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

export function createDefaultCase(overrides?: Partial<ClientCase>): ClientCase {
  const nowIso = new Date().toISOString();
  const todayLocal = getLocalDateString();

  return {
    id: createCaseId(),
    status: 'Draft',
    createdAt: nowIso,
    updatedAt: nowIso,
    currentStep: 1,
    agentCompliance: {
      activeStateLicense: false,
      naicBestInterest4Hr: false,
      amlCurrent: false,
      americanEquityPST: false,
      agentName: '',
      agentNPN: ''
    },
    track: '',
    dualReview: false,
    goals: [],
    targetProduct: 'Recommend Best Fit (Advisor)',
    ownershipType: '',
    trustName: '',
    trustDate: '',
    trusteeName: '',
    trustTaxId: '',
    ownerName: '',
    ownerGender: '',
    ownerDOB: '',
    ownerSSN: '',
    ownerMarital: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerStreet: '',
    ownerCity: '',
    ownerState: '',
    ownerZip: '',
    yearsAtAddress: '',
    prevAddress: '',
    annuitantSameAsOwner: true,
    annuitantName: '',
    annuitantDOB: '',
    annuitantGender: '',
    annuitantSSN: '',
    annuitantRelationship: '',
    jointOwnerName: '',
    jointOwnerDOB: '',
    jointOwnerGender: '',
    jointOwnerSSN: '',
    jointOwnerRelationship: '',
    idType: '',
    idNumber: '',
    idState: '',
    idIssueDate: '',
    idExpDate: '',
    beneficiaries: [
      { id: 'b1', type: 'Primary', name: '', relationship: '', dob: '', ssn: '', contact: '', share: 100 }
    ],
    employmentStatus: '',
    occupation: '',
    employer: '',
    annualIncome: '',
    monthlyExpenses: '',
    incomeSources: [],
    taxBracket: '',
    totalNetWorth: '',
    liquidNetWorth: '',
    existingLifeAnnuity: '',
    riskTolerance: '',
    timeHorizon: '',
    incomeStartTiming: '',
    freeWithdrawalPlan: '',
    hasLTC: '',
    desiredFaceAmount: '',
    heightFt: '',
    heightIn: '',
    weightLbs: '',
    nicotineProfile: '',
    isPilot: false,
    healthConditions: [],
    taxQualification: '',
    estimatedPremium: '',
    fundingMethod: '',
    rmdSatisfied: '',
    isReplacement: '',
    currentCarrier: '',
    currentPolicyNumber: '',
    currentCarrierPhone: '',
    currentAccountValue: '',
    currentSurrenderPct: '',
    hasRecentStatement: false,
    allocationMode: 'strategist',
    allocations: {
      sp500Cap: 0,
      sp500Trigger: 0,
      dividendAristocrats: 0,
      blackrockAdaptive: 0,
      nasdaqPremier: 0,
      fixedAccount: 0
    },
    clientAcknowledged: false,
    clientSignature: '',
    signedCityState: '',
    signatureDate: todayLocal,
    advisorNotes: '',
    ...overrides
  };
}

export function createSampleCase(type: 'annuity' | 'life' | 'bonus'): ClientCase {
  const today = getLocalDateString();

  if (type === 'annuity') {
    return createDefaultCase({
      status: 'In Review',
      agentCompliance: {
        activeStateLicense: true,
        naicBestInterest4Hr: true,
        amlCurrent: true,
        americanEquityPST: true,
        agentName: 'FIN-Line Senior Strategist',
        agentNPN: '19847210'
      },
      track: 'annuity',
      dualReview: false,
      goals: ['Lifetime Guaranteed Income', 'Principal Protection (0% Floor)', 'Healthcare / Wellbeing Cost Offset'],
      targetProduct: 'American Equity IncomeShield 10',
      ownershipType: 'Individual',
      ownerName: 'Robert H. Henderson',
      ownerGender: 'Male',
      ownerDOB: '1952-04-14',
      ownerSSN: '452-68-9104',
      ownerMarital: 'Married',
      ownerEmail: 'r.henderson52@example.com',
      ownerPhone: '(214) 555-0189',
      ownerStreet: '1408 Preston Meadow Ln',
      ownerCity: 'Celina',
      ownerState: 'TX',
      ownerZip: '75009',
      yearsAtAddress: '9',
      annuitantSameAsOwner: true,
      idType: "Driver's License",
      idNumber: 'TX-38920194',
      idState: 'TX',
      idIssueDate: '2023-05-10',
      idExpDate: '2029-04-14',
      beneficiaries: [
        { id: 'b1', type: 'Primary', name: 'Margaret E. Henderson', relationship: 'Spouse', dob: '1954-09-22', ssn: '453-71-2290', contact: '(214) 555-0192', share: 100 },
        { id: 'b2', type: 'Contingent', name: 'Claire Henderson-Miles', relationship: 'Daughter', dob: '1983-02-11', ssn: '', contact: 'claire.m@example.com', share: 50 },
        { id: 'b3', type: 'Contingent', name: 'Grant R. Henderson', relationship: 'Son', dob: '1986-07-30', ssn: '', contact: 'grant.h@example.com', share: 50 }
      ],
      employmentStatus: 'Retired',
      occupation: 'Retired Civil Engineer',
      employer: 'Former — LoneStar Infrastructure',
      annualIncome: '118000',
      monthlyExpenses: '5400',
      incomeSources: ['Social Security', 'Pension', 'Investments'],
      taxBracket: '22%',
      totalNetWorth: '890000',
      liquidNetWorth: '165000',
      existingLifeAnnuity: '310000',
      riskTolerance: 'Moderately Conservative',
      timeHorizon: '10+ yrs',
      incomeStartTiming: '1-3 Years',
      freeWithdrawalPlan: 'RMDs / Systematic Lifetime Income Rider',
      hasLTC: 'No',
      taxQualification: 'Traditional IRA',
      estimatedPremium: '250000',
      fundingMethod: 'Direct Transfer/Rollover',
      rmdSatisfied: 'No',
      isReplacement: 'No',
      currentCarrier: 'Fidelity Investments',
      currentPolicyNumber: 'IRA-88492017',
      currentCarrierPhone: '(800) 343-3548',
      currentAccountValue: '262400',
      currentSurrenderPct: '0',
      hasRecentStatement: true,
      allocationMode: 'custom',
      allocations: {
        sp500Cap: 35,
        sp500Trigger: 25,
        dividendAristocrats: 15,
        blackrockAdaptive: 15,
        nasdaqPremier: 0,
        fixedAccount: 10
      },
      clientAcknowledged: true,
      clientSignature: 'Robert H. Henderson',
      signedCityState: 'Celina, TX',
      signatureDate: today,
      advisorNotes: 'Client wants 0% market loss protection + lifetime income rider with Wellbeing Benefit healthcare doubler. Rolling $250k of $262.4k Fidelity Traditional IRA after satisfying current-year RMD.'
    });
  }

  if (type === 'life') {
    return createDefaultCase({
      status: 'IGO Ready',
      agentCompliance: {
        activeStateLicense: true,
        naicBestInterest4Hr: true,
        amlCurrent: true,
        americanEquityPST: true,
        agentName: 'FIN-Line Senior Strategist',
        agentNPN: '19847210'
      },
      track: 'life',
      dualReview: true,
      goals: ['Tax-Free Retirement (LIRP / IUL)', 'Legacy / Estate Transfer', 'Healthcare / Wellbeing Cost Offset'],
      targetProduct: 'Mutual of Omaha Income Advantage / AccumUL IUL',
      ownershipType: 'Individual',
      ownerName: 'Marcus D. Vance',
      ownerGender: 'Male',
      ownerDOB: '1980-08-19',
      ownerSSN: '461-29-8831',
      ownerMarital: 'Married',
      ownerEmail: 'marcus.vance@example.com',
      ownerPhone: '(469) 555-0144',
      ownerStreet: '412 Heritage Ranch Blvd',
      ownerCity: 'Frisco',
      ownerState: 'TX',
      ownerZip: '75034',
      yearsAtAddress: '6',
      annuitantSameAsOwner: true,
      idType: "Driver's License",
      idNumber: 'TX-49201855',
      idState: 'TX',
      idIssueDate: '2024-08-19',
      idExpDate: '2032-08-19',
      beneficiaries: [
        { id: 'b1', type: 'Primary', name: 'Elena S. Vance', relationship: 'Spouse', dob: '1982-11-04', ssn: '462-18-9022', contact: '(469) 555-0145', share: 100 }
      ],
      employmentStatus: 'Self-Employed',
      occupation: 'Commercial HVAC Business Owner',
      employer: 'Vance Mechanical LLC',
      annualIncome: '245000',
      monthlyExpenses: '8200',
      incomeSources: ['Wages', 'Investments'],
      taxBracket: '24%',
      totalNetWorth: '740000',
      liquidNetWorth: '190000',
      existingLifeAnnuity: '500000',
      riskTolerance: 'Moderate',
      timeHorizon: '10+ yrs',
      incomeStartTiming: '8-10+ Years',
      freeWithdrawalPlan: 'No planned withdrawals (Emergency / RMD only)',
      hasLTC: 'No',
      desiredFaceAmount: '1000000',
      heightFt: '6',
      heightIn: '0',
      weightLbs: '198',
      nicotineProfile: 'Occasional Cigars <=2/mo',
      isPilot: false,
      healthConditions: ['Controlled High Blood Pressure', 'Sleep Apnea w/ CPAP'],
      taxQualification: 'Non-Qualified',
      estimatedPremium: '18000',
      fundingMethod: 'ACH/Wire',
      isReplacement: 'No',
      clientAcknowledged: true,
      clientSignature: 'Marcus D. Vance',
      signedCityState: 'Frisco, TX',
      signatureDate: today,
      advisorNotes: 'Overfunded LIRP IUL ($1,500/mo = $18k/yr) + evaluating FIA rollover for old SEP-IRA. Occasional celebratory cigar (1/mo) and CPAP compliant.'
    });
  }

  return createDefaultCase({
    status: 'IGO Ready',
    agentCompliance: {
      activeStateLicense: true,
      naicBestInterest4Hr: true,
      amlCurrent: true,
      americanEquityPST: true,
      agentName: 'FIN-Line Senior Strategist',
      agentNPN: '19847210'
    },
    track: 'annuity',
    dualReview: false,
    goals: ['Accumulation / Premium Bonus', 'Principal Protection (0% Floor)', 'Legacy / Estate Transfer'],
    targetProduct: 'American Equity AssetShield 10 / Bonus',
    ownershipType: 'Individual',
    ownerName: 'Diane K. Alvarez',
    ownerGender: 'Female',
    ownerDOB: '1963-11-08',
    ownerSSN: '458-12-7740',
    ownerMarital: 'Married',
    ownerEmail: 'diane.alvarez@example.com',
    ownerPhone: '(972) 555-0177',
    ownerStreet: '2810 Willow Creek Way',
    ownerCity: 'Prosper',
    ownerState: 'TX',
    ownerZip: '75078',
    yearsAtAddress: '11',
    annuitantSameAsOwner: true,
    idType: "Driver's License",
    idNumber: 'TX-22190844',
    idState: 'TX',
    idIssueDate: '2022-11-08',
    idExpDate: '2030-11-08',
    beneficiaries: [
      { id: 'b1', type: 'Primary', name: 'Carlos M. Alvarez', relationship: 'Spouse', dob: '1961-06-15', ssn: '458-11-3092', contact: '(972) 555-0178', share: 100 }
    ],
    employmentStatus: 'Employed',
    occupation: 'Director of Nursing',
    employer: 'Baylor Scott & White Health',
    annualIncome: '162000',
    monthlyExpenses: '6100',
    incomeSources: ['Wages', 'Investments'],
    taxBracket: '24%',
    totalNetWorth: '1150000',
    liquidNetWorth: '240000',
    existingLifeAnnuity: '180000',
    riskTolerance: 'Moderately Conservative',
    timeHorizon: '10+ yrs',
    incomeStartTiming: '4-7 Years',
    freeWithdrawalPlan: 'No planned withdrawals (Emergency / RMD only)',
    hasLTC: 'Yes',
    taxQualification: '401(k)/403(b)/457 Rollover',
    estimatedPremium: '385000',
    fundingMethod: 'Direct Transfer/Rollover',
    rmdSatisfied: 'Yes',
    isReplacement: 'No',
    currentCarrier: 'Vanguard Institutional',
    currentPolicyNumber: '403B-774109',
    currentCarrierPhone: '(800) 523-1188',
    currentAccountValue: '385000',
    currentSurrenderPct: '0',
    hasRecentStatement: true,
    allocationMode: 'custom',
    allocations: {
      sp500Cap: 40,
      sp500Trigger: 15,
      dividendAristocrats: 15,
      blackrockAdaptive: 20,
      nasdaqPremier: 10,
      fixedAccount: 0
    },
    clientAcknowledged: true,
    clientSignature: 'Diane K. Alvarez',
    signedCityState: 'Prosper, TX',
    signatureDate: today,
    advisorNotes: 'In-service 403(b) rollover at age 62 into AssetShield 10 Bonus for 0% downside floor ahead of retirement.'
  });
}
