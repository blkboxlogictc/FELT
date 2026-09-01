# Felt — Poker Cash Game Tracker

A mobile-first poker cash game tracker built with Next.js 14, Tailwind CSS, and Supabase — for groups of friends, not a single host.

---

## Features

- **Accounts** — anyone signs up for their own account
- **Groups** — create a private group or join one via invite code; any member can schedule a game
- **Personal games** — track a solo session (a casino night, a game with people not on Felt) with no group at all
- **Self-reported buy-ins** — each player enters their own buy-ins, rebuys, and cashout
- **Peer flagging** — any other player at the table can flag an entry as inaccurate (informational — never blocks settlement)
- **Settlement Engine** — peer-to-peer debt minimization
- **Lifetime stats** — rolled up across every group, and every personal game, a player has been in
- **Installable PWA** — installs to a phone's home screen and runs full-screen like a native app

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd felt
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Run the schema SQL

In the Supabase SQL Editor, run the full contents of [`supabase/schema.sql`](supabase/schema.sql).

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up for an account, and create or join a group.

---

## Supabase Schema

The full schema — tables, the computed buy-in view, helper functions, and every RLS policy — lives in [`supabase/schema.sql`](supabase/schema.sql). Paste its contents into the Supabase SQL Editor (Database → SQL Editor → New query) and run it once against a fresh project.

At a glance: `profiles` (auto-created on signup), `groups` + `group_members`, `games` (scoped to a group), `game_participants` (roster/RSVP), `buy_in_events` (self-authored buyin/rebuy/cashout log), `entry_flags` (peer flagging), and a `game_participant_totals` view that computes each participant's buy-in total from the event log instead of a stored column.

> **Note:** Every mutation now runs as the signed-in user through the anon key + RLS — there is no privileged "host" role or service-role bypass anymore. `lib/supabase/admin.ts` (service role) is kept in the codebase only as a future internal-ops escape hatch; no user-facing action uses it.

---

## Progressive Web App

Felt is installable on a phone's home screen and runs full-screen like a native app:

- `public/manifest.json` — name, icons, `display: "standalone"`, theme color
- `public/sw.js` — a minimal service worker. It only cache-firsts immutable static assets (`/_next/static/*`, `/brand/*`, the icon files) — it deliberately does **not** cache pages, server actions, or Supabase calls, since this is a live-data app behind auth and caching a dynamic response could serve stale or wrong-user content. Its only job is to make the app installable and speed up repeat static-asset loads.
- `components/pwa/ServiceWorkerRegister.tsx` — registers the service worker, mounted once in `app/layout.tsx`
- `components/pwa/InstallPrompt.tsx` — shown on the landing page for signed-out visitors. On Android/desktop Chrome it captures the browser's native `beforeinstallprompt` event and offers a one-tap "Install" button; iOS Safari has no such API, so it shows "Tap Share → Add to Home Screen" instead. Hidden entirely once the app is already running standalone, and dismissible (remembered via `localStorage`).

Nothing here needs configuration — it works as soon as the app is deployed over HTTPS (required for service workers; Netlify serves HTTPS by default).

---

## Netlify Deployment

Felt needs no separate backend to write — every mutation is a Next.js Server Action, and `@netlify/plugin-nextjs` (already configured in `netlify.toml`) automatically wraps each one into its own Netlify Function at deploy time. Supabase is the only other backend piece, and it's accessed directly from those functions via the anon key + RLS.

### 1. Push to GitHub

If you haven't already, create an empty repository on [github.com](https://github.com/new) (don't initialize it with a README), then:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

(A local commit already exists if this repo was set up with Claude Code's help — check `git log` before running `git init`/`git commit` again.)

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Select your repository
3. Build settings are already configured in `netlify.toml` — Netlify should auto-detect Next.js and offer to install `@netlify/plugin-nextjs` if it isn't already picked up from the config

### 3. Add environment variables

In Netlify → Site configuration → Environment variables, add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL    ← set to your Netlify URL, e.g. https://felt.netlify.app
```

### 4. Configure Supabase Auth redirect URLs

In Supabase → Authentication → URL Configuration:

- **Site URL**: your Netlify URL (e.g. `https://felt.netlify.app`)
- **Redirect URLs**: add `https://felt.netlify.app/**`

This is needed for signup email confirmation to redirect correctly.

### 5. Redeploy after any env var change

Netlify only reads environment variables at build time — trigger a new deploy after adding or changing one.

---

## Architecture

```
/app
  /login              — Email/password sign-in
  /signup             — Self-serve account creation
  /page.tsx           — Home: your groups + upcoming/active games + stats teaser
  /groups
    /new              — Create a group
    /join             — Join a group by invite code
    /[id]             — Roster, invite-code share, group's game history
    /[id]/games/new   — Schedule a game for that group
  /games
    /new              — Schedule a game — pick a group, or "Just me" for a personal/solo game
    /[id]             — Live game — every participant's buy-ins/cashout, self-only edit + peer flagging
    /[id]/settlement  — Settlement summary once the game is closed
  /profile            — Lifetime stats across all groups + personal games + account settings
  /history            — Games across all of your groups

/components
  /ui                 — Button, Modal, Card, Badge primitives
  /game               — ParticipantCard, BuyInModal, CashOutModal, FlagEntryModal, SettlementSummary, CloseGameButton, NewGameForm
  /groups             — GroupCard, CreateGroupForm, JoinGroupForm, GroupMembersList, InviteCodeShare
  /layout             — Navbar with mobile bottom tab bar
  /dashboard          — Dashboard (home)
  /landing            — LandingPage (signed-out marketing page)
  /pwa                — ServiceWorkerRegister, InstallPrompt
  /profile            — DisplayNameSection (view + edit-modal)

/lib
  /supabase           — client.ts (browser), server.ts (SSR), admin.ts (service role, unused escape hatch)
  /actions            — profile.ts, group.ts, game.ts, flag.ts server actions
  /queries            — game.ts — merges the participants table with the totals view
  /settlement         — Debt minimization algorithm
  /utils              — formatCurrency, formatDate
  auth.ts             — requireAuth() helper
  authz.ts            — assertGroupMember(), assertGameGroupMember(), assertOwnEntry()
```

## Settlement Algorithm

### Peer-to-peer mode
Uses a greedy debt-minimization approach:
1. Compute each player's net (cashout − total buy-in)
2. Sort creditors (positive net) descending, debtors (negative net) descending by magnitude
3. Match largest debtor to largest creditor, settle `min(debt, credit)`
4. Advance pointer for whichever balance reaches zero
5. Result: fewest possible transactions to clear all debts

### Central bank mode
The `central_bank` code path (`lib/settlement/index.ts`) is still available, but there's no "host" to act as the bank anymore, so the schedule-game UI only offers peer-to-peer for now.

## Dollar Amounts

All amounts are stored as **integers in cents** in the database. The `parseToCents` utility converts user input, and `formatCurrency` converts back for display.

Example: $50 buy-in → stored as `5000`.
