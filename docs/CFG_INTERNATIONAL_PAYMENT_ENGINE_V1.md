# CFG International Payment Engine V1 — Implementation Notes

**Repository:** `MKONDE/cashflow-gate`  
**Feature branch:** `feature/cfg-international-payment-engine-v1`  
**Base:** `feat/cfg-treasury-engine-implementation-v1`  
**Release posture:** additive source changes; sandbox route preview only; no production deployment or live-money activation.

## Existing approved foundations retained

This branch builds on the existing Treasury implementation branch rather than duplicating its work. The parent already contains the CFG ledger integrity, reserve reconciliation, issuance/supply controls, security hardening, dual-approval workflow, and isolated PostgreSQL 17 CI harness.

The following invariants remain unchanged:

- CFG authorized supply ceiling: 1,000,000,000.
- CFG reference value: USD 1.
- 100% verified eligible reserve backing.
- Treasury and Reserve V1 controls and distinct approval responsibilities.
- CFG and CFGG remain separate wallet/accounting domains.
- KUZA CAPITAL remains an additive CFG module.
- MFA, Maharoos Mini and Jakay Pesa remain independent.
- Global real-money enablement remains hard-disabled.

## Additions in this branch

### 1. Double-entry payment settlement gate

The existing ledger integrity engine remains the source of truth for postings. The new payment schema links each payment intent to a CFG Wallet and a ledger transaction. A payment intent cannot transition to `SUCCEEDED` unless:

1. A provider reference and selected provider are present.
2. The linked ledger transaction is `POSTED`.
3. The ledger journal type and country match the payment direction and country.
4. The CFG Wallet debit/credit leg exactly equals the payment amount and currency.
5. A matching provider settlement event has a verified signature and has been processed.

This prevents UI/API status updates from declaring success without both provider settlement evidence and the corresponding posted ledger journal. No client balance is written.

### 2. Intelligent provider fallback safety

The provider registry records country, rail, currency, direction, priority, sandbox/live environment, idempotency support, status-lookup support, and the *name* of a server-side credential secret. It does not store provider secrets.

The fallback safety predicate permits a next provider only after:

- A failure before the request was dispatched; or
- A provider adapter has positively classified the response as a final decline with no charge accepted.

It blocks fallback after a timeout, connection loss after dispatch, accepted/pending response, ambiguous status, or settlement. The same payment intent and idempotency key must be retained across any approved retry. Database triggers enforce sequential attempts, provider capability checks, matching intent identity, and the country-compliance sandbox route. A status lookup/reconciliation is required before retrying an ambiguous payment. Payment intent terms are immutable and terminal successful/cancelled intents cannot be changed or deleted.

The Deno helper tests cover the fallback classifications and deterministic priority ordering. No provider has been contacted by this feature.

### 3. Country-specific regulatory and payment configuration

The additive country tables store:
- Country and rail/currency/direction policy.
- Transaction minimum/maximum and daily limits.
- Customer verification and sanctions-screening requirements.
- Tax policy metadata, disclosure version and data-residency region.
- Versioned approval reference, approving authority and effective dates.
- Evidence-backed, country-specific compliance requirements, verifier and expiry.

Sandbox route preview returns only providers configured for an `INTERNAL_TEST` country/platform, with a disabled-by-default country policy and current verified mandatory compliance evidence. Live provider routes are intentionally not returned in V1 because the global real-money hard stop remains active.

### 4. Restricted route-preview Edge Function

`supabase/functions/cfg-payment-route-preview/index.ts` is an authenticated, verified-email, Treasury-role-only route preview. It validates a small request schema, uses the server-side service role, and returns ordered sandbox candidates only.

It does not create payment intents, call provider endpoints, initiate deposits or withdrawals, mark transactions successful, post ledger entries, or move money. JWT verification must remain enabled when deployed. Configure `CFG_ALLOWED_ORIGINS` with the exact approved application origins; leave the function undeployed until the origin list and role assignments are reviewed.

## Files added or updated

- `supabase/migrations/20261120114000_cfg_international_payment_engine_v1.sql`
- `supabase/tests/cfg_international_payment_engine_v1.sql`
- `supabase/functions/_shared/payment_fallback.ts`
- `supabase/functions/_shared/payment_fallback_test.ts`
- `supabase/functions/cfg-payment-route-preview/index.ts`
- `.github/workflows/cfg-treasury-isolated-db.yml` — adds the feature branch, migration, SQL assertions, Deno tests and type-check to isolated CI.
- `docs/CFG_INTERNATIONAL_PAYMENT_ENGINE_V1.md`

No existing application UI, Treasury V1, Reserve V1, issuance logic, KUZA CAPITAL, MFA, or production configuration was intentionally changed.

## Exact outstanding requirements before provider integration

For each launch country and rail, the project must obtain and configure:

1. Provider legal entity, country coverage, approved merchant/business account, sandbox and production API documentation.
2. Server-side credentials, webhook signing secret, credential rotation contact, and provider IP/origin requirements. Store secret values only in Supabase Edge Function secrets; store only the secret-name reference in the database.
3. Provider idempotency semantics, transaction-status lookup API, final-decline semantics, webhook event catalogue, signature verification scheme, and settlement/reconciliation reports.
4. Provider limits, supported currencies, fees, settlement times, refund/chargeback/dispute flows, and operational escalation contacts.
5. Country-specific legal opinion and any required payment-service, money-transmission, e-money, remittance, custody or other licence/authorization.
6. AML/CFT and sanctions screening policy, KYC tiers, safeguarding/customer-funds treatment, complaints and consumer disclosures, tax/reporting duties, privacy/data-localization requirements, and regulator reporting process.
7. Written compliance approval and evidence for every mandatory country requirement, with expiry monitoring and a two-person launch authorization process.

No generic HTTP adapter can safely substitute for provider-specific contracts. Until the above exists, adapters remain unconfigured and live payment execution remains disabled.

## Verification and release status

- Source and SQL assertion files are committed to this feature branch.
- Deno unit tests, Edge Function type-check and PostgreSQL 17 migration/test execution are wired into the existing isolated CI workflow.
- The connected Supabase project was listed as `ACTIVE_HEALTHY`, but read-only database table/migration/advisor requests returned hibernation/connection-timeout errors during this run. No schema was applied and no database test is claimed.
- The SQL migration is source only. It has not been applied to the connected Supabase project.
- No payment provider credentials, provider approval, country regulatory authorization or verified webhook secret were supplied.
- No Edge Function deployment, Vercel deployment, merge, or production release was performed.

**Readiness conclusion:** architecture source is prepared for review and isolated CI. The international payment engine is **not production-ready** and must not be represented as accepting or settling real payments until the database migration, provider-specific adapters, verified webhooks, country approvals, operational reconciliation and security review are complete.
