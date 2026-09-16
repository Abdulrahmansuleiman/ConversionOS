// src/components/Stepper.tsx
// Thin horizontal progress indicator on screens 2–4.

interface Props {
  currentStep: 1 | 2 | 3;
}

const STEPS = ['Your details', 'Your project', 'Quick questions'] as const;

export default function Stepper({ currentStep }: Props) {
  const zeroIndexed = currentStep - 1; // 0, 1, 2

  return (
    <nav className="stepper" aria-label="Onboarding progress">
      {STEPS.map((label, i) => {
        const state: 'done' | 'active' | 'upcoming' =
          i < zeroIndexed ? 'done' : i === zeroIndexed ? 'active' : 'upcoming';
        return (
          <div
            key={label}
            style={{ display: 'contents' }}
          >
            {/* Dot + label pair */}
            <div className="stepper-step">
              <span className={`stepper-dot ${state}`} />
              <span className={`stepper-label ${state}`}>{label}</span>
            </div>
            {/* Connector line (after last dot: no line) */}
            {i < STEPS.length - 1 && (
              <span
                className={`stepper-line ${
                  i < zeroIndexed ? 'filled' : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}