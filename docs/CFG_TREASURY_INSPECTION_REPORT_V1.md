# CFG Treasury, Reserve & Issuance Engine V1 — Inspection Report

**Repository:** `MKONDE/cashflow-gate`  
**Inspection date:** 2026-11-01  
**Inspected default branch:** `main`  
**Inspection baseline:** `feat/cfg-international-foundation-v1` (open Draft PR #6)  
**Supabase project:** `cashflow-gate` (`hddpramylgkqldwdomsa`, PostgreSQL 17, eu-north-1)

## Executive summary

The repository is currently a small static HTML/CSS/JavaScript Trading prototype on `main`. A separate open Draft PR #5 contains the Practice authentication and server-side simulation backend. The Supabase project already has the three Practice V1 tables, three Practice migrations and an active JWT-protected `practice-trade` Edge Function, despite PR #5 remaining unmerged.

A separate open Draft PR #6 contains an additive CFG international/Treasury foundation: country and currency records, reserve evidence, dual-approval request metadata, distinct CFG/CFGG wallet tables, a ledger schema foundation, a read-only Treasury Edge Function, a read-only dashboard and SQL assertions. PR #6 has not been merged and its migration has not been applied to the connected Supabase database.

The existing foundation should be reused. The next work must add controlled server-side ledger posting, reserve reconciliation, issuance execution, wallet/agent float workflows, redemption accounting and immutable audit history. No real-money capability is to be activated.

## 1. What already exists

### GitHub repository

- Private repository: `MKONDE/cashflow-gate`.
- Default branch: `main`.
- `main` contains `index.html`, `app.js`, `styles.css`, `README.md`, `ACCOUNT_BACKEND_PLAN.md` and `ROI_MINING_POOL_ENGINE_V1_SPEC.md`.
- Approved Treasury specification exists on `feat/cfg-treasury-reserve-issuance-v1` at `docs/finance/CFG_TREASURY_RESERVE_ISSUANCE_ENGINE_V1.md`.
- Draft PR #5: Practice backend, head branch `feature/auth-practice-backend-v1`.
- Draft PR #6: CFG international/Treasury foundation, head branch `feat/cfg-international-foundation-v1`.
- Other branches include Trading UI, practice persistence, ROI duration and documentation work.
- GitHub API inspection does not expose a developer's local uncommitted working-tree changes. No claim is made about local files that are not committed/pushed.

### Connected Supabase database

Live project metadata reports PostgreSQL 17 and ACTIVE_HEALTHY.

Existing public tables:
- `profiles`
- `practice_events`
- `practice_positions`

Existing migration history:
- `20261101134419_cashflow_gate_accounts_practice_v1`
- `20261101134606_secure_practice_trade_rpc_v1`
- `20261101134659_restrict_profile_trigger_function_execute_v1`

Existing Edge Function:
- `practice-trade`, ACTIVE, JWT verification enabled.

Existing public database functions:
- `handle_new_user_profile`
- `record_practice_trade`

Existing RLS policies restrict profile and Practice reads/updates to the signed-in user's own records. All three existing tables have RLS enabled.

### Treasury foundation in Draft PR #6

The PR adds:
- `cfg_platform_control`, currencies, countries and country readiness records.
- Exchange-rate snapshots and reserve asset evidence.
- Server-managed Treasury role registry.
- Issuance request and dual-approval metadata.
- Separate `cfg_wallets` and `cfgg_wallets`.
- Ledger account, transaction and entry schema foundations.
- A country live-readiness guard and an issuance-approval guard.
- JWT-protected read-only `cfg-treasury-read` Edge Function.
- Read-only `admin/treasury.html` and `admin/treasury.js`.
- Architecture/implementation reports and an initial SQL assertion file.

The foundation defaults the platform to DEVELOPMENT, wallets to RESTRICTED, and hard-disables real-money enablement. Its financial tables enable RLS and revoke browser-role table privileges.

## 2. What can be reused

1. Existing Supabase project and authentication foundation; do not create another project.
2. Existing Practice tables, RPC and Edge Function; do not alter Practice trading behavior as part of Treasury work.
3. Treasury foundation schema, country/currency model, reserve evidence model, role registry and separate CFG/CFGG wallet domains from PR #6.
4. Treasury read-only Edge Function and dashboard as the initial administrative read surface.
5. Existing approved master specification on `feat/cfg-treasury-reserve-issuance-v1`.

## 3. Missing implementation

The current Treasury foundation does not yet implement:
- Atomic double-entry posting and a database-enforced debit/credit balancing invariant.
- Append-only ledger enforcement and reversal-only correction workflow.
- Independently verified reserve intake, reserve eligibility lifecycle and reconciliation.
- A complete issued/outstanding/encumbered supply counter updated transactionally.
- Issuance execution that atomically validates supply, reserve coverage, two distinct approvals and idempotency before posting.
- Trusted role assignment and authenticated approval APIs.
- Customer CFG balance APIs derived only from posted ledger entries.
- Agent float allocation/transfer/settlement workflows that never mint supply.
- Redemption reservation, payout reconciliation and burn/redemption accounting.
- Immutable financial audit events.
- Explicit synthetic-test versus independently verified reserve segregation.
- Automated tests for concurrency, duplicate execution, self-approval, ledger balancing, wallet isolation and redemption accounting.
- End-to-end preview evidence and CI execution.

## 4. Conflicts and risks

1. **Migration ordering:** Practice migrations already exist in the connected database and are timestamped before the Treasury foundation migration. Reconcile Git history and the live migration history before any migration replay or merge.
2. **Independent PR branches:** PR #5 and PR #6 are separate Draft PRs. PR #6's read-only dashboard depends on the public Supabase configuration introduced by PR #5. Do not merge either automatically.
3. **Operational state vocabulary:** The approved current directive requires DEVELOPMENT, INTERNAL_TEST, COMPLIANCE_REVIEW and LIVE_AUTHORIZED. PR #6 currently uses COUNTRY_READINESS instead of COMPLIANCE_REVIEW. Add a reviewed compatibility migration; do not silently drop country-readiness evidence or its gate.
4. **Numeric precision:** `cfg-treasury-read` currently converts database numeric values to JavaScript `Number` for reserve/request totals. Replace monetary aggregation with PostgreSQL exact numeric aggregation and serialize exact decimal strings; avoid floating-point financial calculations in the browser.
5. **Supply semantics:** The foundation approval guard totals approved requests and checks the 1-billion ceiling, but it is not an issued/outstanding supply engine and does not account for completed issuance, redemption or outstanding obligations. Implement separate authorized, issued, outstanding, reserved/encumbered and redeemed counters under transactional locking.
6. **Ledger integrity:** Ledger tables are schema only. There is no atomic posting API or database balancing enforcement yet. No wallet balance must be written directly.
7. **Approval enforcement:** The schema stores two distinct approver IDs, but a complete server-only approval workflow, identity binding and immutable approval events are still missing.
8. **Synthetic data:** Reserve records need an explicit environment/source classification so synthetic test balances cannot be mistaken for verified company assets or counted toward live reserve coverage.
9. **Current advisor findings:** Security advisor returned no findings for the current Practice-only database. Performance advisor reported four existing RLS init-plan warnings on Practice policies and two unused Practice indexes. These are existing findings, not Treasury migration findings.
10. **Local changes:** GitHub API can inspect committed remote refs but cannot establish whether a developer has uncommitted local changes.

## 5. Proposed additive migrations

Do not apply any migration during this inspection. After reviewing PR #6 in an isolated development database, add migrations after its timestamp, with names generated using the Supabase CLI workflow:

1. `cfg_operational_state_compatibility_v1` — align platform state vocabulary with the current directive while preserving country-readiness evidence and hard-disabled live controls.
2. `cfg_ledger_integrity_v1` — account normal-balance rules, atomic posting function, exact numeric balancing checks, idempotency and reversal-only correction.
3. `cfg_reserve_reconciliation_v1` — reserve evidence lifecycle, synthetic/verified segregation, approved valuation snapshots and reconciliation records.
4. `cfg_supply_issuance_control_v1` — serialized supply counters and issuance request state transitions with distinct approvals and 100% eligible reserve coverage.
5. `cfg_customer_wallet_agent_float_v1` — ledger-derived customer balances and controlled agent float transfers with no change to total issued supply.
6. `cfg_redemption_audit_v1` — redemption reservation, settlement/reconciliation records, burn accounting and immutable financial audit events.

Each migration must be additive, independently testable and reviewed before application. Do not replay the Practice migrations.

## 6. Recommended implementation sequence

1. Preserve PR #5 and PR #6 unchanged; reconcile their migration dependency and review state.
2. Build on a dedicated feature branch based on the Treasury foundation branch; do not merge to main.
3. Add state compatibility and exact-decimal reporting corrections.
4. Implement ledger integrity and tests before any wallet write path.
5. Implement reserve reconciliation and explicit synthetic/verified segregation.
6. Implement issuance workflow and concurrency/idempotency tests.
7. Implement customer wallet and agent float APIs.
8. Implement redemption, audit history and reconciliation.
9. Run isolated database tests, security/performance advisors and preview acceptance checks.
10. Produce a deployment-readiness report. No production migration, merge, deployment or LIVE_AUTHORIZED transition without separate explicit approval and independently verified legal/financial/operational sign-off.

## 7. Current safety status

- No Treasury migration was applied to the connected Supabase database during inspection.
- No live issuance, deposit, redemption, payout, custody or payment API was enabled.
- No service-role key was exposed or committed.
- No Trading UI, MFA, Maharoos Mini or Jakay Pesa code/database was modified.
- No pull request was merged and no production deployment was performed.

**Inspection outcome:** The existing Treasury foundation is reusable but is not a complete issuance/ledger engine. Continue incrementally from the foundation; do not claim issuance, ledger, reserve reconciliation or wallet functionality complete until implementation and automated tests pass.
