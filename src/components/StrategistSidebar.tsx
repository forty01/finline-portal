import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
  Sparkles,
  XCircle
} from 'lucide-react';
import type { AgentCompliance, ClientCase } from '../types/portal';
import { evaluateIGO, getRecommendations } from '../utils/calculations';

interface StrategistSidebarProps {
  clientCase: ClientCase;
  onUpdateCompliance: (patch: Partial<AgentCompliance>) => void;
  onUpdateNotes: (notes: string) => void;
}

export const StrategistSidebar: React.FC<StrategistSidebarProps> = ({
  clientCase,
  onUpdateCompliance,
  onUpdateNotes
}) => {
  const igo = evaluateIGO(clientCase);
  const recs = getRecommendations(clientCase);
  const comp = clientCase.agentCompliance;

  const allComplianceChecked =
    comp.activeStateLicense &&
    comp.naicBestInterest4Hr &&
    comp.amlCurrent &&
    comp.americanEquityPST;

  return (
    <aside className="sidebar-sticky no-print">
      {/* 1. Pre-Signing Agent Compliance Gate */}
      <div className="card" style={{ background: '#0f172a', color: '#fff', borderColor: '#1e293b' }}>
        <div
          style={{
            padding: '13px 18px',
            background: '#020617',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16} color="#fbbf24" />
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Pre-Signing Agent Compliance
            </h3>
          </div>
          <span
            className="badge"
            style={{
              background: allComplianceChecked ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
              color: allComplianceChecked ? '#6ee7b7' : '#fcd34d',
              border: `1px solid ${allComplianceChecked ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`
            }}
          >
            {allComplianceChecked ? 'Cleared to Sign' : 'Verify Prior to Sign'}
          </span>
        </div>

        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}>
            <input
              type="checkbox"
              checked={comp.activeStateLicense}
              onChange={(e) => onUpdateCompliance({ activeStateLicense: e.target.checked })}
              style={{ marginTop: 2 }}
            />
            <span style={{ color: '#e2e8f0' }}>
              Active Resident/Non-Resident State License ({clientCase.ownerState}) &amp; Carrier Appointment
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}>
            <input
              type="checkbox"
              checked={comp.naicBestInterest4Hr}
              onChange={(e) => onUpdateCompliance({ naicBestInterest4Hr: e.target.checked })}
              style={{ marginTop: 2 }}
            />
            <span style={{ color: '#e2e8f0' }}>
              4-Hour NAIC Annuity Suitability &amp; Best Interest Training Completed
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}>
            <input
              type="checkbox"
              checked={comp.amlCurrent}
              onChange={(e) => onUpdateCompliance({ amlCurrent: e.target.checked })}
              style={{ marginTop: 2 }}
            />
            <span style={{ color: '#e2e8f0' }}>
              Current Anti-Money Laundering (AML) Certification Active
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              cursor: 'pointer',
              padding: 10,
              borderRadius: 10,
              background: comp.americanEquityPST ? 'rgba(6, 78, 59, 0.55)' : 'rgba(136, 19, 55, 0.5)',
              border: `1px solid ${comp.americanEquityPST ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)'}`
            }}
          >
            <input
              type="checkbox"
              checked={comp.americanEquityPST}
              onChange={(e) => onUpdateCompliance({ americanEquityPST: e.target.checked })}
              style={{ marginTop: 2 }}
            />
            <div>
              <div style={{ fontWeight: 700, color: '#fcd34d' }}>
                Mandatory American Equity PST Completed BEFORE Signature Date
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                If completed on or after the client signature date, American Equity automatically rejects the app and requires re-signing.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 2. Live FireLight IGO Validation */}
      <div className="card">
        <div
          style={{
            padding: '13px 18px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={16} color="#0f172a" />
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#0f172a' }}>
              Live FireLight IGO Validation
            </h3>
          </div>
          <span className={`badge ${igo.scorePct === 100 ? 'badge-emerald' : 'badge-gold'}`}>
            {igo.passCount}/{igo.checks.length} Passed
          </span>
        </div>

        <div style={{ padding: '10px 16px' }}>
          {igo.checks.map((c, idx) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 9,
                padding: '9px 0',
                borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9'
              }}
            >
              {c.status === 'pass' && <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />}
              {c.status === 'fail' && <XCircle size={16} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />}
              {c.status === 'warn' && <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{c.title}</div>
                <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.4 }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Smart GFI 10-Carrier Recommendation Engine */}
      <div className="card">
        <div
          style={{
            padding: '13px 18px',
            background: 'linear-gradient(90deg, #fffbeb, #ffffff)',
            borderBottom: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#d97706" />
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#0f172a' }}>
              GFI 10-Carrier Strategy Engine
            </h3>
          </div>
          <span className="badge badge-gold">Advisor Only</span>
        </div>

        <div
          style={{
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
            maxHeight: 460,
            overflowY: 'auto'
          }}
        >
          {recs.map((r, i) => (
            <div
              key={`${r.carrier}-${i}`}
              style={{
                padding: 13,
                borderRadius: 12,
                border: r.highlight ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                background: r.highlight ? '#fffbeb' : '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  {r.carrier}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#475569', background: '#fff', padding: '2px 7px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  {r.rating}
                </span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>{r.product}</div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#334155', lineHeight: 1.45 }}>{r.fitReason}</p>
              <div style={{ fontSize: 11, color: '#64748b', paddingTop: 5, borderTop: '1px solid #e2e8f0' }}>
                <strong>Specs:</strong> {r.specs}
              </div>
              <div style={{ fontSize: 11, color: '#0f172a', background: 'rgba(254, 243, 199, 0.85)', padding: '6px 9px', borderRadius: 8, fontWeight: 500 }}>
                <strong>Strategist Crib:</strong> {r.agentCrib}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Internal Strategist Notes */}
      <div className="card card-padded" style={{ padding: 16 }}>
        <label className="kicker-label" style={{ marginBottom: 6 }}>
          Internal Strategist Case Notes
        </label>
        <textarea
          rows={3}
          className="textarea"
          style={{ fontSize: 12.5 }}
          value={clientCase.advisorNotes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Add suitability justification notes for Form 4106 / FireLight..."
        />
      </div>
    </aside>
  );
};
