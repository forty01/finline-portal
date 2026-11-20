import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface StepHeaderProps {
  num: number;
  title: string;
  subtitle: string;
}

export const StepHeader: React.FC<StepHeaderProps> = ({ num, title, subtitle }) => (
  <div className="step-banner">
    <div>
      <span className="step-kicker">Step {num} of 6 • Client Intake Fact-Finder</span>
      <h2 className="step-title">{title}</h2>
      <p className="step-subtitle">{subtitle}</p>
    </div>
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        padding: '7px 12px',
        borderRadius: 10,
        fontSize: 12,
        color: '#cbd5e1'
      }}
    >
      <ShieldCheck size={15} color="#fbbf24" />
      <span>IGO Best-Interest Aligned</span>
    </div>
  </div>
);
