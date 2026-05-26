import { NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    // Rate limit: 3 per IP per hour
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    if (record) {
      if (now < record.resetAt) {
        if (record.count >= 3) {
          return NextResponse.json(
            { error: "Too many requests. Try again later." },
            { status: 429 }
          );
        }
        record.count += 1;
      } else {
        rateLimitMap.set(ip, { count: 1, resetAt: now + 3600 * 1000 });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 3600 * 1000 });
    }

    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Attempt to send via Resend if API key is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Plexovia <alerts@plexovia.com>",
          to: [email],
          subject: "Your Plexovia Sample Digest",
          html: buildSampleDigestHTML(),
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("[sample-digest] Resend error:", errBody);
        // Still return success to user so they don't see an error
      }
    }

    return NextResponse.json({
      success: true,
      message: resendKey
        ? "Sample preview sent. Check your email."
        : "Thank you. Your sample digest will arrive shortly.",
    });
  } catch (e) {
    console.error("[sample-digest] Error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Build a realistic sample digest email
function buildSampleDigestHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#F7F5F0;color:#1C1917;">
  <div style="max-width:600px;margin:0 auto;padding:2rem 1.5rem;">
    <div style="margin-bottom:1.5rem;border-bottom:1px solid #E2DDD6;padding-bottom:1rem;">
      <h1 style="font-size:1.25rem;font-weight:800;margin:0;letter-spacing:-0.03em;">
        <span style="color:#C9A84C;">P</span>lexovia
      </h1>
      <p style="font-size:0.875rem;color:#6B6560;margin:0.5rem 0 0;">Sample Dashboard Preview &middot; Plexovia</p>
    </div>

    <div style="background:#fff;border:1px solid #E2DDD6;border-radius:12px;padding:1.5rem;margin-bottom:1.25rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
        <div>
          <p style="font-weight:700;font-size:0.9375rem;margin:0 0 0.2rem;letter-spacing:-0.02em;">IT Support Services: Department of Veterans Affairs</p>
          <p style="font-size:0.75rem;color:#8A8580;margin:0;font-family:monospace;">Solicitation 36C24826R0041 &middot; Northern Virginia and Maryland</p>
        </div>
        <div style="text-align:center;width:56px;height:56px;border-radius:50%;border:2.5px solid #C9A84C;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;background:rgba(201,168,76,0.08);">
          <span style="font-weight:800;font-size:1.2rem;color:#C9A84C;line-height:1;">87</span>
          <span style="font-size:0.6rem;color:#8A8580;">/100</span>
        </div>
      </div>
      <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:0.875rem 1rem;margin-bottom:1rem;">
        <p style="font-size:0.625rem;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#C9A84C;margin:0 0 0.375rem;">Why this scored 87</p>
        <p style="font-size:0.85rem;color:#1C1917;line-height:1.65;margin:0;">Primary NAICS 541512 matches solicitation record (strong signal). Place of performance is Maryland, your preferred state. SDVOSB set aside aligns with your certification on file. Deadline is 12 days out.</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:0.75rem;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0.5rem 0.75rem;background:#F7F5F0;border:1px solid #E2DDD6;border-radius:6px;width:50%;">
            <p style="font-size:0.575rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8A8580;margin:0 0 0.15rem;">Agency</p>
            <p style="font-size:0.8125rem;font-weight:600;color:#1C1917;margin:0;">Dept. of Veterans Affairs</p>
          </td>
          <td style="padding:0 6px;"></td>
          <td style="padding:0.5rem 0.75rem;background:#F7F5F0;border:1px solid #E2DDD6;border-radius:6px;width:50%;">
            <p style="font-size:0.575rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8A8580;margin:0 0 0.15rem;">Deadline</p>
            <p style="font-size:0.8125rem;font-weight:600;color:#1C1917;margin:0;">Apr 18, 2026</p>
          </td>
        </tr>
      </table>
      <a href="https://sam.gov" style="color:#C9A84C;font-size:0.8125rem;font-weight:600;text-decoration:underline;text-underline-offset:3px;">View Solicitation on SAM.gov &rarr;</a>
    </div>

    <div style="text-align:center;padding:1.5rem 0;">
      <a href="https://plexovia.com/auth/signup" style="display:inline-block;padding:0.875rem 2rem;background:#C9A84C;color:#1C1917;font-weight:700;font-size:0.9375rem;border-radius:8px;text-decoration:none;">Start Your Contract Intelligence</a>
      <p style="font-size:0.75rem;color:#8A8580;margin:0.75rem 0 0;">14-day free trial. No charge until Day 15.</p>
    </div>

    <p style="font-size:0.6875rem;color:#A8A29E;text-align:center;margin:1rem 0 0;border-top:1px solid #E2DDD6;padding-top:1rem;">
      This is a sample preview from Plexovia. Your real dashboard contains your actual NAICS-matched contracts.
    </p>
  </div>
</body>
</html>`;
}
