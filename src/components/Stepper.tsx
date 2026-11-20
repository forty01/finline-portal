import React from 'react';
import { Check } from 'lucide-react';
import { STEPS_META } from '../data/knowledgeBase';
import type { ClientCase } from '../types/portal';
import { getStepStatus } from '../utils/calculations';

interface StepperProps {
  clientCase: ClientCase;
  onGoToStep: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ clientCase, onGoToStep }) => {
  return (
    <nav aria-label="Application Progress" className="stepper-card no-print">
      <ol className="stepper-grid">
        {STEPS_META.map((s) => {
          const isCurrent = clientCase.currentStep === s.num;
          const isDone = getStepStatus(clientCase, s.num) === 'complete';
          return (
            <li key={s.num}>
              <button
                type="button"
                onClick={() => onGoToStep(s.num)}
                className={`step-btn ${isCurrent ? 'current' : ''} ${isDone ? 'complete' : ''}`}
              >
                <span className="step-num">
                  {isDone && !isCurrent ? <Check size={14} strokeWidth={2.75} /> : s.num}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      opacity: 0.72,
                      fontWeight: 700
                    }}
                  >
                    Step {s.num}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {s.short}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
