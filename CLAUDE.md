# CLAUDE.md — RunFor Codebase Guide

## Project Overview

**RunFor** is a Next.js full-stack web application that turns Strava runs into awareness for charitable causes. Users connect their Strava account, set pledge rules (e.g. "50% of my miles go to Cause A"), and their runs automatically generate impact.

**Core flow:** User runs → Strava sync → Miles calculated → Pledged to causes → Cause totals updated

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix UI), Framer Motion |
| Database | SQLite (dev: `better-sqlite3`, prod: Cloudflare D1) |
| ORM | Drizzle ORM 0.45.1 |
| Auth | NextAuth.js v5 beta with Strava OAuth provider |
| Deployment | Cloudflare Workers / Pages via `@cloudflare/next-on-pages` |
| Icons | Lucide React |

---

## Repository Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/    # NextAuth catch-all route
│   ├── dashboard/                 # Protected user dashboard page
│   ├── layout.tsx                 # Root layout (forces dark mode)
│   ├── page.tsx                   # Landing page (hero, how-it-works, top causes)
│   ├── actions.ts                 # ALL server actions (DB mutations & reads)
│   └── globals.css                # Tailwind base + custom oklch color vars
├── components/
│   ├── auth/                      # SignInButton, SignOutButton
│   ├── dashboard/                 # Feature components (see below)
│   └── ui/                        # shadcn/ui primitives (do not edit directly)
├── db/
│   ├── schema.ts                  # Drizzle schema — source of truth for DB
│   ├── index.ts                   # DB initialization (env-aware)
│   └── seed_global_causes.sql     # Seed data for global causes
├── lib/
│   └── utils.ts                   # cn() helper (clsx + tailwind-merge)
└── auth.ts                        # NextAuth config (Strava provider, token refresh)

drizzle/                           # Auto-generated migration files (do not edit)
public/                            # Static assets
wrangler.toml                      # Cloudflare Workers config
drizzle.config.ts                  # Drizzle Kit config for Cloudflare D1
drizzle.local.config.ts            # Drizzle Kit config for local SQLite
```

### Dashboard Components

| File | Responsibility |
|---|---|
| `UserDashboard.tsx` | Main container; tabs between Impact, Pledge Settings, and History |
| `PledgeSettings.tsx` | UI for creating/editing auto-pledge rules (cause + percentage + enabled toggle) |
| `ImpactSummary.tsx` | Stat cards showing miles pledged per cause |
| `PledgeHistory.tsx` | Animated transaction timeline from the ledger |
| `CauseDiscovery.tsx` | Browse/search global causes to add pledge rules |

---

## Development Setup

### Prerequisites
- Node.js (see `.nvmrc` if present)
- A Strava Developer App (for OAuth)

### Environment Variables

Create a `.env.local` file:
```
AUTH_SECRET=<random string>
AUTH_STRAVA_ID=<Strava client ID>
AUTH_STRAVA_SECRET=<Strava client secret>
```

### Commands

```bash
npm run dev           # Start local dev server (uses local.db SQLite file)
npm run build         # Production Next.js build
npm run pages:build   # Build for Cloudflare Pages
npm run lint          # Run ESLint
```

### Database (Local Development)

Local development uses `better-sqlite3` with a `local.db` file at the project root. The DB is initialized automatically when the dev server starts.

To run migrations locally:
```bash
npx drizzle-kit migrate --config drizzle.local.config.ts
```

To generate new migrations after schema changes:
```bash
npx drizzle-kit generate --config drizzle.local.config.ts
```

### Database (Production — Cloudflare D1)

The production D1 database binding is `run_for_db` (see `wrangler.toml`). Apply migrations:
```bash
npx wrangler d1 migrations apply run-for-db
```

---

## Key Conventions

### Server vs Client Components

- **Server actions** live exclusively in `src/app/actions.ts` (marked `"use server"` at the top of the file)
- **Client components** use `"use client"` directive at the top and manage their own state with React hooks
- Pages fetch data server-side and pass it as props to client components
- Use `export const runtime = "edge"` on pages where edge runtime is appropriate

### Database Access

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
- Use `.onConflictDoNothing()` for idempotent inserts (e.g. syncing Strava activities)
- Use `with: { relation: true }` for eager loading related data
- UUID primary keys are generated via `crypto.randomUUID()` in `$defaultFn`

### Distance Units

Strava provides distances in **meters**. The app stores distances in meters in the `activities` table and converts to miles for display and ledger entries:
```ts
const miles = activity.distance * 0.000621371;
const roundedMiles = Math.round(miles); // ledger stores integer miles
```

### Authentication

- Get the current session in server actions with `const session = await auth()`
- Always check `session?.user?.id` before any user-specific DB operation
- Strava access tokens auto-refresh in the `jwt` callback in `src/auth.ts` (checks every 5 minutes using `expires_at`)
- The session is extended with `accessToken` for Strava API calls

### Styling

- Dark mode is **forced** via `<html className="dark">` in `layout.tsx` — do not add light mode conditionals
- Use the `cn()` utility from `@/lib/utils` to merge Tailwind classes:
  ```ts
  import { cn } from "@/lib/utils"
  className={cn("base-classes", conditional && "conditional-class")}
  ```
- Colors use oklch format in CSS custom properties (defined in `globals.css`)
- shadcn/ui components use the "new-york" style with neutral base color
- For new UI components, follow the shadcn/ui pattern — install via CLI or add to `src/components/ui/`

### TypeScript

- Strict mode is enabled — no implicit `any`
- Use explicit types for component props
- Module augmentation for NextAuth session is in `src/auth.ts`
- Path alias `@/*` maps to `./src/*`
- The `any` type is used sparingly in Drizzle query callbacks where generic inference is complex — this is acceptable

### Error Handling

- Server actions that return data should wrap in try-catch and return empty arrays/defaults on error
- Server actions that mutate state should throw errors on auth failure: `throw new Error("Unauthorized")`
- Log errors with `console.error()` for debugging
- After mutations, call `revalidatePath("/")` to invalidate Next.js cache

### Commit Messages

Follow the pattern: `Category: Short description`

Categories used in this project: `UI:`, `Feature:`, `Fix:`, `Fix Build:`, `Refactor:`, `UX Polish:`

---

## Database Schema Summary

### Auth Tables (NextAuth standard — do not modify)
- `user` — users with gamification fields (`total_miles`, `current_streak`)
- `account` — OAuth account links
- `session` — active sessions
- `verificationToken` — email verification

### App Tables
- `causes` — fundraising goals; `user_id` is nullable (null = global cause, set = personal cause)
- `pledge_rules` — user's auto-pledge config: `user_id → cause_id` at a `percentage` (0–100)
- `activity` — synced Strava activities; primary key is the Strava activity ID (stored as text)
- `ledger` — immutable transaction log: `activity_id → cause_id` with `miles_applied`

### Important Schema Notes
- `causes.currentMiles` and `users.totalMiles` are **denormalized counters** — update atomically
- `ledger` is append-only — never update or delete ledger entries
- `activities.id` stores Strava's numeric ID as a string for consistency

---

## Cloudflare Deployment Notes

- The app targets Cloudflare Workers via `@cloudflare/next-on-pages`
- D1 database binding name: `run_for_db` (configured in `wrangler.toml`)
- NodeJS compatibility is enabled via `compatibility_flags = ["nodejs_compat"]`
- Build for Cloudflare: `npm run pages:build` (runs `npx @cloudflare/next-on-pages`)
- When using the D1 binding in code, access it via the Cloudflare env context — `src/db/index.ts` handles this automatically based on the environment

---

## No Test Infrastructure

There are currently no automated tests. TypeScript strict mode and ESLint serve as the primary code quality guardrails. When adding tests in the future, consider Vitest for unit tests and Playwright for E2E.
