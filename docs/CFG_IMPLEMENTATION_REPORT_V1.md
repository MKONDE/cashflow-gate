# Implementation Report — Cashflow Gate International Foundation V1

## Repository inspection

Repository: `MKONDE/cashflow-gate`
Default branch: `main`
Working branch: `feat/cfg-international-foundation-v1`
Project is currently a static HTML/CSS/JavaScript trading prototype. The open draft PR #5 adds Supabase email authentication and a server-side Practice trading path.

## Existing Supabase state inspected

Project: `cashflow-gate` (`hddpramylgkqldwdomsa`), region `eu-north-1`, PostgreSQL 17, ACTIVE_HEALTHY.
Existing public tables: `profiles`, `practice_events`, `practice_positions`; all have RLS enabled.
Existing migrations: three Practice V1 migrations.
Existing Edge Function: `practice-trade`, ACTIVE, JWT verification enabled.
Security advisor: no findings at inspection time.
Performance advisor: four RLS init-plan warnings and two currently unused indexes on Practice tables.

The live Supabase database already contains the Practice V1 schema and function even though the corresponding GitHub PR #5 is still open and in draft. Reconcile this migration history before merging or replaying migrations.

## This branch

- Adds an additive SQL foundation for international country/currency configuration, country readiness evidence, exchange-rate snapshots, reserve asset evidence, dual-approval issuance requests, separate CFG and CFGG wallet tables, and ledger foundations.
- Adds architecture documentation and a non-production SQL assertion test.
- All new financial tables enable RLS and revoke anon/authenticated access.
- Wallets default to RESTRICTED; the global platform operational state defaults to DEVELOPMENT.
- The foundation migration hard-disables global real-money enablement and does not implement any money movement API.

## Not implemented yet

- CFG issuance or redemption execution.
- Reserve attestation/reconciliation service and transactionally enforced reserve coverage.
- Double-entry posting/balancing RPC and immutable ledger enforcement.
- Trusted role administration and approval APIs.
- Country readiness dashboard/API.
- Treasury/Reserve dashboard UI.
- Multi-currency wallet API and payment adapters.
- Automated CI execution against an isolated database.

These are deliberately separate increments. No production migration, deployment, merge, or live-money activation was performed.

## Risks and release requirements

1. The exact prior Treasury V1 specification must remain the authority; this schema is only a foundation.
2. The live database migration history and open PR #5 must be reconciled before merging.
3. Test migration on an isolated Supabase database and run SQL assertions.
4. Add role assignment based on trusted server-managed claims / database roles; never trust user-editable metadata.
5. Implement and test 100% reserve coverage and distinct dual approvals in a single controlled transaction before any issuance capability exists.
6. Obtain country-specific legal, licensing, safeguarding, AML/CFT, consumer, tax, data-protection and payment-provider sign-off before LIVE_AUTHORIZED.
7. Configure secrets only in server-side Supabase/Vercel environments; never commit service-role keys.
8. Vercel deployment was rate-limited by the account's daily deployment quota during the inspection of PR #5. No new deployment was attempted.
