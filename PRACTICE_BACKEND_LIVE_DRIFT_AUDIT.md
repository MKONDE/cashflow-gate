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


## Follow-up reconciliation evidence (2026-11-05)

A second read-only pass checked the migration ledger, live RPC definition, grants, constraints, indexes, policies, and triggers:

- The live `supabase_migrations.schema_migrations` table confirms version `20261101134606` is recorded as `secure_practice_trade_rpc_v1`.
- The live `record_practice_trade(uuid, text, text, numeric, numeric, uuid, text)` definition does not use `practice_events.position_id`, does not write that field, and its duplicate response returns only `event_id`; it also lacks the rate-limit counters present in the current branch migration. This confirms the recorded migration version and current branch migration contents do not describe the same effective schema/function state. The precise historical cause (for example, a migration file edited after its application versus a different SQL payload applied under the same version) cannot be proven from the read-only evidence gathered so far.
- Live constraints include the unique key `(user_id, idempotency_key)`, but no position foreign key exists on `practice_events` because the column itself is absent.
- Live RLS policies are owner-scoped SELECT for `profiles`, `practice_events`, and `practice_positions`; `profiles` also has owner-scoped UPDATE with both `USING` and `WITH CHECK`. No INSERT/UPDATE/DELETE policies were found for practice tables.
- Table grants show `authenticated` has SELECT only on those three tables; `service_role` has table privileges. No `anon` table grants were returned for those tables.
- Routine grants for `record_practice_trade` show EXECUTE for `service_role` and `postgres`; no `PUBLIC`, `anon`, or `authenticated` EXECUTE grant was returned. The routine is SECURITY DEFINER, so the server-side Edge Function's identity validation remains essential.
- No non-internal triggers were returned for the three inspected public tables.
- Live RLS policy predicates use `auth.uid() = user_id` / `auth.uid() = id`. This matches the ownership intent but explains the advisor's init-plan performance warnings; any policy rewrite must be tested, not blindly applied.
- `list_branches` returned no existing Supabase development branches. Creating an isolated branch may incur recurring compute cost, so no branch was created and no cost-bearing operation was attempted.

## Updated conclusion

The issue is not merely a missing column: the live RPC body also differs from the current migration file, including the duplicate response and rate-limit behavior. Treat the live project as a distinct deployed revision until a clean, isolated migration rehearsal proves a safe reconciliation path. Do not edit the already-recorded migration version in place, replay it blindly, or patch the live database directly.
