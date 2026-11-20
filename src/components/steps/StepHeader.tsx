import React from 'react';
import { AlertOctagon, Clock, ShieldCheck } from 'lucide-react';

interface StepHeaderProps {
  num: number;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeTone?: 'ok' | 'blocked' | 'pending';
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  num,
  title,
  subtitle,
  badgeText,
  badgeTone = 'ok'
}) => {
  const showBadge = badgeText !== undefined ? badgeText : 'Confidential Intake';
  const borderColor =
    badgeTone === 'blocked'
      ? 'rgba(244, 63, 94, 0.6)'
      : badgeTone === 'pending'
        ? 'rgba(245, 158, 11, 0.5)'
        : 'rgba(148, 163, 184, 0.25)';
  const bg =
    badgeTone === 'blocked'
      ? 'rgba(136, 19, 55, 0.7)'
      : badgeTone === 'pending'
        ? 'rgba(120, 53, 15, 0.55)'
        : 'rgba(15, 23, 42, 0.65)';
  const textColor =
    badgeTone === 'blocked'
      ? '#fecdd3'
      : badgeTone === 'pending'
        ? '#fde68a'
        : '#cbd5e1';

  return (
    <div className="step-banner">
      <div>
        <span className="step-kicker">Step {num} of 6 • Client Application</span>
        <h2 className="step-title">{title}</h2>
        <p className="step-subtitle">{subtitle}</p>
      </div>
      {showBadge && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: bg,
            border: `1px solid ${borderColor}`,
            padding: '7px 12px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            color: textColor
          }}
        >
          {badgeTone === 'blocked' ? (
            <AlertOctagon size={15} color="#fb7185" />
          ) : badgeTone === 'pending' ? (
            <Clock size={15} color="#fbbf24" />
          ) : (
            <ShieldCheck size={15} color="#fbbf24" />
          )}
          <span>{showBadge}</span>
        </div>
      )}
    </div>
  );
};
