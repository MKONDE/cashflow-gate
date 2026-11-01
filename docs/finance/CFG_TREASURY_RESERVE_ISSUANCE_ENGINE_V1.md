# CASHFLOW GATE (CFG)
# MASTER DEVELOPER SPECIFICATION V1
## MODULE: CFG TREASURY, RESERVE & ISSUANCE ENGINE

**Project:** Cashflow Gate  
**Repository:** MKONDE/cashflow-gate  
**Module:** CFG Treasury, Reserve & Issuance Engine V1  
**Currency Reference Value:** 1 CFG = USD 1  
**Maximum Authorized Supply:** 1,000,000,000 CFG  
**Backing Policy:** 100% Full Backing  
**Governance:** Dual Control  
**Treasury Owner:** CFG Company  
**Approval Roles:** Financial Controller + Super Admin  
**Status:** Approved for technical design and development

---

## 1. CORE DECISION

CFG shall operate as CFG Internal Digital Money.

The approved reference value is:

**1 CFG = USD 1**

The maximum authorized supply is:

**1,000,000,000 CFG**

This is a maximum issuance limit, not an instruction to issue one billion CFG immediately.

CFG must be issued progressively and only against verified eligible reserve funds.

The USD reference value is a product and accounting design decision. The legal currency of issuance, redemption and domestic payment operations must remain configurable until the applicable Bank of Tanzania requirements and approvals have been confirmed.

## 2. IMPORTANT DEFINITIONS

The system must distinguish:

### A. Authorized Supply
Maximum number of CFG units approved by company governance.

Initial cap: 1,000,000,000 CFG.

### B. Issued CFG
Total CFG units that have been validly created through the approved issuance process.

### C. Outstanding CFG
CFG units currently held by customers, agents or other permitted holders.

### D. Verified Reserve
Eligible funds received, confirmed, reconciled and held in the legally appropriate reserve or safeguarding arrangements.

### E. Unissued Capacity
The remaining authorized issuance capacity.

### F. Agent Float
Previously issued CFG allocated to approved agent wallets. Agent float is not new issuance.

## 3. FULL BACKING POLICY

Every issued CFG must be backed at 100% of its USD reference value by eligible reserve assets.

At the approved reference value:

1 CFG = USD 1.

Therefore:

100,000 outstanding CFG requires at least USD 100,000 equivalent eligible reserve.

The reserve calculation must use approved and documented valuation rates for non-USD reserve currencies.

The system must distinguish:

- Verified cash reserve.
- Pending deposits.
- Unsettled payment receipts.
- Restricted funds.
- Investment capital.
- Operating funds.
- Customer funds held under applicable safeguarding arrangements.

Only eligible, reconciled reserve assets may support CFG issuance.

Pending deposits, expected revenue, unrealized investment profits, CFGG valuation increases and unverified agent funds must never count as reserve.

## 4. SUPPLY AND ISSUANCE LIMITS

The issuance engine must enforce:

- Maximum authorized supply: 1,000,000,000 CFG.
- No issuance above the supply cap.
- No issuance above eligible reserve capacity.
- No duplicate issuance.
- No direct database balance editing.
- No issuance by an agent.
- No personal Super Admin wallet as the company's reserve.

The maximum issuable amount must be calculated from:

1. Remaining authorized supply.
2. Eligible verified reserve.
3. Existing outstanding CFG.
4. Approved redemption and settlement obligations.
5. Applicable operational and regulatory restrictions.

The system must prevent issuance whenever any required financial or compliance check fails.

## 5. COMPANY TREASURY ARCHITECTURE

Create a Company Treasury control structure.

The Treasury is a company-controlled financial administration function, not a personal wallet.

Treasury accounts must include:

### A. Reserve Account Records
Records the actual bank, trust, special-account or other legally approved reserve arrangements.

### B. Issuance Control Account
Records authorized supply, issued supply, remaining capacity and issuance approvals.

### C. Company Operational Account Records
Records company operating funds separately from safeguarded customer funds.

### D. Agent Float Control
Tracks CFG allocated to approved agent wallets.

### E. Reconciliation Account
Records differences, adjustments, unresolved transactions and reconciliation status.

The technical ledger must not be treated as proof that bank funds exist. Actual reserve balances must be verified against independent financial statements or approved payment-provider records.

## 6. SUPER ADMIN AND FINANCIAL CONTROLLER

Implement Dual Control.

### Financial Controller
Responsible for:
- Checking incoming reserve funds.
- Reviewing reserve eligibility.
- Verifying backing coverage.
- Reviewing issuance requests.
- Reviewing redemptions.
- Performing reconciliation.
- Preparing financial reports.

### Super Admin
Responsible for:
- Authorizing issuance requests.
- Approving permitted Treasury operations.
- Managing approved financial policies.
- Reviewing audit records.
- Suspending issuance when necessary.

### Dual Approval Rules

No individual may create and approve the same issuance transaction.

The issuance workflow must require:

1. Financial Controller submits or verifies the request.
2. Super Admin reviews and approves it.
3. The system checks supply and backing limits.
4. The issuance engine executes the transaction atomically.
5. The system records the complete audit trail.

Where legally or operationally required, additional approval levels must be supported.

## 7. CFG ISSUANCE WORKFLOW

1. Customer or authorized source sends funds through an approved payment channel.
2. Payment receipt is independently verified.
3. Funds are reconciled.
4. Eligible reserve is updated.
5. Issuance request is created.
6. Financial Controller verifies the backing calculation.
7. Super Admin approves the request.
8. Issuance Engine checks the supply cap and reserve ratio.
9. CFG is issued through an atomic ledger transaction.
10. Customer CFG Wallet is credited.
11. Treasury and issuance reports are updated.
12. A unique receipt and transaction reference are generated.

Issuance must be rejected if the reserve or approval checks fail.

## 8. CUSTOMER CFG WALLET

Each customer must have an individual CFG Wallet.

Wallet balances must distinguish:

- Available CFG.
- Pending CFG.
- Reserved CFG.
- Redeemed CFG.
- Transaction history.

Customer balances must be derived from verified ledger activity.

Customers must not access another customer's wallet or financial records.

## 9. AGENT FLOAT ENGINE

Agents are distributors or service intermediaries, not issuers.

The system must support:

- Agent registration and verification.
- Agent float allocation.
- Agent float balance.
- Agent transaction history.
- Agent float limits.
- Agent settlement.
- Agent suspension.
- Agent reconciliation.

Agent float transfers must move existing CFG between controlled ledger accounts.

A transfer into an agent wallet must never increase total issued CFG.

Agents must not:
- Mint CFG.
- Change CFG valuation.
- Modify reserve records.
- Approve their own float allocations.
- Credit customers outside approved workflows.

## 10. REDEMPTION AND BURN ENGINE

When CFG is redeemed:

1. Customer submits redemption request.
2. System verifies available CFG.
3. Required amount is reserved.
4. Treasury verifies payout capacity.
5. Authorized payout is processed.
6. Payment is reconciled.
7. CFG is marked redeemed and removed from outstanding circulation through an approved burn or redemption accounting process.

The system must preserve historical issuance records.

Burned CFG must not automatically become re-issuable unless the policy and applicable approvals expressly permit reissuance.

## 11. MULTI-CURRENCY SUPPORT

USD remains the reference valuation currency.

Initial supported currencies:

- USD
- TZS
- KES
- RWF
- BIF
- UGX

The system must separately record:

- Reference valuation currency.
- Legal issuance currency.
- Actual deposit currency.
- Reserve currency.
- Customer display currency.
- Payout currency.

Exchange rates must have source, timestamp, effective date and transaction snapshot.

A USD reference value must not automatically authorize USD-denominated domestic electronic money issuance or foreign-currency payments.

Currency settings must be configurable subject to legal approval.

## 12. DATABASE DESIGN

Inspect existing CFG database before adding migrations.

Suggested tables:

- `cfg_treasury_accounts`
- `cfg_reserve_balances`
- `cfg_reserve_movements`
- `cfg_reserve_reconciliations`
- `cfg_issuance_policy`
- `cfg_supply_counters`
- `cfg_issuance_requests`
- `cfg_issuance_approvals`
- `cfg_issuance_transactions`
- `cfg_customer_wallets`
- `cfg_agent_float_accounts`
- `cfg_agent_float_movements`
- `cfg_redemption_requests`
- `cfg_burn_transactions`
- `cfg_financial_audit_logs`
- `cfg_currency_policy`
- `cfg_compliance_controls`

Use:
- Foreign keys.
- Unique transaction references.
- Database constraints.
- Row Level Security.
- Atomic server-side financial functions.
- Double-entry accounting.
- Immutable financial transaction history.

Do not store monetary balances using JavaScript floating-point calculations.

## 13. LEDGER RULES

All issuance, allocation, transfer, redemption and reserve movements must be represented in the double-entry ledger.

The ledger must distinguish:

- Reserve assets.
- Customer CFG liabilities.
- Agent CFG liabilities.
- Issuance control accounts.
- Redemption accounts.
- Fees and approved company income.
- Suspense and reconciliation accounts.

Internal wallet transfers must not change total outstanding CFG.

Every ledger transaction must balance.

Financial corrections must use reversal and replacement entries, not silent edits to historical entries.

## 14. TREASURY DASHBOARD

Admin dashboard must display:

- Authorized supply.
- Issued CFG.
- Outstanding CFG.
- Unissued capacity.
- Verified eligible reserve.
- Required reserve.
- Reserve coverage ratio.
- Reserve currency breakdown.
- Customer wallet totals.
- Agent float totals.
- Pending deposits.
- Pending redemptions.
- Reconciliation differences.
- Issuance history.
- Approval history.

Display a clear warning whenever reserve coverage falls below the approved requirement.

Issuance must automatically pause if backing coverage fails.

## 15. SECURITY AND CONTROL

Mandatory:

- Supabase authentication.
- Role-based access control.
- Row Level Security.
- Server-side financial operations.
- No service-role key in frontend code.
- Two-person issuance approval.
- Idempotency keys.
- Atomic transactions.
- Audit logging.
- Rate limiting.
- Duplicate payment detection.
- Financial reconciliation.
- Secure administrative sessions.
- Immutable transaction records.

No developer, agent or administrator may directly modify customer balances outside the approved ledger workflow.

## 16. REGULATORY AND OPERATIONAL GATE

Before real customer issuance, deposits, redemption or domestic payment operations are activated:

1. Obtain professional legal classification of CFG.
2. Confirm applicable Bank of Tanzania licensing or approval requirements.
3. Confirm the legally permitted currency of issuance.
4. Confirm the required trust or special-account structure.
5. Confirm safeguarding and redemption arrangements.
6. Confirm AML/CFT and customer due-diligence requirements.
7. Confirm foreign-exchange and cross-border payment rules.
8. Confirm accounting, audit and consumer-protection requirements.
9. Confirm payment-provider agreements.
10. Obtain all required approvals.

The software may be developed with these controls, but real-money operations must remain disabled until authorization and operational readiness are confirmed.

## 17. DEVELOPMENT PHASES

### Phase 1 — Existing System Inspection
Inspect CFG repository, database, current wallets and ledger.

### Phase 2 — Treasury Architecture
Design Treasury, reserve and issuance tables.

### Phase 3 — Ledger and Supply Control
Implement double-entry ledger and maximum supply enforcement.

### Phase 4 — Dual Approval
Implement Financial Controller and Super Admin approval workflow.

### Phase 5 — Customer and Agent Wallet Integration
Connect existing wallets and agent float controls without changing Trading UI.

### Phase 6 — Redemption and Reconciliation
Implement redemption, reserve reconciliation and audit reporting.

### Phase 7 — Security Testing
Test role restrictions, backing calculations, duplicate transactions, concurrent issuance and ledger integrity.

### Phase 8 — Controlled Activation
Enable real-money operations only after the required legal and operational approvals.

## 18. ACCEPTANCE CRITERIA

The module is accepted only if:

1. Maximum supply cannot exceed 1 billion CFG.
2. Initial issuance can be zero.
3. CFG issuance requires verified eligible reserve.
4. Every issued CFG is fully backed according to approved policy.
5. USD 1 remains the approved reference value.
6. Currency of legal issuance is configurable.
7. Financial Controller and Super Admin approvals are enforced.
8. No individual can approve their own issuance request.
9. Agent float is not new issuance.
10. Customer and agent balances reconcile to the ledger.
11. Redemption is correctly accounted for.
12. Supply and reserve reports are accurate.
13. All transactions are auditable.
14. Existing CFG Trading UI remains unchanged.
15. Other CFG-independent projects and databases remain untouched.
16. Real-money operations remain disabled until required approvals are confirmed.

## 19. FINAL DEVELOPER INSTRUCTION

Work only in `MKONDE/cashflow-gate`.

First inspect the current repository and database.

Do not begin by changing existing production data.

Create a separate feature branch.

Present the architecture and proposed database migrations before implementation.

Do not merge into `main`.

Do not deploy to production.

Do not activate real-money issuance, deposits, transfers or redemption without explicit authorization.

**FINAL BUSINESS PRINCIPLE**

CFG is company-controlled Internal Digital Money with a USD 1 reference value, a maximum authorized supply of one billion units, 100% verified backing and dual-control issuance.

The Company Treasury controls the financial records. Super Admin and Financial Controller share approval responsibilities. No individual owns the float.

**END OF SPECIFICATION**