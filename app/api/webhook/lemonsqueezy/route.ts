import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const secret = process.env.LS_WEBHOOK_SECRET;
    if (!secret) {
      console.error('LS_WEBHOOK_SECRET is not configured');
      return new NextResponse('Webhook secret not configured', { status: 500 });
    }

    // 1. Read the raw body for HMAC verification
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

    // 4. Forward the verified raw payload to the backend for processing
    const engineUrl = (process.env.RAILWAY_API_URL || 'http://localhost:8000').replace(/\/$/, '');
    const internalKey = process.env.INTERNAL_API_KEY;

    if (!internalKey) {
      console.error('[webhook] INTERNAL_API_KEY not configured');
      return new NextResponse('Internal API key not configured', { status: 500 });
    }

    const engineResponse = await fetch(`${engineUrl}/api/internal/webhook/lemonsqueezy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': internalKey,
      },
      body: JSON.stringify({ body_raw: text }),
    });

    if (!engineResponse.ok) {
      const errorText = await engineResponse.text();
      console.error(`Engine webhook processing failed: ${engineResponse.status} ${errorText}`);
      return new NextResponse('Engine processing failed', { status: 502 });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('LemonSqueezy Webhook Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
