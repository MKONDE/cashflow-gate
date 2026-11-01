# CFG Treasury Implementation Progress V1

## Completed branch slices
1. Operational state compatibility and exact-decimal Treasury read aggregation.
2. Ledger integrity: balanced double-entry posting, serialized/idempotent posting, immutable posted entries and service-role-only posting.
3. Reserve reconciliation: evidence provenance/freshness, synthetic reserve exclusion, encumbrance deduction, separate supply counters, immutable snapshots and service-role-only execution.

## Safety boundary
- Operational states include DEVELOPMENT, INTERNAL_TEST, COMPLIANCE_REVIEW and LIVE_AUTHORIZED.
- Real-money enablement remains hard-disabled.
- No deposits, withdrawals, issuance, redemption, customer transfers, agent float or investment payouts are enabled.
- No Treasury migration has been applied to connected Supabase.
- No paid Supabase branch created.
- PR #7 remains Draft and unmerged; no production deployment.

## Verification
SQL catalog assertions are authored but not executed. Isolated-database transactional integration testing is required before merge or migration application. Reserve policy assumptions are documented in docs/CFG_RESERVE_RECONCILIATION_ENGINE_V1.md.
