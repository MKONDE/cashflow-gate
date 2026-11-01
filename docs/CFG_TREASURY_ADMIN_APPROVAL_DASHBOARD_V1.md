# CFG Treasury Admin & Approval Dashboard V1

## Purpose
A restricted, authenticated, read-only operations view for Treasury staff. This release adds visibility into the CFG platform state, reserve coverage, supply counters, the latest reserve reconciliation, country readiness and the latest 50 issuance request records.

## Security boundary
- Requires a valid Supabase Auth session and confirmed email.
- The Edge Function verifies the bearer token with Supabase Auth and resolves the active Treasury role from `cfg_admin_roles`; browser metadata is never trusted for authorization.
- The service-role credential remains server-side in the Edge Function environment and is never returned to the browser.
- The endpoint is GET-only and uses no-store response headers.
- No browser-facing approval, rejection, issuance, redemption, deposit, withdrawal, transfer, payout, or balance-editing action exists.
- The dashboard does not change roles, reserve evidence, supply counters, platform state, or country authorization.
- CFG and CFGG remain separate. This view reads CFG Treasury data only.

## Dashboard panels
1. Platform lifecycle, authorized 1B ceiling, USD 1 reference value and real-money disabled state.
2. Verified reserve assets eligible under the conservative policy: company capital / operating surplus, bank cash / bank deposits / short-term government securities, verified evidence no older than seven days, and no future-dated or expired evidence. Encumbrances are deducted.
3. Supply position: cumulative issued, outstanding, redeemed and encumbered CFG.
4. Latest persisted reserve reconciliation snapshot and evidence-staleness count.
5. Up to 50 newest issuance requests, with status, requested amount, two approval timestamps and approval expiry.
6. Country readiness summary.

## Precision
Financial and CFG aggregates are summed in the Edge Function using fixed-scale BigInt arithmetic. No JavaScript floating-point conversion is used for monetary or supply totals. The browser formats database decimal strings without converting them to Number.

## Important interpretation
- An APPROVED issuance request is not issued CFG.
- `cfg_execute_issuance_request` remains a hard-stop.
- The supply position remains zero until a separately reviewed and authorized execution release exists.
- A dashboard value is operational visibility, not proof of bank custody, independent audit, reserve verification, or legal authorization.

## Known boundaries / next review
- This is an audit/read-only dashboard, not a workflow interface for approving issuance. Approval RPCs remain server-role-only and must be called only by a trusted server that derives the actor from the authenticated session, never from an arbitrary browser-supplied user ID.
- The current read service depends on the foundation, operational-state, reserve-reconciliation and issuance migrations being present. It is not expected to work against the existing production database until those migrations are separately reviewed and applied in an isolated test environment.
- Reserve reconciliation snapshots and supply counters need additional append-only / trusted-writer hardening before any production migration or live issuance work.
- Run Deno type checks, Edge Function tests, browser smoke tests, RLS/privilege assertions and transactional database integration tests in a disposable Supabase environment before merge.
- No migrations have been applied to the connected Supabase project by this change. No production deployment or merge is authorized.

## Manual verification checklist
- Unauthenticated visitor sees sign-in only.
- Unconfirmed email is denied.
- User without an active Treasury role is denied.
- Active Treasury Viewer, Financial Controller and Super Admin see only the read-only panels.
- Expired role is denied.
- API rejects non-GET methods and non-allow-listed origins.
- All totals remain exact for large NUMERIC values.
- No secrets or service-role credentials appear in HTML, JavaScript, network payloads or browser storage.
- Dashboard offers no transaction, approval or balance mutation controls.
