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

The workflow then runs the five Treasury SQL catalog/privilege assertion files in `supabase/tests/`.

## Schema cross-check

The foundation migration was read directly from the PR branch and compared with the later migrations. The key issuance request fields used by the approval engine exist in the foundation schema: `request_reference`, `requested_cfg_amount`, `required_reserve_usd`, `financial_controller_id`, `financial_controller_approved_at`, `super_admin_id`, `super_admin_approved_at`, `created_by`, `created_at`, `updated_at`, and `status`.

The reserve migration creates the supply and reconciliation fields referenced by the issuance and hardening migrations, including `issued_total`, `outstanding_supply`, `reserve_eligible_net_usd`, `outstanding_cfg`, and the evidence/encumbrance columns. The hardening migration references the tables introduced by the earlier migrations.

This is a source-level schema cross-check only. PostgreSQL execution is still required to establish that all DDL, triggers, grants, function bodies and assertions are valid together.

## What this first CI slice proves

- The six migration files can be applied in the declared dependency order to a clean PostgreSQL 17 database.
- The existing SQL catalog assertions pass after migration.
- The test database is disposable and isolated from the connected Supabase project.

## What it does not yet prove

- End-to-end transactional behavior for balanced/unbalanced ledger posting, idempotency, immutable posted journals, and CFG/CFGG domain separation.
- Dual-approval happy path and rejection paths with real seeded auth users and reserve evidence.
- Concurrent issuance approval serialization, reserve encumbrance edge cases, or the 1 billion lifetime issuance ceiling under concurrent requests.
- Behavior under the actual Supabase Auth/PostgREST/Edge Runtime stack.
- Independent tamper resistance against database owner or migration-owner compromise.

These require a second integration-test slice using seeded synthetic identities and synthetic evidence in this disposable database. Synthetic assets must never be treated as real reserve backing.

## Current execution status

The workflow definition and bootstrap fixture are committed to the Treasury implementation branch. At the time of this document update, no completed GitHub Actions run has been observed, so the migration chain is **not yet marked as passed**. Do not merge PR #7 or apply any Treasury migration to the connected Supabase database based on the presence of this harness alone.

## Next gate

Wait for the GitHub Actions run. If it fails, fix the first concrete migration or assertion failure and rerun the same disposable job. Only after a clean migration pass should transactional integration tests be added. No paid Supabase branch is needed for this first test stage.
