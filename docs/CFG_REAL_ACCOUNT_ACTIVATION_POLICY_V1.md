# CFG Real Account Activation Policy V1
**Status:** Approved blueprint policy — documentation baseline  
**Project:** Cashflow Gate (CFG)  
**Applies to:** Real Account, deposits, withdrawals, transfers, investment activation, CFG issuance/redemption, Treasury and customer financial operations  
**Version:** V1

## 1. Purpose

This policy separates **software readiness** from **legal authorization to operate**. CFG development, demo activity, testing, accounting design, security hardening and operational preparation may continue. Real-money or regulated financial activity must remain disabled until the relevant legal, security, financial-control and operational requirements have been evidenced and formally approved.

This document records an approved control policy. It does not certify that CFG currently holds a licence, that any reserve exists, that a payment provider is approved, or that any legal requirement has already been satisfied.

## 2. Mandatory real-money hard stop

Until a documented activation approval is completed:

- Real deposits: **DISABLED**
- Real withdrawals/redemptions: **DISABLED**
- Customer-to-customer real-value transfers: **DISABLED**
- Real investment subscriptions or capital deployment: **DISABLED**
- Real CFG issuance or minting: **DISABLED**
- Real CFG redemption/burning: **DISABLED**
- Custody or safeguarding of customer funds by CFG: **DISABLED**, unless a separately approved lawful arrangement is established.
- Any feature that creates a claim on real money or promises a financial return: **DISABLED**

The restriction must be enforced on the server/API and financial ledger, not merely hidden or disabled in the user interface. Frontend controls alone are not a security boundary.

No developer, Codex agent, administrator, scheduled job, webhook, service key or database client may bypass this hard stop. No feature flag may be switched on in production without the formal approvals in Section 8.

## 3. Functions that may continue

The following may be developed and tested, provided they cannot move, receive, hold or promise real customer funds:

- Demo Account and Practice Account.
- Practice Trading and simulated positions/P&L.
- Clearly labelled virtual CFG balances, with visible “Demo / Practice only — no monetary value” disclosure.
- Youth Challenges and educational simulations.
- Read-only market data and indicative price boards, with source and timestamp labels.
- Marketplace catalogue, product discovery and non-financial user journeys.
- KUZA CAPITAL interface and non-investment simulation only; no live subscriptions, deposits, withdrawals or ROI accrual.
- KYC workflow prototypes using test data or lawfully collected data with appropriate privacy controls.
- Treasury, Reserve, Issuance, Ledger, reconciliation, audit and compliance modules in non-production/test mode.
- Internal QA, security testing, accounting simulations and sandbox payment-provider testing.

A demo counter or animated value must never be represented as earned, withdrawable, guaranteed or real profit.

## 4. Legal and regulatory readiness

Before enabling any real-money function, CFG must obtain a written activity-by-activity legal assessment for Tanzania and every other jurisdiction in which the relevant service will be offered. The assessment must identify the actual legal role CFG will perform and the applicable laws, regulator, licences, approvals, exemptions and contractual arrangements.

At minimum, the review must address:

1. Company registration, ownership, governance, permitted business activities and corporate authority.
2. Whether each proposed activity constitutes payment services, electronic money, money/value transfer, deposit-taking, lending, investment management, securities/collective investment, brokerage, custody, foreign exchange, crypto-asset activity or another regulated activity.
3. Whether Bank of Tanzania licensing, approval, registration, no-objection or use of an appropriately licensed provider is required for each activity. Do not assume that a provider's licence automatically authorizes CFG to perform regulated activities.
4. Applicable AML/CFT and sanctions obligations, including customer due diligence, beneficial-owner checks where applicable, transaction monitoring, suspicious-activity escalation/reporting, record retention and staff responsibilities.
5. Consumer protection, disclosures, complaints handling, fee transparency, refunds, redemption and dispute processes.
6. Personal-data protection, lawful basis, notices, data-subject rights, retention, security, processor contracts and any required registration or regulatory engagement.
7. Tax, accounting, foreign-exchange, cross-border and reporting obligations.
8. Investment/product-specific requirements, including whether an offer, pooled investment, profit-sharing arrangement or return-bearing contract is regulated.

Obtain advice from qualified Tanzanian counsel and engage the relevant regulator(s) where required. A checklist or internal opinion is not a substitute for a required licence or written regulatory approval.

## 5. Security readiness

Before real operations, an independent and documented security review must verify at least:

- Secure authentication, password hashing, MFA for privileged/high-risk access, session controls and account recovery.
- Server-side authorization and least-privilege role separation.
- Database row-level security and restricted service-role access.
- TLS in transit and appropriate encryption/key management at rest.
- Secrets management; no credentials or privileged keys in browser code or repository.
- Server-side financial operations only; no client-side authority to set balances or transaction status.
- Double-entry ledger with atomic posting, immutable financial events, unique references and idempotency.
- Replay, duplicate webhook, race-condition, privilege-escalation and abuse protections.
- Signed/authenticated provider callbacks, callback verification and reconciliation against provider records.
- Append-only audit trails for privileged and financial actions.
- Tested backups, restore procedures, disaster recovery, monitoring and incident response.
- Vulnerability scanning, dependency review, penetration testing and remediation of critical/high findings.
- Dual control for issuance, reserve changes, large-value operations and other designated sensitive actions.

A security test must be performed against the deployed configuration, not only local code. Findings, remediation evidence and retest results must be retained.

## 6. Financial, treasury and operational readiness

Before activation, CFG must demonstrate:

- Approved chart of accounts and accounting policies.
- Separate and clearly defined company, customer, reserve, settlement and partner funds/accounts as required by the approved legal structure.
- A functioning double-entry ledger with reconciliation and exception handling.
- Clear ownership and control of any reserve/backing assets; independently verifiable evidence of balances and liabilities.
- Treasury controls, issuance limits, reserve coverage checks, dual approval and an automatic issuance/transaction pause when required controls fail.
- Clear treatment of customer funds, provider settlement, refunds, chargebacks, failed transfers and unclaimed balances.
- Tested daily reconciliation among CFG records, bank/provider statements and settlement records.
- Defined fees, FX rates, valuation sources, cut-off times and customer disclosures.
- Documented operating procedures, customer support, complaint escalation, incident response and business continuity.
- Trained and assigned accountable personnel, including financial control, compliance, security, operations and independent audit roles.
- A controlled pilot plan, transaction limits, monitoring thresholds and rollback/suspension procedure.

### CFG unit and issuance controls

CFG remains the approved foundational internal platform unit. Do not reintroduce VPT or another unrelated internal denomination. External instruments retain their native quote currencies where appropriate.

The previously approved Treasury, Reserve & Issuance Engine V1 blueprint remains the design baseline, including its supply ceiling, backing and dual-control rules. These blueprint parameters are not evidence of actual backing, issued supply, legal classification or permission to issue. No real issuance is allowed until the legal classification and all reserve/issuance controls have been independently verified and approved.

## 7. Investment and ROI safeguards

KUZA CAPITAL and any other return-bearing or investment-related module must remain simulation-only until the exact product structure is reviewed and authorized as required.

Before any activation:
- Verify the underlying business/project, ownership, assets, contracts, counterparties and cashflows.
- Define how returns and losses arise from genuine business performance.
- Disclose principal risk, liquidity, fees, lock-up, withdrawal conditions and the possibility of loss.
- Do not advertise guaranteed returns, zero risk, guaranteed capital or guaranteed profit unless a lawful and substantiated guarantee arrangement has been independently verified and approved.
- Preserve a signed/versioned contract snapshot for each customer transaction.
- Separate demo calculations from real investment accounting.
- Do not convert an animated demo counter into a financial entitlement.

Legacy demo rates, sample plans and illustrative figures are not approved offers and must not be presented as live investment terms.

## 8. Formal activation gate

Real Account financial functionality may be enabled only when all applicable gates below are complete and evidenced:

| Gate | Required evidence | Accountable reviewer |
|---|---|---|
| Legal classification | Written activity-by-activity legal opinion and required licences/approvals or documented lawful provider model | Qualified counsel / relevant regulator |
| AML/CFT & compliance | Approved policies, assigned compliance owner, tested KYC/monitoring/escalation procedures | Compliance lead / counsel |
| Data protection | Privacy assessment, notices, contracts and applicable registrations/approvals | Data-protection lead / counsel |
| Security | Independent security assessment, closed critical/high findings, retest and sign-off | Independent security auditor |
| Accounting & ledger | Reconciled test evidence, ledger controls, accounting policies and exception handling | Financial Controller / independent accountant |
| Treasury & reserves | Verified reserve evidence, coverage calculations, segregation/control evidence and dual approvals | Financial Controller / independent auditor |
| Operations | SOPs, trained staff, customer support, incident and business-continuity tests | Operations lead |
| Product/customer protection | Approved terms, fees, risk disclosures, refunds, redemption and complaint procedures | Legal / Compliance / Product owner |
| Technical release | Production configuration review, access review, tests, monitoring and rollback plan | Technical lead / security reviewer |
| Owner authorization | Written approval identifying the exact functions, countries, limits and activation date | CFG owner / authorized company governance |

The activation decision must be recorded in an auditable approval register. Approval for one function or country does not automatically approve another function or country. If a gate is not applicable, the reason and approving reviewer must be documented.

## 9. Technical enforcement requirements for implementation

Codex/developers must implement this policy additively and safely:

1. First audit the existing code, database, API routes, webhooks, scheduled jobs, admin actions and environment configuration. Report every path that could create, credit, debit, transfer, redeem or withdraw real value.
2. Do not assume that a UI label or frontend feature flag is sufficient.
3. Introduce or retain a central server-side real-money activation gate with default-deny behavior. Sensitive financial endpoints must independently check the gate and jurisdiction/product permissions.
4. Keep demo/practice ledgers and real financial ledgers logically and access-control separated. Demo funds must never be convertible into real funds by a client request or admin UI shortcut.
5. Enforce the hard stop for all real-money operations until formal activation approval exists.
6. Require auditable, dual-authorized changes to activation settings. No self-approval by the developer who implements the change.
7. Add automated tests proving that deposits, withdrawals, transfers, issuance, redemption and investment activation are rejected while disabled, including direct API calls, replayed callbacks and privileged-role edge cases.
8. Add tests proving demo/practice flows continue to work and cannot post to the real ledger.
9. Document the exact activation controls, environment variables, database policies, endpoints and test evidence.
10. Preserve existing approved CFG architecture and data. No destructive migration, no unnecessary rebuild, no unrelated denomination, and no change to other projects.
11. Work on an isolated feature branch and open a pull request for review. Do not merge, deploy to production, enable real-money functionality or alter production secrets without separate explicit authorization.

## 10. Emergency suspension

If a licence/approval expires or is challenged, reserve coverage fails, reconciliation breaks, a material security incident occurs, fraud is suspected, or a required control stops operating:

- Immediately suspend the affected real-money function.
- Prevent new transactions while preserving records and customer access to required information.
- Protect and reconcile existing obligations under the approved legal and incident-response process.
- Notify responsible governance, legal, compliance and security personnel.
- Make regulatory/customer notifications where legally required.
- Resume only after documented remediation and renewed approval.

## 11. Approval and change control

This V1 policy is an approved CFG blueprint decision. Any amendment that weakens the hard stop, changes the approved Treasury/Reserve/Issuance baseline, enables real-money activity, or changes legal/financial control requirements requires explicit owner approval and documented review.

**Current state:** Blueprint approved; repository documentation being added on an isolated branch. This commit does not implement runtime controls, certify compliance, enable any financial service, merge to `main`, or deploy to production.
