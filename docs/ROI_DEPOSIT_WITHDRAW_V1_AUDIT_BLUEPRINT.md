# Cashflow Gate — ROI Deposit & Withdrawal V1
## Read-only audit findings and additive architecture blueprint

**Repository:** `MKONDE/cashflow-gate`  
**Baseline:** `main` at `b0aeaf61b9d6a65a159093b4ba3a1c9080ee7285`  
**Branch:** `docs/roi-deposit-withdraw-v1-blueprint`  
**Status:** DESIGN ONLY — implementation, migrations, payment activation and production deployment are NOT authorized by this document.

## 1. Owner-approved flow

The intended real-money funding sequence is:

1. Customer initiates a deposit using an approved external payment rail (Mobile Money, bank transfer or crypto, where legally and operationally supported).
2. The payment provider processes the payment.
3. CFG verifies the provider result server-side (signed callback/webhook or trusted provider status query).
4. Only after verified settlement does the server credit the customer's **real CFG Wallet** through the approved CFG ledger.
5. The customer explicitly transfers an available amount from CFG Wallet into an eligible ROI Investment contract.
6. A withdrawal from ROI follows the contract's maturity, liquidity, loss, fee and early-exit rules. A payable withdrawal is settled to CFG Wallet first, then the customer may request an external payout from CFG Wallet through an approved payout rail.

The transfer between CFG Wallet and ROI Investment is an internal, ledger-backed transfer—not a second external deposit. Demo funds never enter this path.

## 2. Repository audit — verified facts

The default-branch tree contains:
- `README.md`, `index.html`, `app.js`, `styles.css`
- `ACCOUNT_BACKEND_PLAN.md`
- `ROI_MINING_POOL_ENGINE_V1_SPEC.md`
- KUZA CAPITAL audit/source-review documents under `docs/`

The checked-in application is a static browser prototype. The README states there is no authentication, server-side ledger, payment integration, live market feed, or real trade execution. The current ROI panel is a hypothetical scenario calculator and explicitly says no real account, deposit, contract, payout or withdrawal is connected.

The account plan recommends Supabase as a possible backend and lists public client configuration variables, but describes a proposal only; it does not prove that a Supabase project, schema, authentication, RLS, server functions or secrets are configured for this repository.

The ROI Mining Pool specification requires server-side payment verification, append-only double-entry ledger, idempotency, audit logs, explicit transaction states, reconciliation, immutable contract snapshots, and strict separation between demo and real ledgers.

The reviewed Gemini/KUZA source contains front-end simulated deposit behavior and legacy plan/rate examples. Those values are reference-only and are NOT approved production offers. In particular, no source rates, balances, sample reserve metrics or animated profit counters may be presented as guaranteed or withdrawable money.

### Audit conclusion

No production-ready real CFG Wallet, payment gateway, ROI contract engine, authoritative financial ledger, or verified deposit/withdrawal service was identified in the repository files inspected. Do not claim any such integration is operational until separately evidenced and tested.

## 3. Product modes — strict separation

### ROI DEMO
- Clearly label all balances, deposits, withdrawals, profits and contracts as `DEMO`.
- Demo Deposit adds only simulated demo units using server-backed demo events when backend is available; before that it may remain local-only and visibly non-authoritative.
- Demo Withdraw simulates a withdrawal from the demo balance only.
- No demo operation calls a payment provider, credits CFG Wallet, creates a real contract, or creates a real ledger entry.
- Never display demo funds as CFG, cash, withdrawable value or real investment principal.

### ROI LIVE
- Disabled by default until all launch gates in section 10 pass.
- Uses authenticated customer identity and server-authoritative balances.
- All amounts are stored in integer minor units for the relevant currency; no floating-point arithmetic for money.
- Every financial operation has a unique reference, idempotency key, actor, timestamp, status history and audit trail.
- No balance is credited from browser-submitted values, screenshots, client redirect parameters or unverified webhook payloads.

## 4. Deposit lifecycle

Suggested states:
`created → awaiting_provider → provider_pending → verified_settled → wallet_credited`
and terminal/error states:
`failed`, `expired`, `cancelled`, `reversed`, `reconciliation_required`.

Controls:
- Create a server-side deposit intent with unique reference and idempotency key.
- Display only provider-generated payment instructions returned by the server.
- Verify provider signature/authenticity and amount, currency, merchant/account, reference and final settlement status.
- Handle duplicate, delayed, out-of-order and replayed callbacks idempotently.
- Never credit on a browser redirect or "payment initiated" response.
- A reversal/chargeback must create compensating ledger entries; never edit or delete posted ledger history.
- Reconcile provider settlement reports against CFG ledger daily and surface mismatches for operations review.

## 5. CFG Wallet → ROI Investment funding

- Customer chooses an available ROI plan and reads the full contract, risks, fees, maturity, early-withdrawal rules and loss allocation.
- Server checks verified account status, jurisdiction eligibility, available wallet balance, plan capacity and applicable limits.
- Customer explicitly accepts a versioned contract.
- Server records an immutable contract snapshot and consent timestamp.
- In one database transaction, post balanced ledger entries moving funds from the customer's available CFG Wallet liability/account to the appropriate ROI investment funding account.
- Do not treat this internal transfer as new external revenue, new CFG issuance, reserve backing or proof of project profit.
- Investment principal remains separately identifiable from realized profit, estimated return, pending payout and withdrawable balance.

## 6. ROI withdrawal and payout lifecycle

Two distinct operations must not be conflated:

**A. ROI Investment → CFG Wallet**
- Customer requests withdrawal/settlement from an eligible contract.
- Server evaluates contract maturity, lock period, liquidity, verified realized project results, losses, fees, pending disputes and early-exit terms.
- Estimated ROI is not withdrawable. Only a verified amount approved under the contract can become payable.
- Use an approval/settlement state machine and post balanced ledger entries. If review is required, show `pending_review`, not success.
- Once settled, credit CFG Wallet and preserve the source contract and ledger references.

**B. CFG Wallet → external payment destination**
- Customer submits a payout request to a verified destination supported by an approved provider.
- Apply authentication/step-up verification, risk checks, account ownership checks, limits and sanctions/compliance checks as applicable.
- Reserve/hold the amount in the ledger while payout is pending; release the hold on failure or complete settlement on verified success.
- Verify provider status server-side. A payout request or provider acceptance is not proof that the recipient received funds.
- Record provider reference, fees, FX rate/source/time where relevant, status changes and reconciliation outcome.

No arbitrary admin balance edits, silent payout approvals, or direct database updates are allowed.

## 7. Proposed data domains (design only; not migrations)

- `payment_providers`: provider, supported country/currency/rail, status, capability and configuration version (never store plaintext secrets here).
- `payment_intents`: user, direction, amount, currency, unique reference, idempotency key, provider, status and timestamps.
- `payment_events`: provider event ID, signature-verification result, payload hash, received time and processing status; restrict/redact sensitive payload data.
- `wallet_accounts`: user, account type, currency and status.
- `ledger_transactions` / `ledger_entries`: immutable balanced double-entry postings with source reference and idempotency protection.
- `roi_plans` / `roi_plan_versions`: reviewed terms, eligibility, capacity and effective dates.
- `roi_contracts` / `roi_contract_acceptances`: immutable accepted terms and customer consent.
- `roi_funding_allocations`: link wallet transfer, contract and project funding.
- `roi_performance_records`: verified project cashflows, costs, losses, realized net results and evidence references.
- `roi_withdrawal_requests`: request, eligibility decision, amount breakdown, approval and settlement status.
- `payout_destinations` / `payout_requests`: verified customer destination and external payout lifecycle.
- `admin_audit_logs`: actor, role, action, before/after references, reason and timestamp.
- `demo_accounts` / `demo_events`: isolated from every real financial table and API path.

All schema changes require a separately reviewed migration, constraints, RLS policies, server-only privileged operations and tests. This document does not authorize migrations.

## 8. Security, accounting and operations controls

- Server-side authorization on every read/write; database RLS is defense in depth, not a replacement for server validation.
- Service-role keys and provider credentials remain server-only; never commit secrets or expose them in browser bundles.
- Append-only double-entry accounting; enforce balanced postings and valid account/currency combinations.
- Unique idempotency keys and provider event IDs; concurrency-safe transactions and replay protection.
- Signed webhook verification, request validation, rate limiting, abuse monitoring and safe error messages.
- Role-based maker/checker approval for sensitive manual adjustments and high-risk payouts.
- Daily reconciliation of provider settlements, wallet liabilities, ROI funding, payout holds and bank/provider statements.
- Backups, restore testing, alerting, incident response and immutable audit retention.
- No admin tool may fabricate profits, alter historical posted entries or rewrite accepted contract terms.

## 9. Provider and country readiness

Mobile Money, bank and crypto are payment-rail categories, not confirmed integrations. No provider is selected or operationally verified by this audit. Each adapter requires:
- named legal provider and supported country/currency;
- merchant onboarding and settlement account confirmation;
- sandbox credentials and provider documentation;
- signed callback/status verification and refund/reversal behavior;
- fee, FX, settlement-time and reconciliation specifications;
- compliance, licensing and data-protection review.

Do not show a rail as `LIVE` until sandbox tests, production onboarding and end-to-end reconciliation are independently verified. Crypto deposits require separate wallet custody, chain confirmation, address attribution, network/asset allowlists and AML risk review; no personal wallet address should be treated as an integrated gateway.

## 10. Launch gates — all required before ROI LIVE

1. Confirm legal entity, jurisdictions, licensing/permissions, investment-offer disclosures and consumer-protection obligations.
2. Approve real investment products, contract wording, risk allocation, project evidence and liquidity/withdrawal rules. Legacy Gemini plan values remain inactive pending explicit approval.
3. Identify the authoritative CFG Wallet and CFG ledger implementation/specification. This repository audit did not find an operational one.
4. Configure and security-review backend, authentication, MFA/step-up, database RLS, server functions and secret management.
5. Complete ledger design review, accounting sign-off, concurrency/idempotency tests and independent reconciliation.
6. Complete payment-provider onboarding and sandbox tests for deposits, callbacks, reversals, payouts and failure paths.
7. Complete penetration testing, access-control tests, operational runbooks, backup/restore and incident response.
8. Obtain explicit owner authorization for migrations, provider activation and production launch.

Until every gate passes, ROI LIVE, real deposits, internal ROI funding, ROI withdrawals and external payouts remain disabled.

## 11. Implementation sequence after separate authorization

1. Preserve current ROI calculator as ROI DEMO; add clearly labelled demo deposit/withdraw simulation only.
2. Confirm authoritative CFG Wallet and ledger interfaces; do not create a parallel wallet.
3. Implement backend authentication and account verification foundation.
4. Implement ledger and transaction state machines with tests.
5. Implement one provider sandbox adapter at a time.
6. Implement wallet-to-ROI contract funding and ROI settlement only after contract/accounting review.
7. Implement wallet external payout and reconciliation.
8. Complete independent security/compliance review before production activation.

## 12. Authorization record

This is a documentation-only architecture blueprint. It does not authorize:
- application code implementation;
- database or Supabase project creation/configuration;
- schema migrations or production data changes;
- payment provider account creation or activation;
- real deposits, investments, ROI accrual, withdrawals or payouts;
- production deployment or merge.

**Non-negotiable:** one authoritative CFG Wallet/ledger, no duplicate financial engine, no mixing demo and real balances, no guaranteed or fabricated ROI, and no changes to the approved CFG Core, Treasury, Reserve or issuance rules.
