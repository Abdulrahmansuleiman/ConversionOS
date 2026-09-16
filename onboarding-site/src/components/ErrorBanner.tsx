// src/components/ErrorBanner.tsx
// Visible error banner with retry action.

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="error-banner" role="alert">
      <span aria-hidden="true">⚠</span>
      <div style={{ flex: 1 }}>
        <strong>Submission failed.</strong>
        <div style={{ marginTop: 2 }}>{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 4,
            fontSize: 13,
            fontWeight: 600,
            color: '#fca5a5',
            textDecoration: 'underline',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}