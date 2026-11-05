# Cashflow Gate Trading V1

Independent, mobile-first dark trading interface prototype for market education, virtual practice trading, and skill-based youth challenges.

## Included
- Responsive dark UI with green/red market movement styling.
- Illustrative commodity, crypto and forex watchlist with filters.
- CFG-denominated virtual practice display and simulated buy/close flows.
- Optional Supabase authentication and account-scoped practice positions/events on the authenticated Practice backend branch.
- Device-only demo balance, simulated P/L, youth prediction challenge and demo XP.
- Illustrative ROI scenario calculator; no investment contract or payout.
- No wagers or real-money prize mechanics.

## Run
Open `index.html` in a browser or deploy the static frontend as a Vercel Preview.

## Practice data and important limits
- CFG is the platform's internal demo/practice display unit. Demo CFG has no monetary value and is not redeemable.
- The demo balance, local XP and local challenge history are stored in the current browser/device; they are not an authoritative server balance or ledger.
- When the optional authenticated Practice backend is correctly configured and deployed, signed-in users can save simulated positions and practice events to their account. These records are educational simulation records only.
- Market prices and percentage changes in this prototype are illustrative data, not live or executable market quotes.
- No real deposits, withdrawals, transfers, custody, investment subscriptions, CFG issuance/redemption, broker connection, or real trading execution are enabled.
- Frontend labels and feature flags are not authorization for real-money activity. Any future real-money capability requires a separately approved, server-side default-deny gate and the legal, compliance, security, accounting, treasury and operational approvals defined in the CFG Real Account Activation Policy V1.

## Backend deployment status
The authenticated Practice backend is an optional, separate component. Its source changes in the `feature/auth-practice-backend-v1` branch are not proof that the matching Supabase Edge Function or database schema has been deployed. Before enabling the authenticated backend, reconcile the live Supabase schema/function drift documented in `PRACTICE_BACKEND_LIVE_DRIFT_AUDIT.md`, test on an isolated non-production database, and configure an exact origin allowlist. Do not deploy migrations or Edge Functions to the live project as part of this prototype review.

## Roadmap
1. Complete isolated tests for authentication, account isolation, RLS, CORS, idempotency and rate limits.
2. Reconcile and document database migration history against the actual live schema and RPC definition.
3. Integrate a licensed market-data source only after selecting a provider, timestamps and stale-data handling.
4. Add persistent challenges, audited scoring and anti-fraud checks.
5. Review applicable licensing, age and consumer-protection requirements before any real-money trading, investment participation or cash rewards.

Cashflow Gate remains standalone. Any Maharoos entry point should be a link or separately designed identity flow; financial ledgers and business logic must not be merged.
