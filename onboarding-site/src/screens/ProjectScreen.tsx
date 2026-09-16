// src/screens/ProjectScreen.tsx
// Screen 3 — Your project. Single-select list of four AI agent rows.
import { FiMessageSquare, FiPhone, FiRefreshCw, FiUsers } from 'react-icons/fi';
import type { OnboardPayload, ValidationErrors } from '../types';
import { AGENT_ROWS } from '../content/options';
import Stepper from '../components/Stepper';

interface Props {
  form: OnboardPayload;
  selectAgent: (type: string) => void;
  errors: ValidationErrors;
  onContinue: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'Text AI Agent': <FiMessageSquare />,
  'Voice AI Agent': <FiPhone />,
  'ReactivationOS Agent': <FiRefreshCw />,
  'OnboardingOS': <FiUsers />,
};

export default function ProjectScreen({ form, selectAgent, errors, onContinue }: Props) {
  return (
    <div className="card">
      <Stepper currentStep={2} />
      <h2 className="h2">Your project</h2>
      <p className="body-text">
        Confirm which AI agent you signed up for.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {AGENT_ROWS.map((row) => {
          const selected = form.agentType === row.type;
          return (
            <button
              key={row.type}
              className={`select-row ${selected ? 'selected' : ''}`}
              onClick={() => selectAgent(row.type)}
            >
              <span className="select-row-icon">
                {ICON_MAP[row.type]}
              </span>
              <div className="select-row-body">
                <div className="select-row-title">{row.type}</div>
                <div className="select-row-desc">{row.description}</div>
              </div>
              <span className="select-row-radio" />
            </button>
          );
        })}
      </div>

      {errors.agentType && (
        <span className="field-error">{errors.agentType}</span>
      )}

      <button className="primary-btn" onClick={onContinue}>
        Continue <span className="arrow">→</span>
      </button>
    </div>
  );
}