# Cashflow Gate — Repository Audit & Public Launch Completion Plan V1

**Audit date:** 30 October 2026  
**Repository:** `MKONDE/cashflow-gate`  
**Audited baseline:** `main` at `951f6bbb8f45a8eb44118071ca3ce8ac339a6c24`  
**Working branch:** `docs/public-launch-audit-v1`  
**Status:** Audit and additive documentation only. No existing application files were changed.

## 1. Preservation guarantee

This document is an additive handover artifact. The existing `main` branch, its HTML, CSS, JavaScript and existing specifications have not been edited. Do not overwrite or delete existing files to implement this plan. All future implementation must use separate feature branches and pull requests, with preview testing before merge. Do not deploy to production without the owner's explicit approval.

Cashflow Gate remains an independent project. Do not merge its database, user accounts, financial records or business logic with Jakay V3 or Maharoos Mini.

## 2. Repository audit snapshot

The repository is private, active, and uses `main` as its default branch. At audit time, the root contains:

- `index.html` — current mobile-first landing/dashboard prototype.
- `styles.css` — dark trading theme with green/gold/blue accents and responsive rules.
- `app.js` — market cards, virtual practice buy/close, local practice history, XP challenge and ROI scenario calculator.
- `README.md` — project description, current limitations and roadmap.
- `ROI_MINING_POOL_ENGINE_V1_SPEC.md` — approved design baseline for the ROI/Mining Pool concept.
- `ACCOUNT_BACKEND_PLAN.md` — proposed secure account and server-side practice-history implementation gate.

Previously merged PRs:
- PR #1: dark mobile-first demo interface.
- PR #2: browser-local persistence and practice activity history.
- PR #3: secure-account and server-history implementation plan.

The existing prototype is a static HTML/CSS/JavaScript application. The current README correctly states that it has no authentication, trusted server ledger, live market feed, payment integration, broker connection or real trading execution.

## 3. What is already present

### Frontend / learning prototype
- Dark mobile-first trading interface.
- Commodity, crypto and forex illustrative watchlist and category filters.
- Virtual practice balance, simulated buy/close, positions and simulated P/L.
- Browser-local persistence for practice state and recent activity.
- Youth market-direction practice challenge with demo XP.
- ROI scenario calculator with positive, zero and negative examples.
- Agricultural indicative price board for rice and maize flour.
- Clear notices that prices and balances are illustrative and no real transaction is active.

### Design specifications
- ROI Fixed, Variable and Hybrid concepts are documented.
- Contract durations include 7, 14 and 21 days; 1–12 months; and custom longer terms.
- Immutable accepted-contract snapshots are specified.
- Market quotes and FX records require source, timestamps and verification status.
- Landed-cost calculations must include transport, packaging, storage, spoilage, taxes, fees and other costs.
- Real investor ledgers require server-side verification, append-only double-entry records, idempotency, audit logs and reconciliation.
- Real-money functions are explicitly gated behind legal, accounting, security and compliance review.

## 4. Important gaps before a full public platform

These are not claims that the current prototype is broken; they are capabilities not yet evidenced as implemented in the audited `main` files.

1. **Backend and accounts:** Supabase or another approved backend is not configured or evidenced. Signup, email verification, password reset, profiles, server-side practice events and tested row-level security are not yet demonstrated.
2. **Trusted practice ledger:** Current state is stored in the visitor's browser. It can be cleared or altered and must not be treated as a verified account balance, XP record or financial record.
3. **Live market data:** Watchlist prices are hard-coded illustrative values. No provider, timestamp, stale-data policy or market-data licence is connected.
4. **Admin console:** No implemented, role-protected Admin Control Center is evidenced for managing projects, quote verification, ROI plan versions, users, moderation or audit review.
5. **Real business-cycle evidence:** No operational workflow is evidenced for project registration, capital allocation, purchase invoices, inventory, production, delivery, sales receipts, expenses and verified net results.
6. **Investor contracts and settlement:** The specification exists, but real contract acceptance, verified funding, settlement, payout requests and immutable ledger implementation are not evidenced.
7. **Payments and withdrawals:** No payment/mobile-money integration or server-side payment verification is evidenced.
8. **Operational controls:** Backups, monitoring, error reporting, rate limiting, incident response, privacy/terms pages and tested recovery procedures need confirmation.
9. **Automated tests:** No test suite or CI checks were evidenced in the root files inspected. Add tests before expanding financial functionality.

## 5. Safe release scope

### Public informational release (can be prepared first)
- Public landing page explaining Cashflow Gate as a digital market-learning and business-trading information platform.
- Existing demo trading and educational challenges, clearly labelled DEMO.
- Agricultural indicative price board with source/verification labels and timestamps when real quotes are later added.
- About, contact, privacy, terms, risk disclosure and help pages.
- Mobile and desktop accessibility, responsive navigation and performance checks.

### Keep disabled until separately approved
- Real-money deposits, withdrawals, investments, investor contracts and payouts.
- Any guaranteed or advertised ROI promise.
- Real broker/exchange execution and cash-prize competitions.
- Any wallet balance presented as withdrawable money without a verified server-side ledger and reconciliation.

A public website launch is not approval to offer regulated investment, securities, collective investment, payment or brokerage services. Obtain qualified Tanzanian legal/regulatory advice and all required permissions before enabling those activities.

## 6. Recommended implementation sequence

### Phase A — preserve and verify the current prototype
- Capture a baseline preview of the current `main` build.
- Test all navigation anchors, filters, practice buy/close, reset confirmation, history persistence and ROI calculator.
- Test small Android screens, tablet and desktop widths.
- Check browser console for errors, keyboard navigation, labels, contrast and accessible status messages.
- Fix only confirmed defects in a dedicated feature branch; do not redesign or remove working modules.

### Phase B — public-safe website completion
- Add About, Contact, Privacy, Terms, Risk Disclosure and Help pages as additive files.
- Clarify demo-data limitations on the landing page and price board.
- Add a visible source/time/verification pattern for any future market quote.
- Add a proper favicon, social preview metadata and a consistent footer.
- Confirm the domain, HTTPS, canonical URL and production build settings.

### Phase C — secure demo accounts
- Create/verify the backend project and configure environment variables in the hosting dashboard only.
- Keep publishable client keys separate from server-only secrets; never commit `.env` or secret keys.
- Implement verified email signup, login, logout and password reset.
- Implement profiles and server-side practice event history.
- Enforce row-level security and test that one user cannot access another user's records.
- Keep demo balances and events isolated from any future real-money ledger.

### Phase D — market intelligence and business evidence
- Add market quote submission, source, observed time, expiry, review status and admin verification.
- Add FX quote source/time and approval state.
- Add landed-cost calculator before ranking trade opportunities.
- Add business-cycle evidence workflow: purchase, inventory, production, transport, sale, costs and reconciled net result.
- Show unverified and stale data distinctly; never call it live or confirmed.

### Phase E — financial/investor capability (separate approval gate)
- Implement versioned plans and immutable accepted-contract snapshots.
- Implement verified funding, append-only double-entry ledger, idempotency and reconciliation.
- Separate principal, projected return, accrued estimate, verified realized profit, pending payout and withdrawable balance.
- Require role-based approvals and audit trails for every sensitive admin action.
- Complete independent security, accounting, legal and regulatory review before any real-money feature is enabled.

## 7. Hosting and deployment decision

The current root application is static and can be hosted on a static hosting service. Namecheap may be suitable for domain registration/DNS and potentially static hosting depending on the exact plan. Do not assume a shared-hosting package supports server functions, background workers, realtime connections or the required backend runtime.

Before selecting the final hosting plan, confirm:
- Whether the Namecheap plan is shared hosting, managed WordPress, VPS or another product.
- Static file deployment method and Git integration.
- HTTPS certificate and automatic renewal.
- Environment variable support if server functions are used.
- Runtime support for API/server functions, scheduled jobs and background processing if required.
- Backup, restore, bandwidth, storage and support limits.

A separate managed backend (for example, Supabase) can serve authentication and database needs while the frontend remains statically hosted. Do not store service-role credentials in frontend code. Do not move to a VPS solely because the platform may later need one; decide from verified runtime requirements.

## 8. Developer rules

1. Never push directly to `main`.
2. Create one focused branch per task.
3. Inspect files and current behavior before editing.
4. Preserve the existing design, working modules and user-approved scope.
5. Do not delete files, replace the application wholesale or introduce unrelated redesigns.
6. Never commit `.env`, API keys, service-role keys, passwords or payment secrets.
7. Add tests and provide a concise change summary.
8. Open a pull request with screenshots/test evidence; do not merge until reviewed.
9. Do not deploy to production without the owner's explicit approval.
10. Do not activate real-money features as part of a visual or demo-only task.

## 9. Acceptance checklist for public-safe release

- [ ] Existing demo behavior is preserved.
- [ ] All visible buttons and navigation links work.
- [ ] Mobile layouts have no clipped or overlapping controls.
- [ ] No browser console errors on supported browsers.
- [ ] Demo-only labels and risk disclosures are visible and understandable.
- [ ] No simulated balance, price, XP or ROI is represented as real.
- [ ] About, Contact, Privacy, Terms, Risk Disclosure and Help are published.
- [ ] HTTPS and domain routing work.
- [ ] No secrets are present in repository history or client bundles.
- [ ] Production deployment has explicit owner approval.
- [ ] Real-money functionality remains disabled until its separate approval gate is complete.

## 10. Audit conclusion

Cashflow Gate has a working static demo foundation and meaningful specifications for the future ROI Mining Pool, agricultural market intelligence and secure account architecture. It is **not yet a complete real-money platform**. The immediate safe target is a polished public informational/demo website, followed by secure demo accounts and evidence-based market/business modules. Real-money investment, ROI, deposits, withdrawals and payouts must remain disabled until the required technical, legal, accounting and regulatory gates are independently satisfied.
