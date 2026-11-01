# Cashflow Gate — International Architecture & Treasury Foundation V1

## Scope and invariants

This is an additive foundation for the standalone `MKONDE/cashflow-gate` project. It does not connect to MFA, Maharoos Mini, or Jakay Pesa.

The approved CFG Treasury rules are immutable:
- Authorized CFG supply ceiling: 1,000,000,000 CFG.
- Reference value: 1 CFG = USD 1.
- Every issued CFG must be backed 100% by verified eligible reserve assets.
- Issuance is staged and requires distinct Financial Controller and Super Admin approvals.
- Investment capital and third-party funds are excluded from eligible CFG reserve.
- No direct customer balance writes; balances are derived from double-entry ledger entries.
- CFG Wallet and CFGG Wallet are separate data domains.
- Agent-to-agent transfers are transfers, not issuance.

## Operational state model

Platform and each country use exactly:
- DEVELOPMENT
- INTERNAL_TEST
- COUNTRY_READINESS
- LIVE_AUTHORIZED

Every country defaults to DEVELOPMENT. Every wallet defaults to RESTRICTED. The foundation migration has no public/client grants and no real-money API. Country LIVE_AUTHORIZED is not a statement that a country has obtained a licence; legal evidence and authorization must be independently verified.

Real customer deposits, withdrawals, issuance, redemptions, investment payouts, custody and payment services remain disabled until country-specific legal, licensing, safeguarding, AML/CFT, consumer-protection, tax, data-protection, payment-provider and operational requirements have been verified and formally approved.

International incorporation, foreign hosting, reserve history, or technical readiness cannot replace local authorization.

## International data model

- `cfg_countries`: country-specific operational state and local currency.
- `cfg_currencies`: supported currency definitions and precision.
- `cfg_country_readiness_checks`: evidence-backed country checklist with expiry.
- `cfg_country_live_authorizations`: distinct controller and super-admin identities.
- `cfg_exchange_rate_snapshots`: immutable, timestamped exchange-rate observations.
- `cfg_reserve_assets`: verified reserve assets, funding-source classification and USD valuation evidence.
- `cfg_issuance_requests`: staged requests with dual-approval fields.
- `cfg_wallets` and `cfgg_wallets`: separate wallet domains.
- `cfg_ledger_accounts`, `cfg_ledger_transactions`, `cfg_ledger_entries`: double-entry ledger foundation with transaction and rate references.

The foundation migration creates schema only. It does not create an issuance, redeem CFG, post ledger entries, move funds, connect payment providers, or enable wallets.

## Required next implementation increments

1. Review this migration in an isolated Supabase development database; do not apply it to production.
2. Add server-only role administration using trusted app metadata / controlled role assignments, not user-editable metadata.
3. Implement immutable ledger posting with deferred debit/credit balancing, idempotency and reversal-only correction.
4. Implement reserve verification, reconciliation and a transactionally enforced 100% backing check before any issuance request can be approved.
5. Implement dual-approval workflow with independent identities and immutable audit history.
6. Implement country readiness evidence, expiry, payment-provider configuration and independent country kill switches.
7. Add read-only Treasury / Reserve dashboard APIs first; write actions remain disabled.
8. Add wallet APIs only after the ledger and authorization tests pass.
9. Add country-specific integration adapters in sandbox mode; no live credentials or production money flows in this phase.

## Security and operational controls

- Financial tables have RLS enabled and no grants to anon/authenticated.
- Only server-side service role can access these foundation tables. Never expose service-role keys to browsers.
- Existing Practice tables and `practice-trade` function remain a separate simulation subsystem.
- Do not deploy, merge, or run these migrations against production without explicit approval.
- Require independent code review, database backup, migration dry-run, security/performance advisors and tested rollback before production schema rollout.
