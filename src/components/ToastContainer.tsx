import React from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { ToastItem } from '../types/portal';

interface ToastContainerProps {
  toasts: ToastItem[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (!toasts.length) return null;

  return (
    <div className="toast-container no-print">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle2 size={16} color="#fbbf24" style={{ flexShrink: 0 }} />}
          {t.type === 'warning' && <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0 }} />}
          {t.type === 'error' && <XCircle size={16} color="#fb7185" style={{ flexShrink: 0 }} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
