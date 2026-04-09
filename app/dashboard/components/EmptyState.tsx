import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div
      role="status"
      aria-label={title}
      style={{
        padding: "3.5rem 2rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.625rem",
      }}
    >
      <div style={{ color: "var(--app-faint)", marginBottom: "0.25rem" }} aria-hidden="true">
        {icon}
      </div>
      <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--app-muted)", margin: 0 }}>
        {title}
      </p>
      <p style={{
        fontSize: "0.8125rem",
        color: "var(--app-faint)",
        margin: 0,
        maxWidth: 380,
        lineHeight: 1.55,
      }}>
        {message}
      </p>
      {action && <div style={{ marginTop: "0.875rem" }}>{action}</div>}
    </div>
  );
}
