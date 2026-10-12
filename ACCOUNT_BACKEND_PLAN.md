# Cashflow Gate — Secure Accounts & Server History Plan

This document is the next implementation gate for Cashflow Gate. The existing demo remains available and unchanged until the backend is configured.

## Why accounts are not enabled yet
A real account system needs a trusted authentication provider and a server-side database. Browser-only JavaScript/localStorage is editable by visitors and must never be treated as proof of identity, balance, XP, trades, sales, or money owed. Do not put service-role keys, database passwords, payment secrets, or signing keys in client-side code.

## Recommended first backend: Supabase
Create a Supabase project, then configure these Vercel environment variables for Preview and Production:
- `SUPABASE_URL` — project URL (public endpoint)
- `SUPABASE_ANON_KEY` — publishable/anon client key only; this is not a service-role secret

Server-only secrets, if needed by server functions, must use separate private environment variables and must never be prefixed for browser exposure. Do not commit real keys to GitHub.

## V1 account scope
1. Sign up and sign in using verified email; add password reset.
2. Require email verification before allowing a profile to be considered verified.
3. Profile stores a generated user ID, display name, preferred language, creation timestamp and verification state. Do not collect identity documents until a reviewed compliance flow exists.
4. Save demo/practice events in a server table with user ID, event type, market symbol, simulated amount, simulated P/L, event time and an idempotency identifier.
5. Use database row-level security so each authenticated user can read only their own profile and practice history.
6. The server is authoritative for XP and simulation event validation. Never accept client-submitted balance or P/L as authoritative.
7. Add rate limits, input validation, error logging and database backups before public rollout.

## Initial data model (proposal)
- `profiles`: `id` (auth user ID, primary/foreign key), `display_name`, `preferred_language`, `created_at`.
- `practice_events`: `id`, `user_id`, `event_type`, `market_symbol`, `virtual_amount`, `simulated_pnl`, `idempotency_key`, `created_at`.
- `practice_positions`: `id`, `user_id`, `market_symbol`, `entry_price`, `virtual_units`, `virtual_cost`, `status`, `opened_at`, `closed_at`.

These tables must use constraints and row-level security policies; the proposed schema is not yet deployed.

## Acceptance checks before merging an account implementation
- Sign up, email verification, sign in, sign out and password reset work.
- User A cannot read, alter or delete User B's data, even by changing API requests.
- Refreshing or using another device restores server history only after authentication.
- Duplicate submissions do not create duplicate events.
- No secret keys appear in the browser bundle, Git history, logs or API responses.
- Practice mode remains clearly marked DEMO; no real deposit, withdrawal, investment or trade execution is implied.

## Financial and product boundary
Cashflow Gate remains an independent project. Do not merge its account ledger or business logic with Maharoos Mini or Jakay V3. This step covers accounts and practice history only; real-money trading, investments, payouts, and market-data integrations require separate design, security testing, and legal/compliance review before activation.
