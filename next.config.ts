import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",       value: "on" },
  { key: "X-Frame-Options",              value: "DENY" },
  { key: "X-Content-Type-Options",       value: "nosniff" },
  { key: "Referrer-Policy",              value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",           value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // CSP Directives:
    // - 'unsafe-inline': Required by Tailwind CSS JIT and client-side style injection
    // - 'unsafe-eval': Required by PostHog analytics (uses eval internally for session recording)
    // - 'unsafe-inline' on script-src: Required by PostHog inline initialization
    key: "Content-Security-Policy",
    value: [
      "base-uri 'self'",
      "object-src 'none'",
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.posthog.com https://engine.plexovia.com",
      "frame-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      // Supabase storage (user avatars, logos)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" },
      // Google OAuth profile photos
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Turbopack (default in Next.js 16) — empty config silences the webpack conflict warning
  turbopack: {},

  async rewrites() {
    const engineUrl = process.env.INTERNAL_ENGINE_URL
      || (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://plexovia-engine.railway.app");
    return [
      { source: "/api/user/pipeline/:path*", destination: `${engineUrl}/api/user/pipeline/:path*` },
      { source: "/api/user/pipeline",        destination: `${engineUrl}/api/user/pipeline` },
      { source: "/api/search",               destination: `${engineUrl}/api/search` },
      { source: "/api/user/competitors/:path*", destination: `${engineUrl}/api/user/competitors/:path*` },
      { source: "/api/calendar/:path*",      destination: `${engineUrl}/api/calendar/:path*` },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
