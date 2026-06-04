"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: '#f7f5f0' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1.2rem', margin: '0 0 8px' }}>Something went wrong</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 20px' }}>Please try again.</p>
          <button onClick={reset} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#635BFF', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
