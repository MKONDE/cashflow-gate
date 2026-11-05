# CFG Real Account Runtime Readiness — Gap Audit V1
**Date:** 2026-11-05  
**Project:** Cashflow Gate (CFG)  
**Audit scope:** Current `main` and the open secure-practice-backend proposal  
**Status:** Audit evidence only — no runtime financial feature enabled

## 1. Executive finding

The current `main` branch is a static, browser-only demo. It has no production account backend, no real financial ledger, no payment/deposit/withdrawal endpoints, no investment execution service and no real CFG issuance service. Therefore there is currently no implemented Real Account financial capability to activate.

The safe next step is **not** to invent a real-money account implementation. First complete the approved account/practice backend review and ensure that any future financial backend is built with a default-deny activation control from its first release.

## 2. Evidence inspected

### Current `main`

- `README.md` describes a static prototype and explicitly states that authentication, server-side ledger, payment integration and real trading execution are not connected.
- `index.html` presents a DEMO MODE interface and illustrative virtual balance, simulated ROI and practice trading.
- `app.js` stores practice state in browser `localStorage`; balances, positions, XP and practice history are not authoritative financial records.
- The inspected `main` tree contains no Supabase directory, server routes, Edge Functions, payment webhooks, financial ledger migrations or real account API.
- The current UI still contains VPT denomination labels in `index.html` and `app.js`. This is a separate known consistency issue against the approved CFG foundational unit and should be handled in its own small additive change, not confused with real-money activation.

### Existing open backend proposal

An open draft PR exists: **PR #5 — Add secure Practice backend V1**, from `feature/auth-practice-backend-v1`.

Files inspected on that branch:
- `SECURE_PRACTICE_BACKEND_V1.md`
- `auth.js`
- `supabase-config.js`
- `supabase/functions/practice-trade/index.ts`
- `supabase/migrations/20261101134419_cashflow_gate_accounts_practice_v1.sql`
- `supabase/migrations/20261101134606_secure_practice_trade_rpc_v1.sql`

The proposal is scoped to email-authenticated practice history and simulated practice positions. It uses a JWT-verified Edge Function and a server-only service-role RPC for practice writes. The SQL creates profile and practice tables with RLS; it does not create a real wallet, customer-money ledger, deposits, withdrawals, investment contracts or real CFG issuance.

The PR description reports that a Supabase project, migrations and Edge Function have been provisioned. This audit inspected repository content only; it did **not** independently verify the live Supabase project, deployed function configuration, runtime behavior, RLS in the live database, backups, or provider settings.

## 3. Important findings and review items

1. **No current real-money endpoints found on `main`.** There is no code path in the inspected main tree that can receive or pay out real customer funds.
2. **Practice backend is not a real financial backend.** Practice tables and simulated P/L must never be reused as a customer wallet or financial ledger.
3. **No central Real Account activation gate exists in the inspected main tree.** This is acceptable for the current static demo because there are no real-money endpoints, but it becomes mandatory before any real-money endpoint or financial ledger is introduced.
4. **Practice Edge Function CORS currently allows all origins (`*`).** Before public rollout, restrict allowed origins to approved CFG frontend domains where technically supported, and test preflight behavior. This is a practice-backend hardening item, not evidence of a real-money vulnerability.
5. **Practice request prices are client-supplied simulation inputs.** They must remain clearly labelled as practice inputs and must not be reused for valuation, settlement, investment accounting or real trade execution.
6. **Public/publishable Supabase key in browser config is expected to be public-key material.** Verify that no service-role key, database password or other privileged secret is included in the browser bundle, Git history, logs or deployment variables exposed to the client.
7. **No independent runtime verification was performed.** Live Supabase configuration, email confirmation, two-user isolation, duplicate-request handling, rate limiting, monitoring, restore testing and Vercel Preview behavior still require evidence.

## 4. Required next implementation sequence

### Phase A — Review the existing practice backend PR

- Review PR #5 independently; do not merge it solely because its description reports deployment.
- Confirm live Supabase project ownership and environment separation.
- Verify migration history and actual deployed schema.
- Verify RLS using at least two separate test accounts and direct API attempts.
- Test email verification, login, password reset, sign-out and session expiry.
- Test duplicate idempotency keys, concurrent requests, buy/close lifecycle and ownership isolation.
- Restrict CORS to approved frontend origins.
- Add abuse/rate limiting, monitoring and operational alerts.
- Confirm secrets are never exposed to browser code or committed.
- Run CI and mobile/desktop Preview acceptance checks.
- Keep all operations in DEMO/PRACTICE only.

### Phase B — Prepare a future financial backend design

Only after Phase A is accepted, prepare a separate design for any proposed Real Account infrastructure. It must include:
- Activity-by-activity legal classification and approved provider/licensing model.
- Distinct real financial ledger, never the practice tables.
- Double-entry accounting, atomic posting, idempotency, immutable audit events and reconciliation.
- Server-side default-deny activation gate, product/jurisdiction permissions and dual-authorized activation.
- Treasury/reserve controls, customer-fund safeguarding and independent verification as required by the legal model.
- KYC/AML, privacy, consumer protection, complaints and operational controls.
- Automated negative tests proving every real-money route is rejected while disabled.

No production credentials, live payment provider, real deposits, withdrawals, transfers, investment subscriptions, real issuance or redemption should be configured or enabled during this design phase.

### Phase C — Formal activation gate

Use `CFG_REAL_ACCOUNT_ACTIVATION_POLICY_V1.md` as the governing checklist. A future activation request must identify the exact product, jurisdiction, transaction types, limits, providers, approval evidence, responsible officers and activation date. It must receive separate explicit owner approval after all applicable independent reviews.

## 5. Non-negotiable boundaries

- CFG remains an independent platform; do not merge its ledgers or business logic with Jakay V3 or Maharoos Mini.
- CFG remains the foundational internal platform unit. Do not reintroduce VPT or another unrelated internal denomination.
- Demo/practice funds are not money, deposits, reserves, investment capital or customer liabilities.
- No real-money function may be enabled by frontend-only controls.
- No developer/Codex agent may self-authorize activation.
- Work additively on isolated branches. No destructive migrations, direct main commits, merges or production deployments without separate approval.

## 6. Audit conclusion

**Current readiness:** Static demo / practice prototype.  
**Real Account:** Not implemented on `main`; must remain unavailable.  
**Real deposits, withdrawals, transfers, investment activation, issuance and redemption:** Disabled / not implemented.  
**Recommended next action:** Complete the independent review and testing of the existing Practice Backend V1 draft PR. Do not build or enable real-money functionality yet.

This audit is based on the repository snapshots inspected on 2026-11-05 and must be refreshed before implementation decisions if the branch contents change.
