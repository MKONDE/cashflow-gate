# CFG Reserve Reconciliation Engine V1

## Status
Implemented additively in the Treasury implementation branch. Not applied to Supabase, not merged and not deployed. SQL catalog assertions are authored but not executed.

## Purpose
Reconcile eligible net reserve assets against outstanding CFG at the fixed USD 1 reference value, while retaining the 1,000,000,000 authorized ceiling.

## Conservative V1 policy
- Count only verified BANK_CASH, BANK_DEPOSIT and SHORT_TERM_GOVERNMENT_SECURITY.
- Count only COMPANY_CAPITAL and OPERATING_SURPLUS.
- Exclude CUSTOMER_INVESTMENT, THIRD_PARTY_FUNDS and SYNTHETIC_TEST. Synthetic assets are constrained to reserve_eligible=false.
- Require verification provenance and evidence observation timestamp. Both verification and evidence-observation timestamps must not be future-dated. Future-dated verification evidence is excluded from eligible reserves and classified as insufficient evidence. Existing legacy VERIFIED rows without the new provenance are reset to PENDING/non-eligible on migration, so they must be re-verified before counting.
- Default evidence freshness is seven days; function accepts up to 30 days maximum.
- Expired evidence is excluded.
- Encumbrances are deducted from gross verified reserves.
- Existing unique asset_reference prevents duplicate asset references.
- No valuation/liquidity haircut is added in this slice; authorized human verification must enter conservative values.

## Supply boundary
cfg_supply_position separately tracks issued, outstanding, redeemed and encumbered CFG. Constraints enforce issued_total <= 1 billion, issued_total = outstanding_supply + redeemed_total, and encumbered_supply <= outstanding_supply. Approved requests are not issued supply. Trusted issuance/redemption services must maintain counters in a later reviewed slice.

## Reconciliation
cfg_run_reserve_reconciliation(reference, max_age) serializes reconciliation, locks control/supply singleton rows, calculates gross/encumbered/net eligible reserve and outstanding supply, and records an immutable snapshot. PASS requires net reserves >= outstanding CFG and no stale verified evidence. FAIL means backing is insufficient. INSUFFICIENT_EVIDENCE means at least one verified asset has missing, stale or expired evidence. It does not change supply, approve assets, move funds, issue/redeem CFG or authorize live operation. Only service_role can execute it.

## Assumptions requiring finance/legal review
1. Seven-day evidence freshness is a conservative engineering default, not a legal/accounting standard.
2. Eligible asset classes and funding sources are restricted as listed above.
3. Encumbrances are deducted at their recorded USD value.
4. Evidence authenticity, custody, valuation and verification remain human/control responsibilities.
5. Independent bank confirmation, securities pricing feeds, asset allocation locking and secure supply-counter services are not implemented yet.

## Tests
The SQL file contains catalog/privilege assertions only and has not been executed. Isolated transactional tests remain necessary for covered/undercovered supply, encumbrances, stale evidence, synthetic exclusion, concurrency and reference collisions.

## Safety
No production migration applied, no paid Supabase branch, no real-money feature, and no issuance, deposit, withdrawal, redemption, transfer, payout or agent-float API enabled. CFG and CFGG remain separate.
