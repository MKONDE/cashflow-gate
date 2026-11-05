# CFG Practice Backend — Live Drift Audit (2026-11-05)

## Scope and safety

Read-only inspection of the connected Supabase project `cashflow-gate` (project ref `hddpramylgkqldwdomsa`) and the GitHub branch `feature/auth-practice-backend-v1`.

No SQL was changed or applied. No Edge Function was deployed. No secrets, environment variables, production settings, or customer records were changed. No PR was merged.

## Verified live observations

1. Supabase project status reported `ACTIVE_HEALTHY`, PostgreSQL 17.11.
2. Supabase migration history lists:
   - `20261101134419_cashflow_gate_accounts_practice_v1`
   - `20261101134606_secure_practice_trade_rpc_v1`
   - `20261101134659_restrict_profile_trigger_function_execute_v1`
3. The live `public.practice_events` columns returned by `information_schema.columns` do **not** include `position_id`.
4. The live `practice-trade` Edge Function is ACTIVE, version 1, with JWT verification enabled. Its retrieved source still uses wildcard `Access-Control-Allow-Origin: *`, does not enforce the 16 KiB body limit, and does not check the declared email-confirmation status before invoking the RPC.
5. The GitHub branch contains a newer Edge Function implementation with exact-origin allowlisting via `CFG_ALLOWED_ORIGINS`, JSON/body-size validation, confirmed-email check, and mapped rate-limit responses. That newer source is **not** what is currently deployed to Supabase.
6. The GitHub branch migration `20261101134606_secure_practice_trade_rpc_v1.sql` adds `practice_events.position_id` and returns the original position ID on duplicate idempotency requests. The live schema observation does not show that column, despite the migration version appearing in migration history. This is migration/schema drift and must be reconciled before rollout.
7. Security advisors returned no findings at the time of inspection. Performance advisors reported four RLS init-plan warnings for policies on `profiles`, `practice_events`, and `practice_positions`, plus two currently unused indexes. These are performance observations, not proof of authorization correctness.

## Required remediation before enabling the updated Practice backend

- Reconcile the applied migration history with the actual live schema. Determine why the migration version is recorded while `position_id` is absent. Do not blindly re-run the same migration or alter production to force it.
- Review the exact live RPC definition, grants, constraints, indexes, and RLS policies against the reviewed migration files. Verify that only the server role can execute the write RPC and that browser users can read only their own rows.
- Test the updated migration in an isolated database first, including first buy, duplicate buy, close, duplicate close, wrong-owner close, closed-position close, malformed input, and rate limits.
- Confirm the exact Preview origin(s) and set `CFG_ALLOWED_ORIGINS` in a non-production/test environment before deploying the hardened Edge Function.
- Test signup, email confirmation, sign-in, password reset, account isolation, retry behavior, and CORS from approved and unapproved origins.
- Resolve or explicitly accept the RLS performance warnings after reviewing the current policy definitions. Prefer wrapping stable auth calls as `(select auth.uid())` where semantically equivalent.
- Update the README, which currently describes the project as having no authentication or server-side simulation ledger, so documentation accurately distinguishes the static demo from the optional Practice backend branch.

## Release boundary

This audit does not authorize deployment, migration changes on the live project, PR merge, production release, or any real-money feature. CFG remains Demo / Practice only. Real deposits, withdrawals, investment subscriptions, issuance, redemption, custody, and payouts remain disabled.
