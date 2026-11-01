# CFG Treasury Engine V1 — Implementation Progress

**Branch:** `feat/cfg-treasury-engine-implementation-v1`  
**Base:** `feat/cfg-international-foundation-v1`  
**Status:** First additive implementation slice committed; review and isolated execution still required.

## Completed in this slice

1. Added `20261102100000_cfg_operational_state_compatibility_v1.sql`.
   - Aligns platform and country lifecycle states to DEVELOPMENT, INTERNAL_TEST, COMPLIANCE_REVIEW and LIVE_AUTHORIZED.
   - Maps the legacy COUNTRY_READINESS state to COMPLIANCE_REVIEW.
   - Preserves all detailed country readiness evidence records and the existing 14-check/two-approver launch gate.
   - Adds explicit V1 hard-disabled real-money constraints.

2. Removed JavaScript floating-point aggregation from `cfg-treasury-read`.
   - Monetary and CFG totals are summed as exact 8-decimal fixed-point BigInt values.
   - API returns decimal totals as strings.
   - No money or supply quantity is converted to JavaScript Number for arithmetic.

3. Added Deno unit tests for exact decimal aggregation and SQL assertions for operational-state compatibility.

## Important validation boundary

- These changes are committed to the feature branch only.
- No Treasury migration has been applied to the connected Supabase project.
- No paid Supabase development branch was created.
- Deno unit tests and SQL assertions have been authored but have **not** been executed in an isolated database/runtime in this work session. They must not be described as passed.
- Existing Practice database and Trading UI remain untouched.
- No PR has been merged; no production deployment or real-money capability has been enabled.

## Next implementation slice

Implement ledger posting integrity as an additive migration: currency-consistent balanced debit/credit totals, locked posting state transitions, immutable posted entries, idempotency, and reversal-only correction. Keep all write paths disabled from public/browser roles and do not expose an execution API until the database invariants and tests are complete.
