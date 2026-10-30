# Cashflow Gate — Frontend QA Audit V1

Audit date: 30 October 2026  
Baseline: main at 951f6bbb8f45a8eb44118071ca3ce8ac339a6c24  
Scope: static source review of index.html, styles.css and app.js. This is not a browser/device test.

## Preservation
This audit is additive. No existing source files were changed. Work is on branch `docs/frontend-qa-audit-v1`; `main` remains untouched.

## Existing frontend modules confirmed in source
- Responsive dark-themed market-learning page.
- Market filters for commodities, crypto and forex.
- Browser-only virtual practice buy/close and positions.
- Local-device practice history and reset confirmation.
- Youth market-direction challenge with demo XP.
- ROI scenario calculator with positive, zero and negative examples.
- Agricultural indicative price board.
- Visible disclosures that market data and balances are illustrative and real transactions are not connected.

## Findings requiring attention before calling the frontend production-ready

### F-01 — Market quotes are static demo values (High, known limitation)
The market array in `app.js` contains fixed hard-coded prices and percentage changes. There is no live feed, timestamp, quote freshness or stale-data indicator. Keep the DEMO label prominent. Do not describe these quotes as live prices.

### F-02 — Practice P/L does not receive price movement (Medium)
The inspected source does not update market prices after page load. Since virtual position P/L is calculated from the current in-memory price and entry price, it will normally remain unchanged unless a quote value is changed by another code path. Do not add random price movement merely to make the screen look active. Either connect a licensed/approved feed with timestamps or explicitly describe the practice market as a static-price interaction prototype.

### F-03 — ROI term option "Custom / over 12 months" has no custom duration field (Medium)
The selector offers a custom duration but the source only labels it as a custom duration; it does not collect a number of days/months. Before release, either implement a validated custom-duration input as a separate tested enhancement or rename/disable that option until implemented. Do not calculate an undisclosed term.

### F-04 — Browser localStorage is not an account or trusted ledger (High, known limitation)
Practice state is stored on the device. It can be cleared or modified by the user and does not synchronize across devices. Keep it explicitly labelled local DEMO state; never use it for verified identity, financial balances, investment or payout records.

### F-05 — No authentication, admin console or backend integration evidenced (High, known gap)
The inspected root files do not implement signup/login, server-side profiles, admin permissions, server-side practice records, role-based audit logs or backend integration. The existing `ACCOUNT_BACKEND_PLAN.md` is a plan, not proof that those systems are deployed.

### F-06 — Accessibility and real-device behavior need execution testing (Not yet verified)
Source inspection alone cannot establish screen-reader behavior, keyboard navigation, browser compatibility, mobile tap targets, visual clipping, console errors or performance. Test on Android Chrome, a desktop browser and at least one narrow viewport before public release.

## Safe next actions
1. Run a browser/device QA pass against a preview deployment without changing production.
2. Fix only reproducible defects on a dedicated feature branch.
3. Add automated checks for key practice interactions and responsive layout where feasible.
4. Keep all quote, ROI, balance and XP values visibly marked DEMO until trusted data/backend is implemented.
5. Keep real-money deposits, withdrawals, investor contracts and payouts disabled pending independent technical, legal, accounting and regulatory approval.

## Conclusion
The current frontend is a useful static DEMO prototype, not yet a production-ready live trading or financial platform. The clearest source-level UX issues are static quotes (so no natural P/L movement) and a custom ROI term option without an input for the custom duration. These should be addressed transparently rather than simulated as real market activity.
