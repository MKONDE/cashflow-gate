# KUZA CAPITAL — Gemini HTML Source Review

**Repository:** `MKONDE/cashflow-gate`  
**Review date:** 2026-11-02  
**Source:** Complete HTML document pasted by the project owner in the ChatGPT conversation.  
**Status:** Source reviewed; this document records its values and behavior. The supplied HTML has not been activated or deployed.

## 1. Source features recovered

The supplied source contains a combined two-portal front-end:

### KUZA investor portal
- Dark responsive dashboard using Tailwind CDN, Font Awesome, Google Fonts and Chart.js.
- Investor live-balance ticker and ROI chart.
- Quick deposit amount controls and Mobile Money deposit modal.
- Investment tier cards and growth simulator.
- Active investment contract cards.
- Investor-facing deposit action.

### CFG core portal
- Treasury, Reserve, Payment and Trading/Mining engine status cards.
- Liquidity/yield chart and simulated backend log stream.
- Mobile/desktop portal switcher.

These are UI/demo components only. The source does not include a server, database, authentication, payment provider SDK, signed callback verification, real ledger, or actual CFG Treasury/MFA API integration.

## 2. Exact plan values found in the supplied source

Do not silently change these source values. They are recorded as legacy/demo configuration pending owner approval and verification against the original business model.

| Plan | Duration label | Daily rate shown in source | Minimum | Maximum | Tier |
|---|---:|---:|---:|---:|---:|
| 24 Hours Quick Plan | 24 hours | 0.05% / day | TZS 1,000 | TZS 100,000 | Micro |
| 7 Days Weekly Plan | 7 days | 0.28% / day | TZS 1,000 | TZS 100,000 | Micro |
| 30 Days Monthly Lock | 30 days | 0.29% / day | TZS 100,100 | TZS 1,000,000 | Standard |
| 90 Days Growth Plan | 90 days | 0.33% / day | TZS 100,100 | TZS 1,000,000 | Standard |

Additional source UI values:
- Quick deposit presets: TZS 1,000; 5,000; 10,000; 50,000; 100,000; 500,000.
- Deposit input limits: TZS 1,000–1,000,000.
- Example active contract: INV-849201; TZS 10,000; 0.05% daily; 24-hour duration.
- Example displayed balance: TZS 10,024.8492; example profit: TZS 24.8492.
- Example displayed ticker rate: +0.000142 TZS/sec.
- Example sample CFG display values: treasury TZS 1.84B; reserve TZS 184.05M; 94.2% liquidity; 148.5 GH/s; 1.85% gross yield/day; 99.98% system health; 14ms latency; 1,492 daily payment requests.

The sample CFG metrics are hard-coded illustrative values, not verified operational data.

## 3. Critical defects and misleading claims to correct before public use

1. **Guaranteed return and safety claims:** The source says “ROI Guaranteed”, “Mtaji Salama”, “usalama wa 100%”, “Zero-Loss SLA”, and claims betting losses of 99%. These are unsupported claims and must not be presented as factual promises. Replace with neutral, accurate risk/performance disclosures.
2. **Deposit falsely succeeds:** `processDepositSim()` immediately increases the principal and creates an active contract without contacting a payment gateway or verifying a payment. This must remain disabled/demo-labelled until server-side verified payment confirmation exists.
3. **Unbounded ROI ticker:** `requestAnimationFrame` adds profit continuously and does not stop at contract expiry. It also does not handle loss, suspension, settlement, or business-performance verification.
4. **Contract duration mismatch:** New contracts are always assigned `durationHours: 24`, even for weekly, monthly and 90-day plans.
5. **Simulator duration bug:** `days` is set to 1 for every tier-1 plan and 30 for every tier-2 plan. Therefore the 7-day plan and 90-day plan are not simulated over their labelled durations.
6. **Displayed ROI total inconsistency:** The card multiplies daily rate by 1 for tier 1 and by 30 for tier 2, which does not match all plan durations.
7. **Example profit inconsistency:** TZS 10,000 at 0.05% per day for 12 hours would produce about TZS 2.50 on a simple prorated basis, not the hard-coded TZS 24.8492 example. The example must not be treated as an approved rate or earned profit.
8. **No persistent authoritative state:** User balances, contracts and profits are in JavaScript memory only. Reloading loses them; browser state is not a financial ledger.
9. **Hard-coded operational claims:** Treasury balances, reserve balances, payment request counts, API latency, health, hash rate and log events are static or randomly generated. They must be replaced by verified backend telemetry or visibly labelled demo data.
10. **No payment verification:** A phone number and “STK Push” label do not implement M-Pesa/Tigo Pesa/Airtel Money. No gateway request or callback verification is present.
11. **No administrative or audit engine:** No role-based admin controls, configuration versioning, effective dates, contract term snapshots, or immutable change log exists.
12. **No MFA integration:** No authenticated MFA API client or transaction reconciliation exists.

## 4. Safe preservation and implementation mapping

- Preserve the visual layout, portal switcher, cards, charts, plan labels and exact source values in a clearly labelled **Practice / Preview** presentation.
- Store the four source plans as legacy reference data; do not activate them as real investment offers until the owner confirms the terms and legal/compliance review is complete.
- Separate simulator calculations from real account balances and real contracts.
- Real investment mode must be disabled until identity/eligibility checks, backend ledger, project-level performance evidence, approved contract terms, verified payment callbacks, reconciliation, and Treasury controls are implemented.
- The CFG core dashboard must show actual backend data only when connected; otherwise show “Demo data — not live” and never imply that Treasury, reserves, payment gateways, mining, or monitoring are operational.
- Do not infer that the hard-coded treasury/reserve numbers are approved CFG Treasury V1 values. The approved CFG Treasury & Reserve Engine V1 specification remains authoritative.
- Keep MFA independent and integrate only via its authorized API.

## 5. Recommended next implementation slice

1. Add the supplied investor portal as a visual reference/preview without enabling simulated deposits as real deposits.
2. Correct labels and remove unsupported guaranteed-return, zero-loss, 100%-safe, and fake-operational claims.
3. Preserve all four source plan values as inactive legacy/demo records.
4. Fix simulator duration arithmetic and contract expiry only in Practice mode, with clear hypothetical labels.
5. Add a visible boundary between Practice/Preview and future Real Investment mode.
6. Submit this safe UI slice for review before building real-money backend functionality.

**Conclusion:** The pasted HTML is the missing Gemini-style KUZA CAPITAL reference UI. It recovers the original four plan values and interface structure, but it is a front-end simulation, not a production investment or payment engine. Preserve its design and source values; do not copy its simulated financial behavior or unsupported safety/return claims into production.
