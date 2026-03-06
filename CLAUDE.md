# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**We Run For** is a Next.js full-stack web application that turns Strava runs into awareness for charitable causes. Users connect their Strava account, set pledge rules (e.g. "50% of my miles go to Cause A"), and their runs automatically generate impact.

**Core flow:** User runs → Strava sync → Miles calculated → Pledged to causes → Cause totals updated

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix UI), Framer Motion |
| Database | SQLite (dev: `better-sqlite3`, prod: Cloudflare D1) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 beta (Google + Resend email + custom Strava OAuth) |
| Deployment | Cloudflare Workers / Pages via `@cloudflare/next-on-pages` |

---

## Commands

```bash
npm run dev           # Start local dev server (uses local.db SQLite file)
npm run build         # Production Next.js build
npm run pages:build   # Build for Cloudflare Pages
npm run lint          # Run ESLint
```

No automated tests — TypeScript strict mode and ESLint are the primary guardrails.

### Database — Local Development

Local development uses `better-sqlite3` with a `local.db` file (gitignored) initialized automatically on dev start.

```bash
npx drizzle-kit generate --config drizzle.local.config.ts   # After schema changes
npx drizzle-kit migrate --config drizzle.local.config.ts    # Apply migrations
```

### Database — Production (Cloudflare D1)

```bash
npx wrangler d1 migrations apply run-for-db
```

---

## Environment Variables

Create a `.env.local` file (see `.env.template`):

```
AUTH_SECRET=<random string>
AUTH_GOOGLE_ID=<Google OAuth client ID>
AUTH_GOOGLE_SECRET=<Google OAuth secret>
AUTH_STRAVA_ID=<Strava OAuth client ID>
AUTH_STRAVA_SECRET=<Strava OAuth secret>
AUTH_RESEND_KEY=<Resend API key>
AUTH_EMAIL_FROM=<sender email>
NEXTAUTH_URL=<your domain, e.g., https://run-for.pages.dev>
```

---

## Architecture

### Authentication — Two Separate Systems

There are **two distinct auth flows** that must be understood together:

1. **NextAuth** (`src/auth.ts`) — handles user login via Google OAuth and Resend magic link email. Uses `DrizzleAdapter` to manage standard auth tables (`user`, `account`, `session`, `verificationToken`).

2. **Custom Strava OAuth** (`src/app/api/strava/connect/` and `src/app/api/strava/callback/`) — a separate OAuth flow that links a Strava account to an existing authenticated user. The user's ID is encoded in the OAuth `state` parameter. On callback, the Strava tokens are upserted into the `account` table via `.onConflictDoUpdate()`.

This split means a user must first sign in via NextAuth (Google/email), then separately connect their Strava account. The `accessToken` for Strava API calls is then available on the session.

- Get session in server actions: `const session = await auth()`
- Always check `session?.user?.id` before any user-specific DB operation
- Strava access tokens auto-refresh in the `jwt` callback in `src/auth.ts` (checks `expires_at` every 5 minutes)
- TypeScript module augmentation for the session type is in `src/next-auth.d.ts`

### Database Access — D1 vs Local SQLite

`src/db/index.ts` exports a Proxy-based `db` object that lazily resolves to either Cloudflare D1 or local `better-sqlite3` depending on the environment.

In **production (edge runtime)**, D1 must be accessed per-request via `getRequestContext()` from `@cloudflare/next-on-pages` — it cannot be initialized at module load time. The `index.ts` proxy handles this automatically.

Pages and API routes targeting edge runtime must include:
```ts
export const runtime = "edge";
```

### Server Actions

All server actions (DB mutations and reads) live exclusively in `src/app/actions.ts` (`"use server"` at top). Pages fetch data server-side and pass it as props to client components. Client components call server actions for mutations and use `router.refresh()` to revalidate.

Key actions:
- `syncAndAutoPledge(activitiesList)` — bulk pledges using all enabled rules; filters out already-pledged activities
- `pledgeActivity(activity, causeId)` — single activity → one cause
- `getUserImpactSummary()` — aggregation query grouping ledger entries by cause
- `getUnpledgedActivities()` — activities not yet in the ledger

### Strava Activity Sync Flow

1. Dashboard page fetches recent activities from Strava API using `session.accessToken`
2. `syncActivities()` upserts all activities to the `activity` table (`.onConflictDoNothing()`)
3. `syncAndAutoPledge()` runs on mount if the user has enabled rules (auto-pledges new runs)
4. Users can also manually pledge unpledged activities via a dialog

### Dashboard Components

| File | Responsibility |
|---|---|
| `user-dashboard.tsx` | Main container; tabs between runs needing action and history |
| `pledge-settings.tsx` | Sliders/switches for creating and editing auto-pledge rules |
| `impact-summary.tsx` | Stat cards (total miles pledged, top cause) |
| `pledge-history.tsx` | Animated timeline of ledger entries |
| `cause-list.tsx` | Browse global causes to add pledge rules |
| `share-dialog.tsx` | Generate and share a dedication card |

---

## Key Conventions

### Database

- **Always use Drizzle ORM** — never write raw SQL unless using `sql` template literals for atomic operations
- Atomic counter increments must use the `sql` helper to avoid race conditions:
  ```ts
  // CORRECT — atomic
  await db.update(causes).set({
      currentMiles: sql`${causes.currentMiles} + ${miles}`,
  })
  // WRONG — race condition
  await db.update(causes).set({ currentMiles: currentMiles + miles })
  ```
- Use `.onConflictDoNothing()` for idempotent inserts (syncing Strava activities)
- UUID primary keys are generated via `crypto.randomUUID()` in `$defaultFn`
- After mutations, call `revalidatePath("/")` to invalidate Next.js cache

### Distance Units

Strava provides distances in **meters**. The app stores distances in meters in the `activities` table and converts to miles for display and ledger entries:
```ts
const miles = activity.distance * 0.000621371;
const roundedMiles = Math.round(miles); // ledger stores integer miles
```

### Styling

- Dark mode is **forced** via `<html className="dark">` in `layout.tsx` — do not add light mode conditionals
- Use the `cn()` utility from `@/lib/utils` to merge Tailwind classes
- Colors use oklch format in CSS custom properties (defined in `globals.css`)
- shadcn/ui components use the "new-york" style with neutral base color
- Path alias `@/*` maps to `./src/*`

### Error Handling

- Server actions that return data: wrap in try-catch, return empty arrays/defaults on error
- Server actions that mutate state: `throw new Error("Unauthorized")` on auth failure
- Log errors with `console.error()`

---

## Database Schema Summary

### Auth Tables (NextAuth — do not modify)
- `user` — users; includes `totalMiles` and `currentStreak` gamification fields
- `account`, `session`, `verificationToken` — standard NextAuth tables

### App Tables
- `causes` — `userId` nullable: null = global cause, set = personal cause
- `pledgeRules` — `user_id → cause_id` at a `percentage` (0–100); composite index on `(userId, causeId)`
- `activities` — Strava activities; `id` is the Strava numeric ID stored as a string; `distance` in meters
- `ledger` — **append-only** transaction log: `activity_id → cause_id` with integer `milesApplied`; never update or delete

`causes.currentMiles` and `user.totalMiles` are **denormalized counters** — always update atomically using `sql` literals. The `ledger` table is the authoritative source of truth.

---

## Git Workflow

Push directly to `main` — no PRs or feature branches required at this stage.

Commit message format: `Category: Short description`

Categories: `UI:`, `Feature:`, `Fix:`, `Fix Build:`, `Refactor:`, `UX Polish:`

---

## Cloudflare Deployment Notes

- D1 database binding name: `run_for_db` (see `wrangler.toml`)
- `nodejs_compat` compatibility flag is required
- Build for Cloudflare: `npm run pages:build` (runs `npx @cloudflare/next-on-pages`)
- `drizzle/` contains auto-generated migration files — do not edit directly
