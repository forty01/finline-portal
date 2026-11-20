import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { apiAdvisorGoogleLogin } from '../utils/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiAdvisorGoogleLogin();
      onUnlock(res.advisor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
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

        <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#475569', lineHeight: 1.55 }}>
          Sign in with your authorized Google account to access submitted client applications, 1-click carrier data-entry sheets, compliance checks, and calculators.
        </p>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 14,
              padding: '10px 12px',
              borderRadius: 10,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#9f1239',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            {error}
          </div>
        )}

        <button
          id="btnGoogleSignIn"
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="btn btn-lg"
          style={{
            width: '100%',
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            fontWeight: 700,
            padding: '11px 16px',
            gap: 10
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          <span>{loading ? 'Opening Google Sign-In...' : 'Continue with Google'}</span>
        </button>
      </div>
    </div>
  );
};
