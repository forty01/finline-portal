import React, { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { apiAdvisorLogin, getBackendMode } from '../utils/api';

interface AdvisorLoginModalProps {
  open: boolean;
  onClose: () => void;
  onUnlock: (advisor: { email: string; name: string }) => void;
}

export const AdvisorLoginModal: React.FC<AdvisorLoginModalProps> = ({
  open,
  onClose,
  onUnlock
}) => {
  const mode = getBackendMode();
  const [email, setEmail] = useState(mode === 'firebase' ? '' : 'advisor@finline.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiAdvisorLogin(email, password);
      setPassword('');
      onUnlock(res.advisor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop no-print" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#0f172a',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lock size={17} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Advisor Back-Office Login
              </h3>
              <p style={{ margin: 0, fontSize: 11.5, color: '#64748b' }}>
                The FIN-Line Agency | GFI Advisory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost"
            style={{ padding: 6 }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
          Sign in to access submitted client applications, 1-click carrier data-entry sheets, IGO compliance checks, and carrier calculators.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="field-label">Advisor Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="advisor@finline.com"
              required
            />
          </div>

          <div>
            <label className="field-label">
              <span>Password</span>
              <span style={{ fontSize: 11, color: mode === 'firebase' ? '#059669' : '#64748b', fontWeight: 600 }}>
                {mode === 'firebase' ? 'Firebase Auth Active' : 'Local Preview: FINLine2026!'}
              </span>
            </label>
            <input
              type="password"
              className={`input ${error ? 'error' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter password"
              autoFocus
              required
            />
            {error && (
              <div style={{ fontSize: 11.5, color: '#e11d48', marginTop: 5, fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 4 }}
          >
            <ShieldCheck size={16} color="#fbbf24" />
            <span>{loading ? 'Signing in...' : 'Sign In to Advisor Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
