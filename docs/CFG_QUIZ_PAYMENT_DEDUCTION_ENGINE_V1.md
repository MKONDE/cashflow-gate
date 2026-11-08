# CFG QUIZ PAYMENT & DEDUCTION ENGINE V1
Status: ADDITIVE ARCHITECTURE SPECIFICATION — FUTURE PAYMENT READY / NOT ACTIVATED

Repository: MKONDE/cashflow-gate  
Target PR: #11 — Add CFG Games Hub, Quiz Pot & Plate Simulator V1  
Target branch: feature/cfg-games-prediction-ecosystem-v1

## 1. Purpose and scope

Prepare a Quiz-only payment and paid-add-on architecture for a future release. This document does not authorize implementation of live payment processing, real CFG deductions, wallet changes, payment-provider integrations, database migrations, production activation, or deployment.

This is strictly additive to CFG QUIZ. Do not modify CFG PLAY rules outside Quiz, CFG PREDICT, CFG BET, CFG Core, CFG Wallet, Treasury, Reserve, Issuance, existing payment rails, ROI, or other CFG modules.

## 2. Locked free-trial rules — preserve exactly

The existing standard Quiz attempt remains:
- 10 questions per attempt.
- 60 seconds total standard attempt time.
- 2 points for each correct answer.
- Maximum 20 points per attempt.
- The third incorrect answer ends the attempt immediately.
- Timeout ends the attempt.
- Questions are selected from the Quiz Question Bank.

Paid add-ons must never silently rewrite these standard trial rules. A purchased time extension or additional-play entitlement is an explicit, separately displayed add-on. The standard trial remains available under its existing rules.

Quiz Points remain demo/game points. The existing reference of 1,000 Quiz Points = 0.5 CFG is not a conversion, wallet credit, withdrawal right, or payment balance.

## 3. Question Bank scale and governance

- Preserve the existing generated bank of more than 1,000 questions.
- Design the bank to scale to 5,000–10,000 questions and beyond without changing the 10-question standard attempt rule.
- Support categories, difficulty levels, question status, language, version, and duplicate detection.
- Select a suitable 10-question subset for each attempt; a large bank does not mean 300 or 10,000 questions in one standard attempt.
- Avoid repeated questions for a user where practical, while retaining a safe fallback when a category has insufficient approved questions.
- Custom/admin-submitted questions must be reviewed and approved before becoming available in an authoritative production bank.
- Do not rely on browser localStorage as the authoritative production question bank or score record. Future production play requires server-side question storage, protected answer keys, server-authoritative timing/scoring, access controls, rate limits, anti-abuse controls and audit events.

## 4. Future add-on catalogue and agreed reference prices

The following are proposed product catalogue values for future configuration. They are not live charges.

| Add-on | Price reference | CFG reference |
|---|---:|---:|
| Add 30 seconds to an eligible attempt | TSh 500 | CFG 0.2 |
| Add 1 minute to an eligible attempt | TSh 1,000 | CFG 0.4 |
| Power Quiz | Starting at TSh 500 | Starting at CFG 0.2 |
| Increase daily play allowance | TSh 500 | CFG 0.2 |

Agreed reference relationship: TSh 500 = USD 0.20 = CFG 0.2; therefore TSh 1,000 = USD 0.40 = CFG 0.4. Treat these as user-approved product reference values, not a general FX feed or authority to mint/convert CFG. Any exchange-rate, spread, fees, or country-specific pricing changes require separate approval and transparent display.

Open product details that must remain configurable/unresolved until explicitly approved:
- Power Quiz: confirm whether “300 questions” means a 300-question eligible pool/package or a set of 300 questions to be answered. It must not change the standard 10-question attempt by implication.
- Daily play allowance: confirm that the TSh 500 add-on grants 200 additional plays per day, and define whether this is +200 or a multiplier. Do not implement a default assumption.
- Define when an extension can be purchased/applied (before starting, during an active attempt, or both), whether multiple extensions can stack, and the maximum extension per attempt.
- Define entitlement expiry, refunds/reversals, and whether unused entitlements carry forward.

## 5. Payment methods — CFG is the internal accounting unit

Future user-facing checkout may offer:
1. Pay from an existing available CFG balance.
2. Pay using supported Mobile Money channels, with funds first processed through an approved existing CFG funding/on-ramp flow; after confirmed funding and ledger posting, the Quiz add-on is charged in CFG.

Mobile Money is an external funding method, not a second Quiz wallet or a separate internal accounting unit. The Quiz module must not independently mint CFG, create a parallel wallet, or bypass the approved CFG Financial Engine.

Important dependency: before Mobile Money can credit CFG, verify that an approved, operational CFG on-ramp and its ledger rules already exist. If they do not exist or are not approved for this use, keep the Mobile Money option disabled. Do not invent a conversion or posting route.

## 6. Future deduction flow

For an existing CFG balance:
1. Display the selected add-on, exact CFG price, and any applicable conditions.
2. Check authenticated user, available balance, entitlement eligibility and applicable limits.
3. Obtain explicit confirmation.
4. Submit a uniquely identified, idempotent debit request through the approved CFG ledger/payment service.
5. Only after authoritative debit confirmation, issue the corresponding Quiz entitlement.
6. Record the transaction and entitlement reference for support and reconciliation.

For Mobile Money:
1. Display the external amount, expected CFG reference credit, provider fees (separately and transparently), and final Quiz add-on price.
2. Create a unique payment intent; do not grant an entitlement on a client-side success screen or unverified callback.
3. Verify payment server-to-server with the provider or approved reconciliation process.
4. Route confirmed funds through the approved CFG on-ramp and wait for authoritative CFG ledger posting.
5. Charge the Quiz add-on through the same approved CFG ledger service.
6. Grant the entitlement only after the debit is confirmed.
7. Reconcile payment, CFG funding credit, Quiz debit and entitlement as linked records.

If any stage fails or is pending, do not issue the entitlement. Use an explicit pending/failed state and a controlled reconciliation/refund process. Never deduct twice or grant twice.

## 7. Ledger, integrity and audit requirements

- Use the existing approved CFG Financial Engine and ledger; no Quiz-specific wallet or shadow balance.
- Use unique transaction/payment-intent IDs and idempotency keys.
- Keep immutable references linking external payment, CFG funding credit, Quiz debit and entitlement.
- Record amount, currency, configured price-rule version, user, timestamps, status, provider reference and reversal/refund references.
- Do not silently change historical transaction prices when Admin updates future price rules.
- Show provider charges separately; do not hide them inside the CFG reference price.
- Prevent replay, duplicate callbacks, client-side balance manipulation and entitlement reuse.
- Apply role-based access, rate limits, monitoring and auditable Admin changes.
- Do not treat demo points, Quiz Points or localStorage values as spendable CFG.

## 8. Admin configuration

Future Admin settings may configure:
- Enable/disable each add-on independently.
- Price and price-rule version.
- Eligible Quiz mode and application timing.
- Daily entitlement limits and stacking rules.
- Supported payment methods and country availability.
- Entitlement duration, refund/reversal policy and operational limits.

All changes must be permission-controlled, validated, audited and effective prospectively. Admin configuration must not bypass approved CFG financial controls.

## 9. Current release boundary

For the current PR #11 demo:
- Keep Quiz free-to-play and demo-only.
- Do not display a live checkout or claim that payments are accepted.
- Do not deduct CFG or Mobile Money.
- Do not connect a real wallet or payment provider.
- Do not create or alter database schemas, Supabase configuration, CFG ledger, Treasury, Reserve or Issuance.
- Do not change the existing 10-question, 60-second, 2-points-per-correct, third-wrong-answer and timeout rules.
- Do not merge PR #11 or deploy to production without separate explicit approval.

## 10. Future acceptance gates

Before implementation or activation, require separate approval for:
1. Confirmed Power Quiz 300-question meaning.
2. Confirmed daily +200 plays entitlement semantics.
3. Approved CFG on-ramp availability and ledger posting rules for Mobile Money.
4. Approved payment-provider contracts, callback verification and reconciliation.
5. Server-authoritative Quiz/question/score/entitlement services.
6. Security, abuse, refund, consumer disclosure and applicable legal/compliance review.
7. Test evidence for idempotency, duplicate callbacks, failed/pending payments, reversals and ledger reconciliation.

This specification is a planning artifact only. It does not authorize any live financial operation.
