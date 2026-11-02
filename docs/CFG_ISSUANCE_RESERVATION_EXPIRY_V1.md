# CFG Issuance Reservation Expiry V1

## Status
Implemented additively on `feat/cfg-treasury-engine-implementation-v1`. Not merged, not applied to Supabase, and not deployed.

## Rules
- An issuance request approved by two distinct active roles reserves reserve and lifetime supply capacity for 24 hours.
- Once `approval_expires_at <= now()`, the controlled expiry RPC may transition the request from `APPROVED` to `EXPIRED`.
- Expired requests no longer count as active reserve or supply reservations. They do not change issued supply, outstanding supply, redeemed supply, or move funds.
- Expiry is an auditable status transition. The original request terms and approvals remain unchanged.
- `EXPIRED` is terminal and cannot be edited, re-approved, or directly selected from a non-approved state.
- Only `service_role` can execute `cfg_expire_issuance_requests()`. Browser roles cannot execute it.
- The expiry function takes no caller-supplied timestamp; it uses database `now()`.

## Concurrency and audit
- The expiry RPC uses the same transaction advisory lock as issuance approvals.
- The existing Treasury audit trigger records the status transition.
- A future scheduler may invoke the RPC periodically, but no scheduler or automation is enabled in this change.

## Tests
- Isolated SQL assertions check the expiry RPC exists and is service-role-only.
- Disposable transactional tests create an already-expired approved fixture, run the RPC, verify the EXPIRED state, and verify that the released reservation no longer blocks a subsequent approval.
- The isolated PostgreSQL 17 workflow applies this migration after the existing Treasury hardening migration.

## Safety
- Issuance execution remains a hard-stop.
- No CFG is minted, no reserve asset is changed, no money moves, and real-money operations remain disabled.
- Do not apply this migration to the connected or production Supabase database until separately reviewed and explicitly approved.
