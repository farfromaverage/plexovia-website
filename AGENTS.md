<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# website — Frontend DOX

## Purpose

Next.js 16.2.1 frontend for Plexovia. Dashboard for federal contract matches, user onboarding, profile management, and billing. Deployed on Vercel.

## Ownership

This subtree owns:
- Dashboard pages (pipeline kanban, contracts with search, competitors, billing, onboarding, profile, settings)
- API routes (user-matches, overview, export, webhook, support, engine-stats, onboarding proxy)
- Auth flow (login, signup, callback, password reset)
- Supabase SSR client (anon key + user JWT, RLS-enforced)
- UI components (shadcn/ui + custom)
- Backend proxy layer (engine.ts JWT helper, api/engine proxy route, next.config.ts calendar rewrite)
- Static data files (NAICS, PSC, federal organizations)
- Public marketing pages (home, pricing, legal)

## Local Contracts

| Module | Responsibility |
|--------|---------------|
| `app/api/` | Server-side route handlers. Auth via session or internal key. `api/engine/[...path]` proxies authenticated requests to Railway backend (Vercel strips Authorization from rewrites). |
| `app/auth/` | Login, signup, callback (code exchange), password flows. |
| `app/dashboard/` | Protected pages (pipeline enterprise pursuit board with intelligence strip, search, active/terminal split, detail drawer; contracts/search; competitors; billing; onboarding; profile; settings/alerts). All use browser Supabase client. |
| `components/` | Reusable UI. `ui/` = shadcn primitives. `home/` = marketing. |
| `hooks/` | `useContractStatus` (localStorage bookmarks), `useLastVisit`. |
| `lib/supabase.ts` | Browser client (`createBrowserClient`). |
| `lib/engine.ts` | `engineFetch()` helper — attaches JWT and routes through `/api/engine/` proxy to reach Railway backend. |
| `lib/engine-url.ts` | `getEngineUrl()` — single source of truth for backend URL resolution. Used by engine proxy route and inlined in `next.config.ts` calendar rewrite. |
| `lib/supabase/server.ts` | Server client (`createServerClient` with cookie handling). |
| `public/data/` | Reference JSON: `naics-2022.json` (2,193), `psc-codes.json` (966), `federal-organizations.json` (44 seed orgs, replaced by authoritative FH API dataset on deploy). |
| `public/fonts/` | Self-hosted woff2/ttf. NO external font CDN. |

## Work Guidance

- **Next.js 16 defaults to Turbopack.** The `--webpack` flag in scripts overrides this. Do NOT remove it.
- **4GB memory required.** `NODE_OPTIONS=--max-old-space-size=4096` via `cross-env`.
- **Tailwind v4 CSS-first config.** Tokens in `globals.css` under `@theme inline { }`. NO `tailwind.config.ts`.
- **Import style:** `@import "tailwindcss";` (not `@tailwind base/components/utilities`).
- **Fonts:** All self-hosted in `public/fonts/`. Uses `next/font/local` in `layout.tsx`. Never add Google Fonts CDN.
- **Pipeline page:** Enterprise pursuit management system. Bookmark-gated (shows only saved=true matches). 7-stage model: qualifying, pursuing, proposal_in_progress, submitted (active) + awarded, not_awarded, no_bid (terminal). No "identified" stage. Active stages shown as primary board (4 columns); terminal stages in collapsible section below. Detail drawer (slide-in panel) replaces inline card expansion. Intelligence strip surfaces deadline risk and action items. Command bar with search (title, agency, NAICS, solicitation) + sort (updated, score, deadline, value). Empty pipeline shows "Your Pipeline is Waiting" with link to Discover page. Post-onboarding redirects to `/dashboard/contracts` (not pipeline). Files: `page.tsx` (assembly), `pipeline-helpers.ts` (types + utilities), `PipelineCard.tsx` (card), `PipelineColumn.tsx` (column), `PipelineDrawer.tsx` (detail drawer), `PipeSkeleton.tsx` (skeleton loading state matching kanban layout). Pipeline CSS classes in `dashboard.css` under `pipe-*` prefix. Design tokens: `--overlay-scrim`, `--info-border` added for drawer overlay and incumbent intelligence box respectively. Scorecard uses flattened `divide-x` row (cockpit mode, no card containers per DASHBOARD HARDENING rule). All interactive elements have `:active` tactile feedback (`scale(0.98)`). URL input shows inline validation error text. Taste Skill (Leonxlnx/taste-skill) installed at `.agents/skills/` — 13 skills available for reference.
- **Set-aside preferences:** 7 core codes (SB, 8A, WOSB, EDWOSB, SDVOSB, HUBZONE, VETERAN). Filter stored preferences on load against the valid list.
- **Security:** LemonSqueezy webhook handler validates HMAC signature, then forwards verified payload to backend internal API (`/api/internal/webhook/lemonsqueezy`) for database writes. No service key in Vercel deployment. All API routes fail-fast if required env vars are missing. Internal key comparison uses `crypto.timingSafeEqual`.

## Verification

```bash
npx tsc --noEmit    # type check
npm run lint        # eslint (must be 0 errors, 0 warnings)
npm run build       # production build (all 35 routes)
```

## Child DOX Index

No child AGENTS.md files. All modules governed by this doc.
