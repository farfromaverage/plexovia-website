import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // Initialize Supabase with service role key to bypass RLS in the webhook
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // Note: Vercel needs this for webhooks to update profiles safely
    );
    const secret = process.env.LS_WEBHOOK_SECRET || '';
    // 1. Get the raw body as text for HMAC verification
    const text = await req.text();
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(text).digest('hex'), 'utf8');

    // 2. Get the signature from headers
    const signatureHeader = req.headers.get('x-signature') || '';
    const signature = Buffer.from(signatureHeader, 'utf8');

    // 3. Verify signature (prevent timing attacks)
    if (digest.length !== signature.length || !crypto.timingSafeEqual(digest, signature)) {
      console.error('Invalid LemonSqueezy signature.');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    // 4. Parse payload
    const payload = JSON.parse(text);
    const eventName = payload.meta.event_name;
    const obj = payload.data.attributes;
    const customData = payload.meta.custom_data || {};
    
    // Extracted from custom data or user email
    const userId = customData.user_id; // Passed when creating the checkout session
    const customerEmail = obj.user_email;
    const subscriptionId = payload.data.id.toString();
    const customerId = obj.customer_id.toString();
    const status = obj.status; // active, past_due, unpaid, cancelled, expired, paused
    const endsAt = obj.ends_at ? new Date(obj.ends_at).toISOString() : null;
    const trialEndsAt = obj.trial_ends_at ? new Date(obj.trial_ends_at).toISOString() : null;

    if (!userId && !customerEmail) {
      return new NextResponse('Missing user identifier', { status: 400 });
    }

    console.log(`Processing LemonSqueezy event: ${eventName} for ${customerEmail}`);

    // Resolve user ID if possible
    let finalUserId = userId;
    if (!finalUserId && customerEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single();
      if (profile) finalUserId = profile.id;
    }

    if (!finalUserId) {
      console.warn(`Webhook received for ${customerEmail} but no profile found.`);
      // Depending on workflow, you could create a ghost profile here, but better to just acknowledge
      return new NextResponse('No profile found. Ignored.', { status: 200 });
    }

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated': {
        // Update user's plan and subscription details
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'Plexovia Intelligence',
            active: status === 'active' || status === 'on_trial',
            trial_ends_at: trialEndsAt,
            plan_expires_at: endsAt,
            ls_customer_id: customerId,
            ls_subscription_id: subscriptionId,
            updated_at: new Date().toISOString()
          })
          .eq('id', finalUserId);
        if (error) throw new Error(`Supabase Update Error: ${error.message}`);
        break;
      }

      case 'subscription_cancelled': {
        // Keep plan active until `endsAt` date
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'cancelled',
            plan_expires_at: endsAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', finalUserId);
        if (error) throw new Error(`Supabase Update Error: ${error.message}`);
        break;
      }

      case 'subscription_resumed':
        await supabase
          .from('profiles')
          .update({
            plan: 'Plexovia Intelligence',
            active: true,
            plan_expires_at: null, // clear expiration since it's resumed
            updated_at: new Date().toISOString()
          })
          .eq('id', finalUserId);
        break;

      case 'subscription_expired':
      case 'subscription_payment_failed':
        // Mark inactive if payment permanently failed or expired
        await supabase
          .from('profiles')
          .update({
            active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', finalUserId);

        if (eventName === 'subscription_payment_failed') {
          // Note: In Phase 2D we are required to trigger an email via Resend.
          // The engine/core/emailer.py or backend can do this, or we can hit the generic resend API here.
          // For now, logging. The engine cron or an Edge Function can pick up inactive status.
          console.log(`Payment failed for ${customerEmail}.`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${eventName}`);
        break;
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('LemonSqueezy Webhook Error:', error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
