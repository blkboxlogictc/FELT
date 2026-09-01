# Felt — Poker Cash Game Tracker

A mobile-first poker cash game tracker built with Next.js 14, Tailwind CSS, and Supabase — for groups of friends, not a single host.

---

## Features

- **Accounts** — anyone signs up for their own account
- **Groups** — create a private group or join one via invite code; any member can schedule a game
- **Self-reported buy-ins** — each player enters their own buy-ins, rebuys, and cashout
- **Peer flagging** — any other player at the table can flag an entry as inaccurate (informational — never blocks settlement)
- **Settlement Engine** — peer-to-peer debt minimization
- **Lifetime stats** — rolled up across every group and game a player has been in

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

## Netlify Deployment

### 1. Push to GitHub

```bash
git add -A
git commit -m "Initial commit"
git push origin main
```

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
2. Select your repository
3. Build settings are already configured in `netlify.toml`

### 3. Add environment variables

In Netlify → Site configuration → Environment variables, add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL    ← set to your Netlify URL
```

### 4. Install the Netlify Next.js plugin

The `netlify.toml` already includes `@netlify/plugin-nextjs`. It will be installed automatically during the first deploy.

### 5. Configure Supabase Auth redirect URLs

In Supabase → Authentication → URL Configuration:

- **Site URL**: your Netlify URL (e.g. `https://felt.netlify.app`)
- **Redirect URLs**: add `https://felt.netlify.app/**`

This is needed for signup email confirmation to redirect correctly.

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
    /[id]             — Live game — every participant's buy-ins/cashout, self-only edit + peer flagging
    /[id]/settlement  — Settlement summary once the game is closed
  /profile            — Lifetime stats across all groups + account settings
  /history            — Games across all of your groups

/components
  /ui                 — Button, Modal, Card, Badge primitives
  /game               — ParticipantCard, BuyInModal, CashOutModal, FlagEntryModal, SettlementSummary, CloseGameButton
  /groups             — GroupCard, CreateGroupForm, JoinGroupForm, GroupMembersList, InviteCodeShare
  /layout             — Navbar with mobile bottom tab bar
  /dashboard          — Dashboard (home)

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
