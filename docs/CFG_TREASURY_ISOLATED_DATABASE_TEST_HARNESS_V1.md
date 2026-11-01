# CFG Treasury Isolated Database Test Harness V1

## Safety boundary

This harness runs against a disposable PostgreSQL 17 service created for one GitHub Actions job. It does not connect to the Cashflow Gate Supabase project, does not create a paid Supabase branch, and does not deploy functions or apply migrations to production.

The CI bootstrap creates only the minimum Supabase-compatible roles and `auth.users` table needed to validate the Treasury migration chain's foreign keys. It is not a replacement for a full Supabase local stack or a Supabase staging project.

## Migration chain checked

1. `20261101150000_cfg_international_foundation_v1.sql`
2. `20261102100000_cfg_operational_state_compatibility_v1.sql`
3. `20261102110000_cfg_ledger_integrity_v1.sql`
4. `20261102120000_cfg_reserve_reconciliation_v1.sql`
5. `20261102130000_cfg_issuance_supply_control_v1.sql`
6. `20261102140000_cfg_treasury_security_audit_hardening_v1.sql`

The workflow runs the five Treasury SQL catalog/privilege assertion files and the transactional integration test `supabase/tests/cfg_treasury_transactional_integration_v1.sql`.

## Schema cross-check

The foundation migration was read directly from the PR branch and compared with the later migrations. The key issuance request fields used by the approval engine exist in the foundation schema: `request_reference`, `requested_cfg_amount`, `required_reserve_usd`, `financial_controller_id`, `financial_controller_approved_at`, `super_admin_id`, `super_admin_approved_at`, `created_by`, `created_at`, `updated_at`, and `status`.

The reserve migration creates the supply and reconciliation fields referenced by the issuance and hardening migrations, including `issued_total`, `outstanding_supply`, `reserve_eligible_net_usd`, `outstanding_cfg`, and the evidence/encumbrance columns. The hardening migration references the tables introduced by the earlier migrations.

This is a source-level schema cross-check only. PostgreSQL execution is still required to establish that all DDL, triggers, grants, function bodies and assertions are valid together.

## Transactional integration coverage added

The new disposable-database test seeds synthetic auth identities and synthetic fixtures, then checks:

- Eligible company reserve is counted while `SYNTHETIC_TEST` reserve is excluded.
- Distinct active Financial Controller and Super Admin approvals complete the request workflow.
- Same-person dual approval is rejected.
- Approval does not mint CFG or change supply counters; execution remains hard-disabled.
- Balanced reserve-reconciliation journals post idempotently.
- Posted transaction and entry rows are immutable.
- Unbalanced journals remain DRAFT after posting is rejected.
- Ordinary deposit posting remains blocked outside `LIVE_AUTHORIZED`.
- Treasury audit events are written.

This is an initial transactional slice, not exhaustive coverage. It does not yet prove concurrent approval serialization, the lifetime supply ceiling under concurrency, all CFG/CFGG domain separation paths, real Supabase Auth/PostgREST/Edge behavior, or independent tamper resistance against database-owner compromise.

## Current execution status

The first clean PostgreSQL 17 migration-chain run passed: all six migrations and all five catalog/privilege assertion files completed successfully in GitHub Actions run `41363782567`. A transactional test file and workflow step have now been committed; their new CI result is pending. The connected Supabase project has not been touched.

Do not merge PR #7 or apply any Treasury migration to the connected Supabase database based on the first migration pass alone.

## Next gate

Review the new transactional test run. If it fails, fix the first concrete failure and rerun the disposable job. No paid Supabase branch is needed for this stage.
