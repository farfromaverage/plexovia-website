"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import Link from "next/link";

export default function PaymentFailedBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase
        .from("profiles")
        .select("payment_failed")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.payment_failed) {
            setShow(true);
          }
        });
    });
  }, []);

  if (!show) return null;

  return (
    <div style={{
      background: "var(--danger-subtle)",
      borderBottom: "1px solid rgba(194,59,59,0.2)",
      color: "var(--danger)",
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      fontSize: "0.85rem",
      fontWeight: 500,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <AlertTriangle size={16} />
        <span>⚠️ Your payment failed. Update your payment method to avoid service interruption.</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/dashboard/billing" style={{ color: "inherit", textDecoration: "underline", display: "flex", alignItems: "center", gap: "4px" }}>
          Update Payment Method <ArrowRight size={14} />
        </Link>
        <button onClick={() => setShow(false)} aria-label="Close" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.7 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
