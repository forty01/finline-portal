import React from 'react';
import { CheckCircle2, FileDown, FilePlus2, Lock, Mail, Phone } from 'lucide-react';
import type { ClientCase } from '../types/portal';
import { fmtCurrency } from '../utils/calculations';

interface ClientSubmittedViewProps {
  submittedCase: ClientCase;
  onDownloadCopy: () => void;
  onStartNew: () => void;
}

export const ClientSubmittedView: React.FC<ClientSubmittedViewProps> = ({
  submittedCase,
  onDownloadCopy,
  onStartNew
}) => {
  const refCode = submittedCase.id.slice(-6).toUpperCase();

  return (
    <div style={{ maxWidth: 680, margin: '28px auto' }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            padding: '34px 28px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #34d399',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}
          >
            <CheckCircle2 size={30} color="#34d399" />
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Got It — Thank You!
          </h2>
          <p style={{ margin: '8px auto 0', maxWidth: 480, fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.55 }}>
            Thank you, <strong>{submittedCase.ownerName || 'friend'}</strong>. I&apos;ve received your application details and will personally review everything to get your policy moving forward.
          </p>
          <div
            style={{
              marginTop: 16,
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: 999,
              background: 'rgba(245, 158, 11, 0.18)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              color: '#fbbf24',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em'
            }}
          >
            REFERENCE #FL-{refCode}
          </div>
        </div>

        <div className="card-padded" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="callout callout-slate" style={{ flexDirection: 'column', gap: 8 }}>
            <strong style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>
              What Happens Next
            </strong>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#334155', lineHeight: 1.7 }}>
              <li>I&apos;ll personally review your information and match the strongest carrier option for your goals.</li>
              <li>I&apos;ll handle entering your details into the official carrier application for you so you don&apos;t have to wrestle with paperwork.</li>
              <li>I&apos;ll reach out by phone or email to walk through everything together and complete your final e-signature.</li>
            </ol>
          </div>

          <div className="grid-2" style={{ fontSize: 12.5 }}>
            <div style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                Planning Focus
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                {submittedCase.track === 'annuity'
                  ? 'Retirement Savings & Income'
                  : 'Life Insurance & Family Protection'}
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                Estimated Deposit / Premium
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 3 }}>
                {submittedCase.estimatedPremium ? fmtCurrency(submittedCase.estimatedPremium) : 'We will finalize together'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingTop: 6 }}>
            <button type="button" onClick={onDownloadCopy} className="btn btn-gold btn-lg">
              <FileDown size={16} />
              <span>Download My Copy (PDF)</span>
            </button>
            <button type="button" onClick={onStartNew} className="btn btn-secondary btn-lg">
              <FilePlus2 size={16} />
              <span>Start Another Application</span>
            </button>
          </div>

          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 14,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              color: '#64748b'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Lock size={13} color="#059669" /> Private &amp; Confidential
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Phone size={12} /> Call or text me anytime
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Mail size={12} /> Questions? Just reply to my email
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
