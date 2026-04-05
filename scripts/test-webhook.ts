// Fallbacks for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bgwgcemgiivqpyudsrrm.supabase.co';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.LS_WEBHOOK_SECRET = 'test_secret_123';

import { POST } from '../app/api/webhook/lemonsqueezy/route';
import crypto from 'crypto';

const secret = process.env.LS_WEBHOOK_SECRET;

const payload = {
  meta: {
    event_name: 'subscription_created',
    custom_data: {
      user_id: '6ad659ad-0838-4ebe-991b-6c3135d87def'
    }
  },
  data: {
    id: 998877,
    attributes: {
      user_email: 'abdulwahidltd@gmail.com',
      customer_id: 112233,
      status: 'on_trial',
      ends_at: null,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
};

const payloadString = JSON.stringify(payload);

const hmac = crypto.createHmac('sha256', secret!);
const digest = Buffer.from(hmac.update(payloadString).digest('hex'), 'utf8');

const req = new Request('http://localhost:3000/api/webhook/lemonsqueezy', {
  method: 'POST',
  body: payloadString,
  headers: {
    'x-signature': digest.toString('utf8'),
    'Content-Type': 'application/json'
  }
});

async function runTest() {
  try {
    const res = await POST(req);
    console.log(`Response status: ${res.status}`);
    const text = await res.text();
    console.log(`Response text: ${text}`);
    if (res.status === 200) {
      console.log('✅ Webhook successfully verified signature and processed request.');
    } else {
      console.error('❌ Webhook failed processing.');
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

runTest();
