import React from 'react';
import {
  HeartHandshake,
  HeartPulse,
  Home,
  Info,
  Landmark,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { ANNUITY_SERIES, GOAL_OPTIONS, LIFE_SERIES } from '../../data/knowledgeBase';
import type { ClientCase } from '../../types/portal';
import { StepHeader } from './StepHeader';

interface Step1TrackProps {
  clientCase: ClientCase;
  isAdvisor?: boolean;
  onUpdate: (patch: Partial<ClientCase>) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  wallet: <Wallet size={16} />,
  shield: <Shield size={16} />,
  'trending-up': <TrendingUp size={16} />,
  landmark: <Landmark size={16} />,
  'heart-handshake': <HeartHandshake size={16} />,
  sparkles: <Sparkles size={16} />,
  home: <Home size={16} />
};

const CLIENT_FRIENDLY_GOALS: Record<string, { label: string; desc: string }> = {
  'Lifetime Guaranteed Income': {
    label: 'Guaranteed Lifetime Income',
    desc: 'Create a steady retirement paycheck you cannot outlive'
  },
  'Principal Protection (0% Floor)': {
    label: 'Protect My Savings',
    desc: 'Keep your money safe from stock market downturns'
  },
  'Accumulation / Premium Bonus': {
    label: 'Safe, Steady Growth',
    desc: 'Grow your retirement savings without market loss'
  },
  'Legacy / Estate Transfer': {
    label: 'Leave a Legacy',
    desc: 'Pass wealth smoothly to your family or loved ones'
  },
  'Healthcare / Wellbeing Cost Offset': {
    label: 'Future Healthcare Cushion',
    desc: 'Extra support if long-term care or health needs arise'
  },
  'Tax-Free Retirement (LIRP / IUL)': {
    label: 'Tax-Advantaged Retirement',
    desc: 'Build cash value you can access with tax advantages'
  },
  'Final Expense / Mortgage Protection': {
    label: 'Family & Final Expenses',
    desc: 'Protect loved ones from mortgage debt or final costs'
  }
};

export const Step1Track: React.FC<Step1TrackProps> = ({
  clientCase,
  isAdvisor = false,
  onUpdate
}) => {
  const seriesOptions = clientCase.track === 'annuity' ? ANNUITY_SERIES : LIFE_SERIES;

  const toggleGoal = (goalId: string) => {
    const exists = clientCase.goals.includes(goalId);
    const next = exists
      ? clientCase.goals.filter((g) => g !== goalId)
      : [...clientCase.goals, goalId];
    onUpdate({ goals: next });
  };

  return (
    <>
      <StepHeader
        num={1}
        title={isAdvisor ? 'Application Track & Financial Objectives' : 'Getting Started — Your Goals'}
        subtitle={
          isAdvisor
            ? 'Select the planning track, financial priorities, and target carrier product series.'
            : "Tell me what you're looking to accomplish so I can match the best options for you."
        }
      />
      <div className="step-body">
        {/* Track Selector */}
        <div>
          <span className="kicker-label">
            {isAdvisor ? '1. Select Primary Application Track' : '1. What can I help you with today?'}
          </span>
          <div className="grid-2">
            <button
              type="button"
              onClick={() =>
                onUpdate({ track: 'annuity', targetProduct: 'Recommend Best Fit (Advisor)' })
              }
              className={`choice-tile ${clientCase.track === 'annuity' ? 'selected' : ''}`}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: clientCase.track === 'annuity' ? '#f59e0b' : '#f1f5f9',
                  color: clientCase.track === 'annuity' ? '#020617' : '#475569'
                }}
              >
                <Landmark size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    {isAdvisor ? 'Annuity & Retirement Rollover' : 'Retirement Savings & Income'}
                  </span>
                  {clientCase.track === 'annuity' && <span className="badge badge-gold">Selected</span>}
                </div>
                <p style={{ margin: '5px 0 0', fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                  Protect retirement savings from market loss, roll over an IRA or 401(k), or set up guaranteed lifetime income. No medical exam required.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdate({ track: 'life', targetProduct: 'Recommend Best Fit (Advisor)' })
              }
              className={`choice-tile ${clientCase.track === 'life' ? 'selected' : ''}`}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: clientCase.track === 'life' ? '#f59e0b' : '#f1f5f9',
                  color: clientCase.track === 'life' ? '#020617' : '#475569'
                }}
              >
                <HeartPulse size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    {isAdvisor ? 'Life Insurance / IUL / Final Expense' : 'Life Insurance & Family Protection'}
                  </span>
                  {clientCase.track === 'life' && <span className="badge badge-gold">Selected</span>}
                </div>
                <p style={{ margin: '5px 0 0', fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                  Protect your family, cover final expenses or a mortgage, or build tax-advantaged savings for the future.
                </p>
              </div>
            </button>
          </div>

          <label
            style={{
              marginTop: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 12.5,
              color: '#334155',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '9px 14px',
              borderRadius: 11,
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={clientCase.dualReview}
              onChange={(e) => onUpdate({ dualReview: e.target.checked })}
            />
            <span style={{ fontWeight: 600 }}>
              I&apos;d like to explore both retirement income and life insurance options
            </span>
          </label>
        </div>

        {/* Goals */}
        <div>
          <span className="kicker-label">
            {isAdvisor
              ? '2. Primary Financial Objectives (Select all that apply)'
              : '2. What are your main goals? (Select all that apply)'}
          </span>
          <div className="grid-3">
            {GOAL_OPTIONS.map((g) => {
              const active = clientCase.goals.includes(g.id);
              const friendly = CLIENT_FRIENDLY_GOALS[g.id];
              const displayLabel = isAdvisor ? g.label : (friendly?.label ?? g.label);
              const displayDesc = isAdvisor ? g.desc : (friendly?.desc ?? g.desc);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className={`goal-tile ${active ? 'active' : ''}`}
                >
                  <div style={{ marginTop: 2, color: active ? '#fbbf24' : '#64748b', flexShrink: 0 }}>
                    {ICON_MAP[g.icon]}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{displayLabel}</div>
                    <div
                      style={{
                        fontSize: 11.5,
                        marginTop: 3,
                        color: active ? '#cbd5e1' : '#64748b',
                        lineHeight: 1.4
                      }}
                    >
                      {displayDesc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Product Series — Advisor Only */}
        {isAdvisor && (
          <div className="callout callout-slate" style={{ flexDirection: 'column', gap: 10 }}>
            <label className="kicker-label" style={{ marginBottom: 0 }}>
              3. Target Contract / Product Series (Advisor Selection)
            </label>
            <select
              className="select"
              value={clientCase.targetProduct}
              onChange={(e) => onUpdate({ targetProduct: e.target.value })}
            >
              {seriesOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#64748b' }}>
              <Info size={14} color="#d97706" style={{ flexShrink: 0 }} />
              <span>
                Hidden from clients — assign the carrier product series here during your review.
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
