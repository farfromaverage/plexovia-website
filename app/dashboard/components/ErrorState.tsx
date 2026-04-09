import { AlertCircle } from "lucide-react";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
}: Props) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        padding: "2.5rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <AlertCircle size={28} color="#F87171" aria-hidden="true" />
      <p style={{
        color: "#F87171",
        fontSize: "0.875rem",
        margin: 0,
        maxWidth: 380,
        lineHeight: 1.5,
      }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="dash-btn"
          style={{ marginTop: "0.25rem", minHeight: 36 }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
