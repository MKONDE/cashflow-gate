# Secure Practice Backend V1

This is an additive backend for Cashflow Gate's DEMO / PRACTICE experience only.

## Supabase Edge Function

- Function: `practice-trade`
- Method: `POST`
- JWT verification: required at the Edge Function gateway.
- Requires a valid Supabase user session and a confirmed email.
- Uses the caller's verified auth user ID; the browser cannot choose a user ID.
- Writes through the server-only `record_practice_trade` database function.
- Service-role credentials are read only from Supabase server environment variables and must never be added to browser code or Git.

### Request body

Open a practice position:

```json
{
  "action": "buy",
  "market_symbol": "MAIZE",
  "price": 1200,
  "virtual_units": 2,
  "idempotency_key": "unique-request-id-0001"
}
```

Close a practice position:

```json
{
  "action": "close",
  "market_symbol": "MAIZE",
  "price": 1250,
  "virtual_units": 2,
  "position_id": "position-uuid",
  "idempotency_key": "unique-request-id-0002"
}
```

Send the Supabase access token as `Authorization: Bearer <access_token>`.

## Security boundaries

- Browser users have read-only access to their own practice records under RLS.
- Writes are performed by the Edge Function after JWT and email-confirmation checks.
- The database RPC enforces per-user ownership, positive prices/units, open-position status, exact close units, and idempotency.
- The RPC is executable only by `service_role`.
- The values are illustrative simulation inputs, not live quotes or financial execution.
- No real deposits, withdrawals, investment contracts, payouts, or customer wallet balances are implemented.

## Remaining before public rollout

- Add rate limiting / abuse controls and operational alerting.
- Configure and test Supabase email templates, SMTP delivery, redirect URLs, password reset and verification flows.
- Connect the front end using only the publishable/anon key.
- Add integration tests for signup, confirmation, isolation, duplicate requests, position lifecycle, and secret exposure.
- Keep real-money functions disabled pending separate legal, accounting, security and compliance approval.
