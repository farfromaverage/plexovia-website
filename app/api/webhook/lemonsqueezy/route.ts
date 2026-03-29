/**
 * Plexovia — LemonSqueezy Webhook Handler
 * POST /api/webhook/lemonsqueezy
 *
 * Handles all payment lifecycle events:
 *   subscription_created  → set plan + trial_ends_at in profiles
 *   subscription_updated  → update plan tier
 *   subscription_cancelled → mark cancelled, keep expires_at
 *   subscription_payment_failed → trigger payment failure email
 *
 * Security: HMAC-SHA256 signature verified on every request.
 * Unsigned or tampered requests are rejected with 401.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// ── Supabase admin client — lazy singleton (avoids build-time init) ───────────
// Must NOT be instantiated at module level: env vars not available during build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _supabase
}

// ── HMAC Signature Verification ──────────────────────────────────────────────
function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const secret = process.env.LS_WEBHOOK_SECRET
  if (!secret) {
    console.error('[LS Webhook] LS_WEBHOOK_SECRET not set — rejecting all requests')
    return false
  }
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}

// ── Plan mapping from LemonSqueezy variant name → Plexovia plan name ─────────
function getPlanFromVariantName(variantName?: string): 'active' {
  return 'active'
}

// ── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Read raw body for HMAC verification — must read before parsing JSON
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature')

  if (!verifySignature(rawBody, signature)) {
    console.warn('[LS Webhook] Invalid signature — rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: Record<string, any>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName: string = payload?.meta?.event_name
  const data = payload?.data?.attributes
  const customData = payload?.meta?.custom_data

  // customer_user_id is set during checkout as custom_data.user_id
  const userId: string | undefined = customData?.user_id

  console.log(`[LS Webhook] Event: ${eventName} | User: ${userId ?? 'unknown'}`)

  if (!userId) {
    // Log but still return 200 — LemonSqueezy retries on non-2xx
    console.warn('[LS Webhook] No user_id in custom_data — skipping Supabase update')
    return NextResponse.json({ received: true })
  }

  try {
    switch (eventName) {

      // ── New subscription created ──────────────────────────────────────────
      case 'subscription_created': {
        const variantName: string = data?.variant_name ?? ''
        const plan = getPlanFromVariantName(variantName)
        const trialEndsAt = data?.trial_ends_at ?? null

        await getSupabase()
          .from('profiles')
          .update({
            plan,
            trial_ends_at: trialEndsAt,
            ls_subscription_id: data?.id,
            ls_customer_id: data?.customer_id,
            plan_expires_at: data?.renews_at ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log(`[LS Webhook] subscription_created → plan=${plan}, trial_ends_at=${trialEndsAt}`)
        break
      }

      // ── Subscription tier changed (upgrade/downgrade) ─────────────────────
      case 'subscription_updated': {
        const variantName: string = data?.variant_name ?? ''
        const plan = getPlanFromVariantName(variantName)
        const status: string = data?.status ?? 'active'

        await getSupabase()
          .from('profiles')
          .update({
            plan,
            plan_expires_at: data?.renews_at ?? null,
            ls_subscription_id: data?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log(`[LS Webhook] subscription_updated → plan=${plan}, status=${status}`)
        break
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case 'subscription_cancelled': {
        // Keep plan active until plan_expires_at — don't hard-delete
        await getSupabase()
          .from('profiles')
          .update({
            plan: 'cancelled',
            plan_expires_at: data?.ends_at ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        console.log(`[LS Webhook] subscription_cancelled → expires_at=${data?.ends_at}`)
        break
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case 'subscription_payment_failed': {
        // Mark the profile — middleware can enforce grace period
        await getSupabase()
          .from('profiles')
          .update({
            payment_failed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        // TODO: trigger Resend payment-failed email via engine API
        // The engine's trial_mailer handles this if RESEND_API_KEY is set
        console.warn(`[LS Webhook] subscription_payment_failed for user ${userId}`)
        break
      }

      default:
        console.log(`[LS Webhook] Unhandled event: ${eventName}`)
    }
  } catch (err) {
    console.error('[LS Webhook] Supabase update failed:', err)
    // Return 500 so LemonSqueezy retries the event
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // Always return 200 for handled events
  return NextResponse.json({ received: true })
}
