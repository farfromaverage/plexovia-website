import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Helper to reliably ping the Python backend for emails
async function triggerEngineEmail(endpoint: string, payload: any) {
  const engineUrl = (process.env.RAILWAY_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const internalKey = process.env.INTERNAL_API_KEY || '';
  
  try {
    const res = await fetch(`${engineUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': internalKey
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error(`Engine email ${endpoint} failed with status: ${res.status}`);
    }
  } catch (err) {
    console.error(`Failed to reach engine for ${endpoint}:`, err);
  }
}

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
      case 'subscription_created': {
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
        
        // Trigger welcome email
        await triggerEngineEmail('/api/internal/welcome-email', {
          user_email: customerEmail,
          trial_ends_at: trialEndsAt || new Date(Date.now() + 7*24*60*60*1000).toISOString()
        });
        break;
      }

      case 'subscription_updated': {
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
        
        if (status === 'active') {
          // Send payment success if they converted
          await triggerEngineEmail('/api/internal/payment-success', { user_email: customerEmail });
        }
        break;
      }

      case 'subscription_cancelled': {
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: 'cancelled',
            plan_expires_at: endsAt,
            updated_at: new Date().toISOString()
          })
          .eq('id', finalUserId);
        if (error) throw new Error(`Supabase Update Error: ${error.message}`);
        
        // Trigger cancelled email
        await triggerEngineEmail('/api/internal/subscription-cancelled', { user_email: customerEmail });
        break;
      }

      case 'subscription_resumed': {
        await supabase
          .from('profiles')
          .update({
            plan: 'Plexovia Intelligence',
            active: true,
            plan_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', finalUserId);
        
        // Trigger payment/subscription resumed effectively as success
        await triggerEngineEmail('/api/internal/payment-success', { user_email: customerEmail });
        break;
      }

      case 'subscription_expired':
      case 'subscription_payment_failed': {
        await supabase
          .from('profiles')
          .update({
            active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', finalUserId);

        if (eventName === 'subscription_payment_failed') {
          await triggerEngineEmail('/api/internal/payment-failed', { user_email: customerEmail });
          console.log(`Payment failed mapped and email triggered for ${customerEmail}.`);
        }
        break;
      }

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
