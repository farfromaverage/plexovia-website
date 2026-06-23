/**
 * Plexovia — Catch-all proxy to Railway backend
 *
 * WHY THIS EXISTS:
 *   Vercel strips the Authorization header from rewrite-proxied requests
 *   in production. The Railway backend never receives the JWT and returns
 *   401 on every authenticated call. This API route runs server-side
 *   within Vercel and explicitly forwards all necessary headers — including
 *   Authorization — to the backend.
 *
 * ROUTE:
 *   /api/engine/[...path]  →  ${ENGINE_URL}/api/${path}
 *
 * EXAMPLE:
 *   Client calls:  fetch("/api/engine/user/pipeline")
 *   Proxy calls:   fetch("https://engine.plexovia.com/api/user/pipeline")
 *
 * METHODS:  GET, POST, PUT, PATCH, DELETE
 * TIMEOUT:  20 seconds (matches engineFetch client-side timeout headroom)
 * AUTH:     Forwarded as-is — the backend validates the JWT, not this proxy.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEngineUrl } from "@/lib/engine-url";

// Hop-by-hop and Vercel-internal headers that must not be forwarded
const STRIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "proxy-authorization",
  "proxy-connection",
]);

const STRIP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
]);

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const engineUrl = getEngineUrl();

  // Reconstruct the backend URL: /api/engine/user/pipeline → /api/user/pipeline
  const targetPath = `/api/${path.join("/")}`;
  const url = new URL(targetPath, engineUrl);

  // Forward query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // Forward request headers, stripping hop-by-hop
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  // Override host to match the backend (not the Vercel deployment)
  headers.set("host", new URL(engineUrl).host);

  // Preserve client IP for backend rate limiting (slowapi reads X-Forwarded-For)
  const clientIp =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  headers.set("x-forwarded-for", clientIp);

  // Read body for methods that carry one (avoids streaming/duplex issues)
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const backendRes = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? Buffer.from(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });

    // Forward response, stripping hop-by-hop headers
    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    if (isTimeout) {
      return NextResponse.json(
        { error: "Backend timeout" },
        { status: 504 },
      );
    }
    console.error("[engine-proxy] backend request failed:", err);
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 },
    );
  }
}

// Export all methods used by the backend API
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
