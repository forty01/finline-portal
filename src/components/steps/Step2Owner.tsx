import React from 'react';
import {
  AlertCircle,
  AlertOctagon,
  CreditCard,
  FileWarning,
  User,
  Users
} from 'lucide-react';
import { US_STATES } from '../../data/knowledgeBase';
import type { ClientCase, OwnershipType } from '../../types/portal';
import {
  calculateAge,
  isIdExpired,
  isQualifiedPlan,
  parseNum
} from '../../utils/calculations';
import { StepHeader } from './StepHeader';

interface Step2OwnerProps {
  clientCase: ClientCase;
  privacyMask: boolean;
  onTogglePrivacyMask: () => void;
  onUpdate: (patch: Partial<ClientCase>) => void;
}

export const Step2Owner: React.FC<Step2OwnerProps> = ({
  clientCase,
  privacyMask,
  onTogglePrivacyMask,
  onUpdate
}) => {
  const ownerAge = calculateAge(clientCase.ownerDOB);
  const annuitantAge = calculateAge(clientCase.annuitantDOB);
  const idExpired = isIdExpired(clientCase.idExpDate);
  const maskType = privacyMask ? 'password' : 'text';
  const qualifiedJointConflict =
    isQualifiedPlan(clientCase.taxQualification) && clientCase.ownershipType === 'Joint';

  const ownershipOptions: { val: OwnershipType; title: string; sub: string }[] = [
    { val: 'Individual', title: 'Individual Owner', sub: 'Standard single owner (IRA or Non-Qual)' },
    { val: 'Joint', title: 'Joint Owners', sub: 'Non-Qualified contracts only (Spousal/Joint)' },
    { val: 'Trust', title: 'Trust-Owned', sub: 'Living/Revocable Trust for Annuitant' }
  ];

  return (
    <>
      <StepHeader
        num={2}
        title="Owner, Annuitant & USA PATRIOT Act Identification"
        subtitle="Legal contract registration details and mandatory anti-money laundering (AML) photo ID verification."
      />
      <div className="step-body">
        {/* Ownership Structure */}
        <div>
          <span className="kicker-label">Ownership Registration Type</span>
          <div className="grid-3">
            {ownershipOptions.map((o) => (
              <button
                key={o.val}
                type="button"
                onClick={() => onUpdate({ ownershipType: o.val })}
                className={`choice-tile ${clientCase.ownershipType === o.val ? 'selected' : ''}`}
                style={{ padding: 14, flexDirection: 'column', gap: 4 }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{o.title}</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>{o.sub}</div>
              </button>
            ))}
          </div>

          {qualifiedJointConflict && (
            <div className="callout callout-rose" style={{ marginTop: 12 }}>
              <AlertOctagon size={17} color="#e11d48" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Registration Conflict:</strong> You currently have{' '}
                <em>{clientCase.taxQualification}</em> selected in Step 5. IRS &amp; American Equity
                rules allow <strong>Individual Ownership only</strong> on Qualified IRA/Rollover
                contracts. Joint ownership is strictly for Non-Qualified funds.
              </div>
            </div>
          )}

          {clientCase.ownershipType === 'Trust' && (
            <div
              className="callout callout-amber"
              style={{ marginTop: 14, flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <FileWarning size={17} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>American Equity Trust Documentation Requirement:</strong> Please have the{' '}
                  <strong>Trust Cover Page, Trustee Designation Pages, and Signature Page</strong>{' '}
                  ready. Under carrier guidelines, the trust must be established for the benefit of
                  the named Annuitant.
                </div>
              </div>
              <div className="grid-2" style={{ width: '100%' }}>
                <div>
                  <label className="field-label">Full Legal Name of Trust *</label>
                  <input
                    className="input"
                    value={clientCase.trustName}
                    onChange={(e) => onUpdate({ trustName: e.target.value })}
                    placeholder="e.g., The Henderson Family Living Trust"
                  />
                </div>
                <div>
                  <label className="field-label">Date Trust Established *</label>
                  <input
                    type="date"
                    className="input"
                    value={clientCase.trustDate}
                    onChange={(e) => onUpdate({ trustDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Trustee Full Name(s) *</label>
                  <input
                    className="input"
                    value={clientCase.trusteeName}
                    onChange={(e) => onUpdate({ trusteeName: e.target.value })}
                    placeholder="Trustee Name"
                  />
                </div>
                <div>
                  <label className="field-label">Trust Tax ID (TIN / Grantor SSN) *</label>
                  <input
                    type={maskType}
                    className="input mono"
                    value={clientCase.trustTaxId}
                    onChange={(e) => onUpdate({ trustTaxId: e.target.value })}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Owner Details */}
        <div className="section-divider">
          <h3 className="section-heading">
            <User size={16} color="#d97706" />
            <span>Primary Contract Owner Information</span>
          </h3>
          <div className="grid-3">
            <div>
              <label className="field-label">Full Legal Name (First, MI, Last) *</label>
              <input
                className="input"
                value={clientCase.ownerName}
                onChange={(e) => onUpdate({ ownerName: e.target.value })}
                placeholder="As shown on Photo ID"
              />
            </div>

            <div>
              <label className="field-label">
                <span>Date of Birth *</span>
                {ownerAge !== null && <span className="badge badge-gold">Age: {ownerAge}</span>}
              </label>
              <input
                type="date"
                className="input"
                value={clientCase.ownerDOB}
                onChange={(e) => onUpdate({ ownerDOB: e.target.value })}
              />
            </div>

            <div>
              <label className="field-label">
                <span>Social Security Number / TIN *</span>
                <button
                  type="button"
                  onClick={onTogglePrivacyMask}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#b45309',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {privacyMask ? 'Show' : 'Hide'}
                </button>
              </label>
              <input
                type={maskType}
                className="input mono"
                value={clientCase.ownerSSN}
                onChange={(e) => onUpdate({ ownerSSN: e.target.value })}
                placeholder="XXX-XX-XXXX"
              />
            </div>

            <div>
              <label className="field-label">Gender *</label>
              <select
                className="select"
                value={clientCase.ownerGender}
                onChange={(e) => onUpdate({ ownerGender: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="field-label">Marital Status</label>
              <select
                className="select"
                value={clientCase.ownerMarital}
                onChange={(e) => onUpdate({ ownerMarital: e.target.value })}
              >
                {['Married', 'Single', 'Widowed', 'Divorced', 'Domestic Partner'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Mobile Phone *</label>
              <input
                type="tel"
                className="input"
                value={clientCase.ownerPhone}
                onChange={(e) => onUpdate({ ownerPhone: e.target.value })}
                placeholder="(214) 555-0100"
              />
            </div>

            <div className="span-2">
              <label className="field-label">
                Email Address (Required for FireLight E-Signature) *
              </label>
              <input
                type="email"
                className="input"
                value={clientCase.ownerEmail}
                onChange={(e) => onUpdate({ ownerEmail: e.target.value })}
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="field-label">Years at Current Address</label>
              <input
                type="number"
                min={0}
                max={99}
                className="input"
                value={clientCase.yearsAtAddress}
                onChange={(e) => onUpdate({ yearsAtAddress: e.target.value })}
              />
            </div>

            <div className="span-2">
              <label className="field-label">Residential Street Address (No P.O. Boxes) *</label>
              <input
                className="input"
                value={clientCase.ownerStreet}
                onChange={(e) => onUpdate({ ownerStreet: e.target.value })}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid-2" style={{ gap: 10 }}>
              <div>
                <label className="field-label">State *</label>
                <select
                  className="select"
                  value={clientCase.ownerState}
                  onChange={(e) => onUpdate({ ownerState: e.target.value })}
                >
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">ZIP *</label>
                <input
                  className="input"
                  value={clientCase.ownerZip}
                  onChange={(e) => onUpdate({ ownerZip: e.target.value })}
                  placeholder="75009"
                />
              </div>
            </div>

            <div>
              <label className="field-label">City *</label>
              <input
                className="input"
                value={clientCase.ownerCity}
                onChange={(e) => onUpdate({ ownerCity: e.target.value })}
                placeholder="Celina"
              />
            </div>

            {parseNum(clientCase.yearsAtAddress) < 5 && clientCase.yearsAtAddress !== '' && (
              <div className="span-2">
                <label className="field-label" style={{ color: '#b45309' }}>
                  Previous Residential Address (Required if &lt; 5 yrs at current address)
                </label>
                <input
                  className="input"
                  style={{ borderColor: '#f59e0b', background: '#fffbeb' }}
                  value={clientCase.prevAddress}
                  onChange={(e) => onUpdate({ prevAddress: e.target.value })}
                  placeholder="Full Previous Street, City, State, ZIP"
                />
              </div>
            )}
          </div>
        </div>

        {/* Conditional Joint Owner */}
        {clientCase.ownershipType === 'Joint' && (
          <div className="section-divider">
            <h3 className="section-heading">
              <Users size={16} color="#d97706" />
              <span>Joint Owner Information (Non-Qualified Contracts Only)</span>
            </h3>
            <div className="callout callout-slate">
              <div className="grid-4" style={{ width: '100%' }}>
                <div>
                  <label className="field-label">Joint Owner Legal Name *</label>
                  <input
                    className="input"
                    value={clientCase.jointOwnerName}
                    onChange={(e) => onUpdate({ jointOwnerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Relationship to Owner</label>
                  <input
                    className="input"
                    value={clientCase.jointOwnerRelationship}
                    onChange={(e) => onUpdate({ jointOwnerRelationship: e.target.value })}
                    placeholder="Spouse"
                  />
                </div>
                <div>
                  <label className="field-label">Date of Birth *</label>
                  <input
                    type="date"
                    className="input"
                    value={clientCase.jointOwnerDOB}
                    onChange={(e) => onUpdate({ jointOwnerDOB: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">SSN *</label>
                  <input
                    type={maskType}
                    className="input mono"
                    value={clientCase.jointOwnerSSN}
                    onChange={(e) => onUpdate({ jointOwnerSSN: e.target.value })}
                    placeholder="XXX-XX-XXXX"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Annuitant Toggle */}
        <div className="section-divider">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={clientCase.annuitantSameAsOwner}
                onChange={(e) => onUpdate({ annuitantSameAsOwner: e.target.checked })}
              />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Annuitant / Proposed Insured is the Same as Primary Owner
              </span>
            </label>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              (Required to be same person on Traditional/Roth IRAs)
            </span>
          </div>

          {!clientCase.annuitantSameAsOwner && (
            <div className="callout callout-slate" style={{ marginTop: 14 }}>
              <div className="grid-4" style={{ width: '100%' }}>
                <div>
                  <label className="field-label">Annuitant Full Legal Name *</label>
                  <input
                    className="input"
                    value={clientCase.annuitantName}
                    onChange={(e) => onUpdate({ annuitantName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">
                    Date of Birth {annuitantAge !== null ? `(Age ${annuitantAge})` : ''}
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={clientCase.annuitantDOB}
                    onChange={(e) => onUpdate({ annuitantDOB: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">SSN *</label>
                  <input
                    type={maskType}
                    className="input mono"
                    value={clientCase.annuitantSSN}
                    onChange={(e) => onUpdate({ annuitantSSN: e.target.value })}
                    placeholder="XXX-XX-XXXX"
                  />
                </div>
                <div>
                  <label className="field-label">Relationship to Owner</label>
                  <input
                    className="input"
                    value={clientCase.annuitantRelationship}
                    onChange={(e) => onUpdate({ annuitantRelationship: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patriot Act Photo ID */}
        <div className="section-divider">
          <h3 className="section-heading" style={{ marginBottom: 4 }}>
            <CreditCard size={16} color="#d97706" />
            <span>Government-Issued Photo ID (USA PATRIOT Act / AML Verification)</span>
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
            Unexpired government photo identification is required prior to contract issuance.
          </p>

          <div className="grid-5">
            <div>
              <label className="field-label">ID Document Type *</label>
              <select
                className="select"
                value={clientCase.idType}
                onChange={(e) => onUpdate({ idType: e.target.value })}
              >
                {["Driver's License", 'U.S. Passport', 'State Photo ID'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="span-2">
              <label className="field-label">ID / License Number *</label>
              <input
                type={maskType}
                className="input mono"
                value={clientCase.idNumber}
                onChange={(e) => onUpdate({ idNumber: e.target.value })}
                placeholder="Document Number"
              />
            </div>
            <div>
              <label className="field-label">Issuing State</label>
              <select
                className="select"
                value={clientCase.idState}
                onChange={(e) => onUpdate({ idState: e.target.value })}
              >
                <option value="US">U.S. Federal</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" style={{ color: idExpired ? '#e11d48' : undefined }}>
                Expiration Date *
              </label>
              <input
                type="date"
                className={`input ${idExpired ? 'error' : ''}`}
                value={clientCase.idExpDate}
                onChange={(e) => onUpdate({ idExpDate: e.target.value })}
              />
            </div>
          </div>

          {idExpired && (
            <div className="callout callout-rose" style={{ marginTop: 12 }}>
              <AlertCircle size={16} color="#e11d48" style={{ flexShrink: 0 }} />
              <span>
                <strong>Expired Identification:</strong> The entered Photo ID expired on{' '}
                {clientCase.idExpDate}. Please provide an unexpired Driver&apos;s License, State ID,
                or U.S. Passport.
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
