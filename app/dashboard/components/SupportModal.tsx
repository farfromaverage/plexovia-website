"use client";

import { useState } from "react";
import { X, Send, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export function SupportModal({ isOpen, onClose, userEmail, userName }: { isOpen: boolean, onClose: () => void, userEmail: string, userName: string }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.length < 20) {
      setError("Message must be at least 20 characters.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, name: userName })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSubject("");
        setMessage("");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--app-surface)] w-full max-w-md rounded-2xl border border-[var(--app-border)] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--app-border)] bg-[var(--app-surface-2)]">
          <h2 className="font-semibold text-[var(--app-text)]">Contact Support</h2>
          <button onClick={onClose} className="p-1 rounded-md text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-bg)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
            <CheckCircle size={40} className="text-[var(--accent)]" />
            <h3 className="font-medium text-[var(--app-text)] text-lg">Message Sent</h3>
            <p className="text-[var(--app-muted)] text-sm">We'll get back to you at {userEmail} as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--app-muted)] ml-0.5">From</label>
              <input type="text" value={`${userName || "User"} (${userEmail})`} disabled className="w-full px-3 py-2.5 bg-[var(--app-surface-2)] border border-[var(--app-border)] rounded-lg text-[var(--app-muted)] text-sm outline-none cursor-not-allowed" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--app-muted)] ml-0.5">Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="How can we help?" className="w-full px-3 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-lg text-[var(--app-text)] text-sm outline-none focus:border-[var(--accent)] transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--app-muted)] ml-0.5">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required minLength={20} placeholder="Please provide details (minimum 20 characters)..." rows={4} className="w-full px-3 py-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-lg text-[var(--app-text)] text-sm outline-none focus:border-[var(--accent)] transition-colors resize-none" />
            </div>

            <button type="submit" disabled={loading} className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--accent)] text-[#1C1917] font-semibold text-sm hover:bg-[var(--accent-lt)] transition-colors disabled:opacity-70">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Message</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
