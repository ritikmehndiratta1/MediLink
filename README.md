# MediLink

Marketplace connecting medical retailers and wholesalers by medicine availability and proximity.

## Stack

- `client/` — React + Vite frontend (deployed on Render)
- `server/` — Express + `pg` backend (deployed on Render)
- Database — Postgres via Supabase
- Analytics — PostHog (product analytics, funnels, autocaptured clicks/pageviews)

## Setup

### Database

Run the SQL files in `server/db/migrations/` against your Supabase project, in order, via the Supabase SQL editor (or `psql "$DATABASE_URL" -f server/db/migrations/001_init.sql`).

- `001_init.sql` creates `users` and a single `business_profiles` table shared by retailers and wholesalers (role-specific columns like `delivery_available` simply stay at their default for the role that doesn't use them).
- `002_drop_legacy_profile_tables.sql` drops the earlier separate `retailer_profiles` / `wholesaler_profiles` tables, if they exist. Only run this after migrating any rows you care about.

### Server

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, POSTHOG_API_KEY
npm install
npm run dev
```

### Client

```bash
cd client
cp .env.example .env   # fill in VITE_API_URL, VITE_POSTHOG_KEY
npm install
npm run dev
```

PostHog is optional in both apps — if the API key env var is unset, capture calls are no-ops so local dev works without a PostHog account.
