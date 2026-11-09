# CFG × Money Flow Agency (MFA) — Agent Payment Channel V1 Readiness

**Status:** ADDITIVE PARTNER-INTEGRATION BLUEPRINT / PREPARATION ONLY  
**CFG repository:** MKONDE/cashflow-gate  
**CFG work branch:** feature/cfg-real-ai-study-assistant-v1  
**MFA repository:** MKONDE/Money-flow-agency  
**MFA work branch:** feature/agent-trust-capital-commission-v1

## 1. Decision

Money Flow Agency (MFA) is the first planned agent-network partner channel for customers who need to fund or pay through Cashflow Gate (CFG). Other payment rails/providers may follow later.

MFA remains an independent platform and CFG remains the system of record for CFG balances and financial ledger entries. This is a partner connection, not a merger of applications, databases, authentication, wallets or ledgers.

## 2. Hard separation rules

- Do not connect to, read or write MFA's database from CFG.
- Do not connect to, read or write CFG's database, wallet or ledger from MFA.
- No shared Supabase project, service-role key, password, session or internal database credentials.
- Exchange only narrowly scoped, authenticated partner API messages.
- CFG alone validates payment settlement and creates CFG ledger entries.
- MFA may manage agents, agent status, onboarding evidence, transaction tracking references and partner-side commission calculation snapshots.
- MFA must never directly credit/debit CFG balances or represent a pending payment as settled.
- Preserve CFG Core, CFG Wallet, Treasury, Reserve, Issuance, ROI Investment 2 and existing locked rules.

## 3. Planned customer flow (future live activation, not enabled now)

1. Customer selects a CFG funding/payment request and chooses the MFA Agent Network channel.
2. CFG creates a unique, expiring payment-intent reference with amount, currency, purpose, customer reference and idempotency key. No CFG balance changes at this stage.
3. CFG requests available verified/active MFA agents for the required country, region, currency and supported payment network through a scoped partner API.
4. Customer selects an eligible agent and receives payment instructions. The customer pays through an approved external payment method to the agent/provider account according to signed commercial and regulatory arrangements.
5. Agent/MFA submits a payment-evidence reference and status update. This is evidence only; it is not proof of settlement by itself.
6. CFG independently verifies settlement using an approved provider confirmation, bank/mobile-money statement reconciliation or authorized operations review.
7. Only after CFG confirms settlement does CFG's own backend post the idempotent double-entry ledger transaction and update the customer's CFG balance.
8. CFG sends a signed status callback to MFA. MFA records the status and calculates any eligible commission snapshot under its own rules. Commission remains non-payable until separately approved.
9. Reversals, refunds, disputes and duplicate callbacks are handled through explicit state transitions and immutable audit events. Never silently overwrite a settled record.

## 4. Partner API contract — design target

Proposed scoped endpoints (names are provisional and must be agreed before implementation):
- CFG → MFA: list eligible agents for country/currency/network/service.
- CFG → MFA: create agent-assistance request using an opaque payment-intent reference.
- MFA → CFG: submit agent assignment and evidence reference.
- MFA → CFG: request status lookup by opaque reference.
- CFG → MFA: signed payment status callback (PENDING, EVIDENCE_SUBMITTED, VERIFIED_SETTLED, REJECTED, EXPIRED, DISPUTED, REVERSED).

Security requirements:
- TLS only; server-to-server credentials held in secret stores.
- HMAC or asymmetric request signatures with timestamp, nonce and key ID.
- Strict timestamp window, replay protection, idempotency keys and unique partner event IDs.
- Least-privilege scopes, per-partner rate limits, payload validation and request-size limits.
- Key rotation, audit logs, alerting and revocation procedure.
- Never send customer passwords, full identity documents, bank credentials, service-role keys or full internal ledger data to MFA.
- Do not put secrets in browser code, Git, URLs or client-side storage.

## 5. Payment state and ledger authority

MFA agent statuses and evidence are operational metadata, not financial settlement. A customer receipt, screenshot, agent click or MFA status alone must not credit CFG. CFG's payment-verification service is the sole authority to post CFG ledger entries.

All financial writes must be idempotent and append-only with immutable source references. Amount, currency, FX quote (if any), fees, net settlement and fee-rule snapshot must be explicit. No silent FX conversion or denomination substitution. CFG remains the internal unit where approved; external payment currency remains its native currency in the settlement record.

## 6. MFA agent readiness gates

Before an agent is exposed as eligible for this CFG channel:
- MFA account/application is approved and agent is verified/active.
- Supported country, region, currency, network and service are configured.
- Owner-approved currency-specific capital tier is configured.
- Existing MFA CFG Supply activation gate (minimum verified USD 50 equivalent) is reconciled with an authoritative CFG source/API; until then it is manual documentary verification only and must not be described as a live synced balance.
- Guarantee references and capital/float declarations are separately reviewed; declarations are not funds held by MFA.
- Agent contact/public listing consent and customer complaint/dispute route are present.
- Partner agreement, agent terms, settlement/reconciliation procedure, fraud controls and country-specific legal/compliance approvals are completed.

## 7. Current implementation truth

The MFA branch currently documents an independent agent network, agent onboarding, trust/capital/guarantee workflows, tracking-only transactions and non-payable commission calculations. Its README explicitly states partner API credentials, signed webhooks and provider integration are not implemented. All MFA tracking transactions are constrained to simulation_only=true; escrow funds_held=false and release_executed=false; commissions payable=false.

The CFG repository remains a frontend/demo prototype without an authoritative production wallet ledger or live payment processor. Therefore this document is readiness architecture only. No end-to-end live payment channel exists today.

## 8. Explicitly not authorized by this document

- No live customer deposits, payment execution, CFG balance credit/debit, withdrawals, transfers, custody, escrow holding/release or agent float collection.
- No automatic agent commission payout.
- No database migrations or changes to either project's live database.
- No provider credentials, partner secrets or production webhooks.
- No merge to main or production deployment.
- No changes to CFG Core, CFG Wallet, Treasury, Reserve, Issuance, ROI Investment 2, or existing quiz/game rules.

## 9. Acceptance gates before pilot

1. Both repositories have reviewed partner API specifications and matching contract tests.
2. Isolated MFA staging database schema drift is reconciled without dropping or overwriting existing data.
3. MFA migrations are applied only to isolated staging and smoke/RLS/adversarial tests pass.
4. CFG has a server-authoritative payment-intent and settlement-verification/ledger path reviewed against its locked financial architecture.
5. Signed webhook replay, duplicate, out-of-order, timeout, reversal and dispute tests pass.
6. End-to-end pilot uses test/sandbox payment rails and test accounts only.
7. Legal, licensing, AML/KYC, consumer protection, data privacy, agent agreement and country approvals are documented.
8. Owner separately authorizes any live-money pilot, production release and provider activation.

**Release principle:** MFA is the first planned agent-network channel for CFG, but readiness work must not be confused with live payment activation.
