"use client";

import ErrorState from "./components/ErrorState";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: "2rem" }}>
      <ErrorState
        title="Something went wrong"
        message="An unexpected error occurred. Please try again."
        onRetry={() => reset()}
      />
    </div>
  );
}
