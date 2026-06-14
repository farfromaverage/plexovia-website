<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# website — Frontend DOX

## Purpose

Next.js 16.2.1 frontend for Plexovia. Dashboard for federal contract matches, user onboarding, profile management, and billing. Deployed on Vercel.

## Ownership

This subtree owns:
- Dashboard pages (contracts, billing, onboarding, profile, settings)
- API routes (user-matches, overview, export, webhook, support, engine-stats, onboarding proxy)
- Auth flow (login, signup, callback, password reset)
- Supabase SSR client (anon key + user JWT, RLS-enforced)
- UI components (shadcn/ui + custom)
- Static data files (NAICS, PSC, federal organizations)
- Public marketing pages (home, pricing, legal)

## Local Contracts

| Module | Responsibility |
|--------|---------------|
| `app/api/` | Server-side route handlers. Auth via session or internal key. |
| `app/auth/` | Login, signup, callback (code exchange), password flows. |
| `app/dashboard/` | Protected pages. All use browser Supabase client. |
| `components/` | Reusable UI. `ui/` = shadcn primitives. `home/` = marketing. |
| `hooks/` | `useContractStatus` (localStorage bookmarks), `useLastVisit`. |
| `lib/supabase.ts` | Browser client (`createBrowserClient`). |
| `lib/supabase/server.ts` | Server client (`createServerClient` with cookie handling). |
| `public/data/` | Reference JSON: `naics-2022.json` (2,193), `psc-codes.json` (966), `federal-organizations.json` (42). |
| `public/fonts/` | Self-hosted woff2/ttf. NO external font CDN. |

## Work Guidance

- **Next.js 16 defaults to Turbopack.** The `--webpack` flag in scripts overrides this. Do NOT remove it.
- **4GB memory required.** `NODE_OPTIONS=--max-old-space-size=4096` via `cross-env`.
- **Tailwind v4 CSS-first config.** Tokens in `globals.css` under `@theme inline { }`. NO `tailwind.config.ts`.
- **Import style:** `@import "tailwindcss";` (not `@tailwind base/components/utilities`).
- **Fonts:** All self-hosted in `public/fonts/`. Uses `next/font/local` in `layout.tsx`. Never add Google Fonts CDN.
- **Set-aside preferences:** 7 core codes (SB, 8A, WOSB, EDWOSB, SDVOSB, HUBZONE, VETERAN). Filter stored preferences on load against the valid list.
- **Security:** Webhook handler validates HMAC before creating Supabase client. All API routes fail-fast if required env vars are missing. Internal key comparison uses `crypto.timingSafeEqual`.

## Verification

```bash
npx tsc --noEmit    # type check
npm run lint        # eslint (must be 0 errors, 0 warnings)
npm run build       # production build (all 33 routes)
```

## Child DOX Index

No child AGENTS.md files. All modules governed by this doc.
