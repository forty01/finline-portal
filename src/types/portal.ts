export type AppTrack = 'annuity' | 'life';
export type OwnershipType = 'Individual' | 'Joint' | 'Trust';
export type BeneficiaryType = 'Primary' | 'Contingent';
export type AllocationMode = 'strategist' | 'custom';
export type CaseStatus = 'Draft' | 'In Review' | 'IGO Ready' | 'Submitted';
export type ActiveView = 'cases' | 'wizard' | 'calculators';

export interface Beneficiary {
  id: string;
  type: BeneficiaryType;
  name: string;
  relationship: string;
  dob: string;
  ssn: string;
  contact: string;
  share: number | string;
}

export interface AgentCompliance {
  activeStateLicense: boolean;
  naicBestInterest4Hr: boolean;
  amlCurrent: boolean;
  americanEquityPST: boolean;
  agentName: string;
  agentNPN: string;
}

export interface IndexAllocations {
  sp500Cap: number;
  sp500Trigger: number;
  dividendAristocrats: number;
  blackrockAdaptive: number;
  nasdaqPremier: number;
  fixedAccount: number;
}

export interface ClientCase {
  id: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  agentCompliance: AgentCompliance;

  // Step 1
  track: AppTrack;
  dualReview: boolean;
  goals: string[];
  targetProduct: string;

  // Step 2
  ownershipType: OwnershipType;
  trustName: string;
  trustDate: string;
  trusteeName: string;
  trustTaxId: string;
  ownerName: string;
  ownerGender: string;
  ownerDOB: string;
  ownerSSN: string;
  ownerMarital: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerStreet: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
  yearsAtAddress: string;
  prevAddress: string;
  annuitantSameAsOwner: boolean;
  annuitantName: string;
  annuitantDOB: string;
  annuitantGender: string;
  annuitantSSN: string;
  annuitantRelationship: string;
  jointOwnerName: string;
  jointOwnerDOB: string;
  jointOwnerGender: string;
  jointOwnerSSN: string;
  jointOwnerRelationship: string;
  idType: string;
  idNumber: string;
  idState: string;
  idIssueDate: string;
  idExpDate: string;

  // Step 3
  beneficiaries: Beneficiary[];

  // Step 4
  employmentStatus: string;
  occupation: string;
  employer: string;
  annualIncome: string;
  monthlyExpenses: string;
  incomeSources: string[];
  taxBracket: string;
  totalNetWorth: string;
  liquidNetWorth: string;
  existingLifeAnnuity: string;
  riskTolerance: string;
  timeHorizon: string;
  incomeStartTiming: string;
  freeWithdrawalPlan: string;
  hasLTC: string;

  // Conditional Life / IUL Health Block
  desiredFaceAmount: string;
  heightFt: string;
  heightIn: string;
  weightLbs: string;
  nicotineProfile: string;
  isPilot: boolean;
  healthConditions: string[];

  // Step 5
  taxQualification: string;
  estimatedPremium: string;
  fundingMethod: string;
  rmdSatisfied: string;
  isReplacement: string;
  currentCarrier: string;
  currentPolicyNumber: string;
  currentCarrierPhone: string;
  currentAccountValue: string;
  currentSurrenderPct: string;
  hasRecentStatement: boolean;
  allocationMode: AllocationMode;
  allocations: IndexAllocations;

  // Step 6
  clientAcknowledged: boolean;
  clientSignature: string;
  signedCityState: string;
  signatureDate: string;
  advisorNotes: string;
}

export interface IGOCheck {
  id: string;
  title: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface IGOEvaluation {
  checks: IGOCheck[];
  ownerAge: number | null;
  remainingLiquid: number;
  premiumToLiquidPct: number;
  emergencyMonths: number | null;
  drawsFromLiquid: boolean;
  passCount: number;
  failCount: number;
  scorePct: number;
}

export interface CarrierRecommendation {
  carrier: string;
  rating: string;
  product: string;
  badge: string;
  highlight: boolean;
  fitReason: string;
  specs: string;
  agentCrib: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}
