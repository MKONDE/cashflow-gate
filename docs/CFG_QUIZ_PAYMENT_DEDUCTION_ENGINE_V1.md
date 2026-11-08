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

Paid add-ons and paid modes must never silently rewrite these standard trial rules. The standard free trial remains available under its existing rules. Any paid mode with different session structure or timing must be clearly labelled as a separate mode with its own disclosed rules; it must not alter the standard trial.

Quiz Points remain demo/game points. The existing reference of 1,000 Quiz Points = 0.5 CFG is not a conversion, wallet credit, withdrawal right, or payment balance.

## 3. Question Bank scale and governance

- Preserve the existing generated bank of more than 1,000 questions.
- Design the bank to scale to 5,000–10,000 questions and beyond without changing the 10-question standard attempt rule.
- Support categories, difficulty levels, question status, language, version, and duplicate detection.
- Select a suitable 10-question subset for each standard attempt; a large bank does not mean 300 or 10,000 questions in one standard attempt.
- Avoid repeated questions for a user where practical, while retaining a safe fallback when a category has insufficient approved questions.
- Custom/admin-submitted questions must be reviewed and approved before becoming available in an authoritative production bank.
- Do not rely on browser localStorage as the authoritative production question bank or score record. Future production play requires server-side question storage, protected answer keys, server-authoritative timing/scoring, access controls, rate limits, anti-abuse controls and audit events.

## 3A. Student learning categories and subject taxonomy

The Student/Customer Select & Arrange mode must offer a structured subject catalogue. The following categories are the initial approved product direction; Admin may add or organize further subjects without changing the Free Quiz rules.

### A. School subjects and foundational learning
- Biology — Basic Biology, living organisms, cells, human body, plants, animals, ecology and introductory health science.
- Civics — Basic Civics, citizenship, rights and responsibilities, community, public institutions and civic education.
- General Science — basic scientific knowledge, scientific methods, physics, chemistry, earth and environmental science.
- Mathematics — arithmetic, fractions, decimals, percentages, algebra, geometry, measurement and applied problem-solving.
- Geography — physical geography, maps, climate, environment, population and human geography.
- History — local, national, African and world history, with curriculum/level labels where applicable.

### B. English language
- English Basics.
- Grammar and sentence structure.
- Tenses.
- Verbs and verb forms.
- Parts of speech.
- Vocabulary and spelling.
- Reading comprehension.
- Writing, punctuation and composition.
- Literature — literary forms, poetry, prose, drama, themes and comprehension.

### C. Kiswahili language
- Kiswahili sanifu.
- Msamiati.
- Nahau.
- Methali.
- Vitendawili.
- Sarufi na miundo ya sentensi.
- Aina za maneno.
- Fasihi — fasihi simulizi na fasihi andishi.
- Ufahamu, kusoma na kuandika.

### D. Other languages
- Language learning categories can be added for French, Arabic and other supported languages.
- Each language should have its own grammar, vocabulary, reading, writing, comprehension and literature subcategories as appropriate.
- Do not mix question language and subject language accidentally; label both clearly.

### E. Career, work and practical skills
- Career Studies and career awareness.
- Study skills, work readiness and professional skills.
- Communication, teamwork, problem-solving and digital literacy.
- Entrepreneurship and workplace knowledge.

### F. Technical and vocational studies
- Basic engineering and technology.
- Electrical and electronics basics.
- Mechanics and repair skills.
- Construction and building trades.
- ICT, computer fundamentals and digital skills.
- Safety, tools, materials and practical workshop knowledge.

### G. Agriculture and environment
- Crop production and agronomy.
- Soil, water and irrigation.
- Seeds, seedlings and plant care.
- Livestock and poultry.
- Pests, diseases and crop protection.
- Post-harvest handling, storage and value addition.
- Agribusiness, agricultural markets and climate-smart agriculture.
- Environmental conservation and natural resources.

### H. Business and financial literacy
- Business Studies basics.
- Accounting and bookkeeping.
- Marketing, sales and customer service.
- Business planning and entrepreneurship.
- Economics and trade basics.
- Financial literacy, saving, budgeting and responsible money management.
- Supply chain, logistics and cooperative business.

### I. General knowledge and life skills
- General knowledge and current everyday knowledge (with dated/versioned questions where facts may change).
- Health and safety education using reviewed, age-appropriate educational content.
- Environment, society, culture and community knowledge.
- Practical problem-solving and everyday numeracy.

### Taxonomy and learner experience requirements
- Let learners browse by subject, category and subcategory before selecting questions.
- Provide level/difficulty filters such as Beginner/Basic, Intermediate and Advanced; map school grade or curriculum level only when verified.
- Allow the learner to select and arrange questions in their chosen order in Select & Arrange mode, subject to the approved selection limit.
- Show the number of available approved questions in each category; do not offer a category as selectable if its approved bank is empty.
- Support tags for language, subject, topic, level, curriculum/source, question format, review status and last-reviewed date.
- Keep an automatic random question selection option for Power Quiz; do not force learners to manually select questions in that mode.
- Keep the initial free Quiz flow unchanged. These categories enrich the question bank and paid learner mode; they do not alter the standard Free Quiz attempt.
- Questions must be accurate, age/level appropriate, reviewed, and mapped to an identifiable syllabus or reliable learning reference where applicable. Flag curriculum-specific content by country and curriculum rather than presenting it as universal.
- Avoid publishing sensitive or unsafe instructional content as casual quiz material; technical, health and safety questions require suitable review.

## 4. Quiz modes and future add-on catalogue

The following are proposed product catalogue values for future configuration. They are not live charges.

### 4.1 Standard Free Quiz
- 10 questions per attempt.
- 60 seconds total.
- 2 points per correct answer; maximum 20.
- Third incorrect answer ends the attempt; timeout ends the attempt.
- Preserve the existing free/demo behavior.

### 4.2 Power Quiz — 300-question package
- Price starts at TSh 500 (reference CFG 0.2).
- The customer purchases access to a package containing 300 questions.
- Questions are presented automatically and randomly from the approved Question Bank; the customer does not need to manually select and arrange the questions in this mode.
- The 300 questions are a package/question entitlement, not a change to the standard 10-question attempt. The package should be delivered in manageable quiz sessions/rounds; do not assume that all 300 questions must be answered in one sitting or one 60-second attempt.
- Before implementation, the product owner must approve the package expiry, number of questions per round, timing per round, scoring, and whether the standard third-wrong-answer rule applies to each round or the package as a whole. Until then these settings remain configurable/unresolved.
- Random selection must be server-authoritative in production and should minimize repeated questions within the purchased package where the approved bank allows.

### 4.3 Student/Customer Select & Arrange Quiz — TSh 1,000
- A separate, higher-priced mode at TSh 1,000 (reference CFG 0.4).
- Gives the customer/student the freedom to choose questions from available approved categories/topics and arrange the selected questions in their preferred order before starting.
- The customer/student then answers the arranged quiz within a clearly displayed time limit.
- This is a distinct paid mode, not the automatic-random 300-question Power Quiz package.
- Before implementation, approve the allowed selection count, whether difficulty/category filters apply, the time calculation, scoring, answer review behavior, and whether the standard third-wrong-answer rule applies. Do not silently alter the standard free-trial rules.
- Selection must be limited to approved questions; correct answers must never be exposed before or during the attempt.

### 4.4 Time extensions and daily play allowance

| Add-on | Price reference | CFG reference |
|---|---:|---:|
| Add 30 seconds to an eligible attempt | TSh 500 | CFG 0.2 |
| Add 1 minute to an eligible attempt | TSh 1,000 | CFG 0.4 |
| Power Quiz — 300-question package | Starting at TSh 500 | Starting at CFG 0.2 |
| Select & Arrange Quiz mode | TSh 1,000 | CFG 0.4 |
| Increase daily play allowance | TSh 500 | CFG 0.2 |

Agreed reference relationship: TSh 500 = USD 0.20 = CFG 0.2; therefore TSh 1,000 = USD 0.40 = CFG 0.4. Treat these as user-approved product reference values, not a general FX feed or authority to mint/convert CFG. Any exchange-rate, spread, fees, or country-specific pricing changes require separate approval and transparent display.

Daily play allowance detail remains unresolved: confirm whether the TSh 500 add-on grants 200 additional plays per day, and define whether this is +200 or a multiplier. Do not implement a default assumption.

For time extensions, define when an extension can be purchased/applied (before starting, during an active attempt, or both), whether multiple extensions can stack, and the maximum extension per attempt. Entitlement expiry, refunds/reversals, and carry-forward rules also require approval.

## 5. Payment methods — CFG is the internal accounting unit

Future user-facing checkout may offer:
1. Pay from an existing available CFG balance.
2. Pay using supported Mobile Money channels, with funds first processed through an approved existing CFG funding/on-ramp flow; after confirmed funding and ledger posting, the Quiz add-on is charged in CFG.

Mobile Money is an external funding method, not a second Quiz wallet or a separate internal accounting unit. The Quiz module must not independently mint CFG, create a parallel wallet, or bypass the approved CFG Financial Engine.

Important dependency: before Mobile Money can credit CFG, verify that an approved, operational CFG on-ramp and its ledger rules already exist. If they do not exist or are not approved for this use, keep the Mobile Money option disabled. Do not invent a conversion or posting route.

## 6. Future deduction flow

For an existing CFG balance:
1. Display the selected add-on/mode, exact CFG price, and all applicable conditions.
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
- Enable/disable each Quiz mode and add-on independently.
- Price and price-rule version.
- Question package size, session/round size, randomization and approved question categories.
- Select & Arrange mode selection count, category/difficulty filters and time rules.
- Time extension eligibility, stacking and limits.
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
- Do not change the existing standard 10-question, 60-second, 2-points-per-correct, third-wrong-answer and timeout rules.
- Do not merge PR #11 or deploy to production without separate explicit approval.

## 10. Future acceptance gates

Before implementation or activation, require separate approval for:
1. Power Quiz package expiry, round/session size, timing, scoring and wrong-answer handling.
2. Select & Arrange mode question count, timing, scoring and wrong-answer handling.
3. Daily +200 plays entitlement semantics.
4. Approved CFG on-ramp availability and ledger posting rules for Mobile Money.
5. Approved payment-provider contracts, callback verification and reconciliation.
6. Server-authoritative Quiz/question/score/entitlement services.
7. Security, abuse, refund, consumer disclosure and applicable legal/compliance review.
8. Test evidence for idempotency, duplicate callbacks, failed/pending payments, reversals and ledger reconciliation.

This specification is a planning artifact only. It does not authorize any live financial operation.
