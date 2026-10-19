// Shared loading / empty / error states. `prefix` is the data-testid prefix (e.g. "tickets").
export function LoadingState({ prefix }: { prefix: string }) {
  return (
    <p className="state" role="status" data-testid={`${prefix}-loading`}>
      Loading...
    </p>
  );
}

export function EmptyState({ prefix, message }: { prefix: string; message: string }) {
  return (
    <p className="state" data-testid={`${prefix}-empty`}>
      {message}
    </p>
  );
}

export function ErrorState({
  prefix,
  message,
  onRetry,
}: {
  prefix: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="form-error" role="alert" data-testid={`${prefix}-error`}>
      <p data-testid={`${prefix}-error-message`}>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} data-testid={`${prefix}-retry`}>
          Retry
        </button>
      )}
    </div>
  );
}
