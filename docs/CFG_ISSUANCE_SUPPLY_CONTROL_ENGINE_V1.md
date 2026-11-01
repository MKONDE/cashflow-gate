# CFG Issuance & Supply Control Engine V1

## Status
Added as an additive migration on the Treasury implementation branch. Not applied to Supabase, not merged and not deployed. SQL catalog assertions are authored but not executed.

## Workflow
1. An active Financial Controller or Super Admin may create a DRAFT request through the trusted server RPC.
2. An active Financial Controller submits the first approval, attaching a passing reserve reconciliation created within the previous 24 hours.
3. A different active Super Admin submits the second approval.
4. Approval is rejected unless fresh eligible net reserve covers outstanding CFG plus all unexpired approved issuance reservations plus the new request.
5. The same approval transaction checks the authorized 1,000,000,000 ceiling and validates both role assignments and distinct approvers.

Request terms become immutable after creation. Approved, rejected and cancelled requests are terminal. Approved requests expire after 24 hours for reservation accounting; they are not issued CFG.

## Critical safety boundary
- APPROVED means a dual-authorized issuance request only.
- cfg_execute_issuance_request is an explicit hard-stop and always rejects execution in V1.
- No CFG is minted; supply counters are not incremented.
- No ledger issuance journal is posted.
- No deposits, withdrawals, redemption, transfers, agent float or payouts are enabled.
- Real-money enablement remains hard-disabled by the earlier compatibility migration.
- CFG and CFGG remain separate.

## Reserve and supply controls
The approval guard serializes competing approvals, locks platform and supply singleton rows, calculates fresh verified eligible net reserves (seven-day policy, deducting encumbrances), includes current outstanding supply and existing unexpired approved requests, and checks the fixed USD 1:1 reserve requirement. It also enforces the 1B supply ceiling.

## Trust boundary
The RPCs are service_role-only and accept an actor user ID which is checked against cfg_admin_roles. Therefore service-role credentials must remain server-only and must never be exposed to browsers. A future authenticated admin application should derive the actor ID from a verified server-side identity/session, not a client-supplied arbitrary value.

## Test status
SQL catalog/privilege assertions are authored but not executed. Isolated transactional tests still required for dual approval, same-person rejection, inactive/expired roles, stale reserve evidence, concurrent approvals, request immutability, reservation expiry and proof that execution hard-stops without changing supply or ledger.

## Assumptions
- Approved request reservations expire after 24 hours unless a separate review changes policy.
- The existing seven-day reserve evidence freshness policy is reused.
- A recent PASS reconciliation is required as evidence, and the approval guard independently recomputes fresh net reserve coverage under lock.
- No live issuance process is implemented in this slice.
