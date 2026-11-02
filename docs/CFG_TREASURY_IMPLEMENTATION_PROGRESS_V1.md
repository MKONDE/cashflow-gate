# CFG Treasury Implementation Progress V1

## Completed branch slices
1. Operational state compatibility and exact-decimal Treasury read aggregation.
2. Ledger integrity: balanced double-entry posting, serialized/idempotent posting, immutable posted entries and service-role-only posting.
3. Reserve reconciliation: evidence provenance/freshness, synthetic reserve exclusion, encumbrance deduction, separate supply counters, immutable snapshots and service-role-only execution.
4. Issuance & Supply Control: DRAFT requests, Controller then distinct Super Admin approvals, reserve and 1B cap checks, request immutability, expiring reservations and an explicit issuance execution hard-stop.
5. Treasury Admin Dashboard: authenticated read-only supply, reserve, reconciliation, issuance and country-readiness panels, plus metadata-only display of the latest 100 audit events.
6. Security & Audit Hardening: append-only audit events, reserve evidence no-delete rule, immutable reconciliation snapshots, and SELECT-only service-role access to supply counters and reconciliation snapshots. Reconciliation is performed through a controlled SECURITY DEFINER function.

## Safety boundary
- Operational states include DEVELOPMENT, INTERNAL_TEST, COMPLIANCE_REVIEW and LIVE_AUTHORIZED.
- Real-money enablement remains hard-disabled.
- No deposits, withdrawals, issuance execution, redemption, customer transfers, agent float or investment payouts are enabled.
- No Treasury migration has been applied to connected Supabase.
- Supply counters remain frozen pending a separately reviewed issuance/redemption writer. The database audit log is not independently tamper-proof against database-owner compromise.
- No paid Supabase branch created.
- PR #7 remains Draft and unmerged; no production deployment.

## Verification
SQL catalog/privilege assertions are authored but not executed. Deno checks, browser smoke tests and isolated-database transactional integration testing are required before merge or migration application. See docs/CFG_ISSUANCE_SUPPLY_CONTROL_ENGINE_V1.md and docs/CFG_TREASURY_SECURITY_AUDIT_HARDENING_V1.md.
