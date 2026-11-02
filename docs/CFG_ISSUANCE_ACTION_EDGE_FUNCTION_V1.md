# CFG Issuance Action Edge Function V1

## Purpose
Provides an authenticated server-side boundary for the Treasury issuance-request workflow. Browser clients must call this Edge Function; they must never call the service-role-only issuance RPCs directly.

## Authentication and authorization
- Requires a Supabase Auth bearer access token.
- Calls `auth.getUser(token)` and rejects invalid/expired sessions.
- Requires a confirmed email, consistent with the Treasury read endpoint.
- Reads active, unexpired role assignments from `cfg_admin_roles` using the server-side service-role client.
- Controller approval requires `FINANCIAL_CONTROLLER`; Super Admin approval requires `SUPER_ADMIN`.
- Creating a request requires either active `FINANCIAL_CONTROLLER` or `SUPER_ADMIN`.
- The actor UUID passed to SQL is always derived from the verified Auth user. Caller-supplied actor IDs are ignored and are not part of the parsed action contract.
- Service-role credentials remain server-side and are never returned to the browser.

## Supported POST actions
Endpoint: `/functions/v1/cfg-issuance-action`

Create request:
```json
{"action":"create_request","request_reference":"CFG-TRANCHE-001","requested_cfg_amount":"125000.00000000"}
```

Financial Controller approval:
```json
{"action":"controller_approval","request_id":"<request-uuid>","reserve_reconciliation_id":"<passing-reconciliation-uuid>"}
```

Super Admin approval:
```json
{"action":"super_admin_approval","request_id":"<request-uuid>"}
```

The handler validates payload shape, amount precision/range, UUIDs, HTTP method, body size and configured CORS origins. Database constraints remain authoritative and can reject a request even after Edge Function authorization.

## Safety boundaries
- No issuance-execution action is exposed.
- `cfg_execute_issuance_request` remains a database hard-stop.
- Approval is not minting and does not move funds.
- Real-money activity remains disabled.
- The Edge Function has not been deployed to the connected Supabase project. This branch-only implementation requires a separate review and deployment authorization.
- Configure `CFG_ALLOWED_ORIGINS` as a comma-separated allow-list before browser use. An empty value permits no cross-origin browser origin.
- Required runtime secrets are the standard `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; never expose the service-role key in frontend variables.

## Verification
CI runs Deno tests for payload validation and type-checks the Edge Function, alongside the isolated PostgreSQL 17 Treasury migration/catalog/integration suite. These checks do not constitute a live Supabase Auth, deployed Edge Runtime, or production financial-operations test.
