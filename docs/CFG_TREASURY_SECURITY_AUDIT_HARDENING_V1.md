# CFG Treasury Security & Audit Hardening V1

## Added controls
- Append-only `cfg_treasury_audit_events` table with row-level before/after JSON snapshots for changes to platform control, admin roles, reserve assets, issuance requests and reconciliation records.
- Audit events capture the database JWT subject and JWT role when present. A missing actor claim remains NULL; it is not guessed.
- The read-only Treasury Edge Function exposes only audit event metadata (not before/after JSON payloads), and the dashboard displays the latest 100 events.
- Audit events cannot be updated or deleted through normal SQL operations. Browser roles have no access; service_role has SELECT only.
- Reserve assets cannot be physically deleted. Evidence can be retained and marked EXPIRED or REJECTED.
- Reserve reconciliation snapshots reject UPDATE and DELETE.
- Service role has SELECT only on reserve reconciliation snapshots and supply counters. It cannot directly insert/update/delete/truncate either table.
- Reconciliation now runs through a SECURITY DEFINER RPC with a fixed search_path and remains executable only by service_role. It creates the immutable snapshot internally.
- Supply counters remain frozen at initialized values until a separately reviewed issuance/redemption writer exists.

## Important security boundary
Supabase service_role is a highly privileged server credential. It must never be exposed in browser code, client storage, public logs, or user-controlled environments. These grants reduce accidental direct DML, but they do not protect against compromise of the database owner, migration owner, or privileged server environment.

## Audit interpretation
The audit log is a database change trail, not an independent tamper-proof ledger. A database owner or sufficiently privileged operator can alter database objects or backups. Production-grade evidence retention should additionally export audit events to independently controlled immutable/WORM storage with monitoring and access separation.

## Explicitly not enabled
- No issuance or redemption.
- No balance edits or wallet movements.
- No deposits, withdrawals, transfers, investment payouts or custody.
- No live authorization.
- No direct supply-counter mutation.

## Verification status
The SQL catalog/privilege assertions are authored but have not been executed. No Deno, SQL integration, browser, or isolated Supabase tests have been run. No migration has been applied to the connected Supabase project. No paid Supabase branch was created. PR #7 remains Draft and unmerged.
