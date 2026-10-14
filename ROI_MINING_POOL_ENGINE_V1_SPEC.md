# Cashflow Gate — ROI Mining Pool Engine V1 Specification

Status: approved design baseline; implementation must remain disabled for real-money activity until backend, accounting, security, and legal/compliance reviews are complete.

## Product boundaries
- Keep Cashflow Gate independent. Do not merge this project with Jakay V3 or Maharoos Mini.
- Preserve the existing DEMO trading experience. Demo balances and counters are simulated only.
- Real Investor accounts, deposits, withdrawals, investment contracts, and payouts are not active until separately implemented and reviewed.
- Never represent estimated, simulated, stale, or unverified earnings as withdrawable money.

## Investor-facing ROI types
1. Fixed: contract states the agreed calculation and payment obligation, risks, fees, maturity and default handling. A stated rate is not proof of ability to pay.
2. Variable: investor allocation is derived from verified net project results according to the signed contract. Net losses and zero-profit periods must be represented honestly.
3. Hybrid: contract clearly defines each component, its calculation, risk allocation and payment conditions.
- ROI percentages are per whole contract unless the contract explicitly says otherwise. Do not silently annualize or convert a daily rate.
- Never default to a promised 0.5%–5% return. Admin-configured rates require evidence of project economics, approval, disclosures and applicable compliance review.

## Contract terms
- Short-term terms: 7, 14 and 21 days.
- Monthly terms: 1 through 12 months.
- Long terms: over 12 months and configurable custom duration.
- The currently selected example term is 3 months.
- Each accepted contract stores an immutable snapshot/version: investor ID, project ID, principal, currency, ROI type, rate/formula, term, start/maturity timestamps, fees, risk disclosures, loss allocation, withdrawal rules, and acceptance timestamp. Any future change creates a new version and does not silently rewrite an accepted contract.

## Demo counter
- Counter may animate/update every second for display, but it is only a presentation of a deterministic estimate.
- On reload, recompute from server-stored start time and calculation parameters; do not trust a client timer or client balance.
- Label all demo values clearly as DEMO / simulated.
- Keep demo balance, simulated P/L, and real money ledgers in separate tables and code paths.

## Real investor ledger and controls
- Server-side payment verification is required before an investment is marked funded.
- Use append-only double-entry ledger entries, idempotency keys, audit logs, explicit transaction states, and reconciliation.
- Separate principal, estimated return, verified realized return, pending payout, and withdrawable balance.
- No browser-submitted balance, profit, market price, FX rate, or payout amount is authoritative.
- Require role-based permissions for Admin, Country Admin, Market Admin and Super Admin; log every price, rate, plan and contract change.
- Use database row-level security and server-side validation. Never expose service-role or payment secrets in client code.

## Market Price Board and regional trade intelligence
Initial example product: Mbeya Super rice, priced by market and currency. Example prices supplied by the user (not verified live prices): Tanzania TSh 2,000/kg, Kenya KSh 200/kg, Rwanda RWF 2,000/kg. Store them as illustrative/user-entered until verified.
- Each quote stores country, city, market, product/grade, unit, buy/sell price, currency, available quantity, source, quoted_at, valid_until, submitter and verification status.
- Stale or unverified quotes are visibly flagged and excluded from verified recommendations by default.
- Support market locations including Tanzania (Mbeya, Dar es Salaam, Mwanza, Tabora, Dodoma), Kenya (Nairobi, Mombasa, Kisumu), Uganda (Kampala, Jinja), Rwanda (Kigali), Burundi (Bujumbura), and extensible additional markets.
- Exchange-rate records store currency pair, rate, source/provider, observed time, fetched time, effective time and approval state. Show rate timestamps and distinguish indicative FX from executable provider rates.
- Never choose a market by converted sale price alone. Calculate landed cost: purchase cost, packaging, transport, insurance, border/clearing costs, duties/taxes, storage, loss/spoilage, payment/FX spread and fees.
- Compare net margin only for equivalent product grade, unit, quantity, quote freshness and delivery terms. Output best market, net profit estimate, assumptions, FX timestamp and confidence/verification status.

## Agricultural trade examples
Starting products: rice and maize flour (sembe). User-supplied indicative ranges:
- Rice: purchase TSh 1,500–1,800/kg; sale TSh 2,000/kg.
- Sembe: purchase TSh 600–800/kg; sale TSh 1,000–1,200/kg.
Potential throughput: 2 tonnes/day, which must be recorded as a business target/claim until inventory, purchase, sales and delivery evidence verify actual throughput.
- Record stock in kg/tonnes, batch/grade, purchase invoices, sales, inventory losses, and all operating costs.
- ROI Variable calculations use verified project cashflows and contract allocation, not headline gross margin.

## Suggested data entities (schema to be designed and tested before deployment)
- roi_plans, roi_plan_versions
- investor_contracts, contract_acceptances
- agri_projects, product_batches, market_quotes
- fx_quotes, fx_approvals
- trade_orders, inventory_movements, project_cashflows
- roi_calculations, payout_requests
- ledger_accounts, ledger_transactions, ledger_entries
- admin_audit_logs
- demo_sessions, demo_events (strictly separate from real ledgers)

## Build order
1. Add DEMO-only ROI plan comparison, term selector, and counter, visibly labelled simulated.
2. Add market price board with quote freshness and admin review.
3. Add FX quote capture and transparent conversion.
4. Add landed-cost and cross-border net-profit calculator.
5. Design and migrate Supabase schema with RLS and server-side functions; test authorization.
6. Add immutable contract snapshots and verified ledger.
7. Only after independent security, accounting, legal and compliance review, evaluate whether real-money investment functionality may be activated.

## Acceptance criteria
- Demo and Real paths cannot mix balances, events or ledger entries.
- Terms include 7/14/21 days, 1–12 months, and custom terms over 12 months.
- Three-month term is selectable.
- Accepted contract snapshots do not change when an admin edits a plan.
- Every market quote and FX rate shows source and timestamps.
- Market ranking uses net landed profit, not currency conversion alone.
- Unverified/stale prices and estimated returns are never shown as confirmed cash or withdrawable balance.
- Negative or zero project results are supported and shown honestly.
- Role permissions, RLS, audit trails, idempotency and reconciliation tests pass before real money is enabled.
