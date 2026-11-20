-- CFG International Payment Engine V1 — additive, fail-closed foundation.
-- Source only: do not apply to production. Live payments remain disabled.
begin;

create table if not exists public.cfg_country_compliance_requirements (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references public.cfg_countries(country_code) on delete restrict,
  requirement_code text not null check (requirement_code ~ '^[a-z][a-z0-9_]{2,63}$'),
  requirement_domain text not null check (requirement_domain in (
    'LICENSING','AML_CFT','SANCTIONS','KYC','PAYMENTS','CONSUMER','TAX',
    'DATA_PROTECTION','SAFEGUARDING','REPORTING','OPERATIONAL_RESILIENCE'
  )),
  required_for text not null check (required_for in (
    'ACCOUNT_OPENING','DEPOSIT','WITHDRAWAL','TRANSFER','PAYOUT','ALL'
  )),
  authority_name text,
  status text not null default 'PENDING'
    check (status in ('PENDING','IN_REVIEW','VERIFIED','REJECTED','EXPIRED')),
  mandatory boolean not null default true,
  evidence_reference text,
  verified_by uuid references auth.users(id) on delete restrict,
  verified_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_code, requirement_code),
  check (status <> 'VERIFIED' or
    (evidence_reference is not null and verified_by is not null and verified_at is not null))
);
create index if not exists cfg_country_compliance_status_idx
  on public.cfg_country_compliance_requirements(country_code, status, valid_until);

create table if not exists public.cfg_country_payment_policies (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references public.cfg_countries(country_code) on delete restrict,
  rail_code text not null check (rail_code ~ '^[A-Z][A-Z0-9_]{1,31}$'),
  currency_code char(3) not null references public.cfg_currencies(currency_code),
  direction text not null check (direction in ('INBOUND','OUTBOUND','BOTH')),
  enabled boolean not null default false,
  minimum_amount numeric(30,8) not null default 0 check (minimum_amount >= 0),
  maximum_amount numeric(30,8) check (maximum_amount is null or maximum_amount > 0),
  daily_limit numeric(30,8) check (daily_limit is null or daily_limit > 0),
  requires_verified_customer boolean not null default true,
  requires_sanctions_screening boolean not null default true,
  tax_policy jsonb not null default '{}'::jsonb check (jsonb_typeof(tax_policy) = 'object'),
  disclosure_version text,
  data_residency_region text,
  policy_version integer not null default 1 check (policy_version > 0),
  approval_reference text,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_code, rail_code, currency_code, direction, policy_version),
  check (maximum_amount is null or maximum_amount >= minimum_amount),
  check (not enabled or
    (approval_reference is not null and approved_by is not null and approved_at is not null))
);

create table if not exists public.cfg_payment_provider_registry (
  id uuid primary key default gen_random_uuid(),
  provider_code text not null unique check (provider_code ~ '^[A-Z][A-Z0-9_]{1,31}$'),
  display_name text not null,
  country_code char(2) not null references public.cfg_countries(country_code) on delete restrict,
  rail_code text not null check (rail_code ~ '^[A-Z][A-Z0-9_]{1,31}$'),
  currency_code char(3) not null references public.cfg_currencies(currency_code),
  direction text not null check (direction in ('INBOUND','OUTBOUND','BOTH')),
  priority integer not null default 100 check (priority >= 0),
  environment text not null default 'SANDBOX' check (environment in ('SANDBOX','LIVE')),
  is_enabled boolean not null default false,
  sandbox_only boolean not null default true,
  supports_idempotency boolean not null default false,
  supports_status_lookup boolean not null default false,
  credential_secret_name text,
  adapter_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (environment <> 'LIVE' or sandbox_only = false),
  check (not is_enabled or
    (supports_idempotency = true and supports_status_lookup = true and credential_secret_name is not null))
);
create index if not exists cfg_payment_provider_route_idx
  on public.cfg_payment_provider_registry(country_code, rail_code, currency_code, direction, is_enabled, priority);

create table if not exists public.cfg_payment_intents (
  id uuid primary key default gen_random_uuid(),
  payment_reference text not null unique,
  idempotency_key text not null unique,
  country_code char(2) not null references public.cfg_countries(country_code) on delete restrict,
  cfg_wallet_id uuid not null references public.cfg_wallets(id) on delete restrict,
  direction text not null check (direction in ('INBOUND','OUTBOUND')),
  rail_code text not null check (rail_code ~ '^[A-Z][A-Z0-9_]{1,31}$'),
  currency_code char(3) not null references public.cfg_currencies(currency_code),
  amount numeric(30,8) not null check (amount > 0),
  status text not null default 'CREATED' check (status in (
    'CREATED','PENDING','PROCESSING','SUCCEEDED','FAILED','UNKNOWN','CANCELLED','REQUIRES_REVIEW'
  )),
  selected_provider_id uuid references public.cfg_payment_provider_registry(id) on delete restrict,
  ledger_transaction_id uuid references public.cfg_ledger_transactions(id) on delete restrict,
  provider_reference text,
  request_fingerprint text not null,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  check (status <> 'SUCCEEDED' or (ledger_transaction_id is not null and selected_provider_id is not null and provider_reference is not null))
);
create index if not exists cfg_payment_intents_status_idx
  on public.cfg_payment_intents(country_code, status, created_at desc);

create table if not exists public.cfg_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null references public.cfg_payment_intents(id) on delete restrict,
  provider_id uuid not null references public.cfg_payment_provider_registry(id) on delete restrict,
  attempt_number integer not null check (attempt_number > 0),
  outcome text not null check (outcome in (
    'PRE_DISPATCH_FAILURE','DECLINED_FINAL','ACCEPTED_PENDING','AMBIGUOUS','SETTLED','FAILED_FINAL'
  )),
  provider_attempt_reference text,
  provider_response_code text,
  failure_category text,
  request_idempotency_key text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  response_fingerprint text,
  unique(payment_intent_id, attempt_number),
  unique(provider_id, provider_attempt_reference),
  check (completed_at is null or completed_at >= started_at)
);
create index if not exists cfg_payment_attempts_intent_idx
  on public.cfg_payment_attempts(payment_intent_id, attempt_number desc);

create table if not exists public.cfg_payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.cfg_payment_provider_registry(id) on delete restrict,
  provider_event_id text not null,
  provider_reference text,
  event_type text not null,
  signature_verified boolean not null default false,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'RECEIVED'
    check (processing_status in ('RECEIVED','PROCESSED','REJECTED','REQUIRES_REVIEW')),
  unique(provider_id, provider_event_id)
);

-- Service-only data domains. No browser role can read, insert, update or execute payment data.
do $$
declare t text;
begin
  foreach t in array array[
    'cfg_country_compliance_requirements','cfg_country_payment_policies',
    'cfg_payment_provider_registry','cfg_payment_intents','cfg_payment_attempts',
    'cfg_payment_webhook_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

-- Preview-only route discovery: only explicitly configured SANDBOX providers are returned.
-- Live providers are intentionally excluded because CFG real-money switches are hard-disabled.
create or replace function public.cfg_list_payment_route_candidates(
  p_country_code char(2),
  p_rail_code text,
  p_currency_code char(3),
  p_direction text
)
returns table (
  provider_id uuid,
  provider_code text,
  display_name text,
  priority integer,
  supports_idempotency boolean,
  supports_status_lookup boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'service_role' then
    raise insufficient_privilege using message = 'Trusted server role required';
  end if;
  if p_direction not in ('INBOUND','OUTBOUND') then
    raise invalid_parameter_value using message = 'Unsupported payment direction';
  end if;

  return query
  select p.id, p.provider_code, p.display_name, p.priority,
         p.supports_idempotency, p.supports_status_lookup
  from public.cfg_payment_provider_registry p
  join public.cfg_country_payment_policies pol
    on pol.country_code = p.country_code
   and pol.rail_code = p.rail_code
   and pol.currency_code = p.currency_code
   and pol.direction in (p_direction, 'BOTH')
   and pol.enabled = true
   and pol.approved_at is not null
   and pol.effective_from <= now()
   and (pol.effective_until is null or pol.effective_until > now())
  join public.cfg_countries c on c.country_code = p.country_code
  join public.cfg_platform_control pc on pc.singleton_id = 1
  where p.country_code = p_country_code
    and p.rail_code = p_rail_code
    and p.currency_code = p_currency_code
    and p.direction in (p_direction, 'BOTH')
    and p.is_enabled = true
    and p.environment = 'SANDBOX'
    and p.sandbox_only = true
    and p.supports_idempotency = true
    and p.supports_status_lookup = true
    and c.operational_state = 'INTERNAL_TEST'
    and c.real_money_enabled = false
    and pc.operational_state = 'INTERNAL_TEST'
    and pc.real_money_enabled = false
    and exists (
      select 1 from public.cfg_country_compliance_requirements required_rule
      where required_rule.country_code = c.country_code
        and required_rule.mandatory = true
        and required_rule.required_for in ('ALL', case when p_direction='INBOUND' then 'DEPOSIT' else 'WITHDRAWAL' end)
    )
    and not exists (
      select 1 from public.cfg_country_compliance_requirements r
      where r.country_code = c.country_code
        and r.mandatory = true
        and r.required_for in ('ALL', case when p_direction='INBOUND' then 'DEPOSIT' else 'WITHDRAWAL' end)
        and (r.status <> 'VERIFIED' or r.verified_at is null
          or (r.valid_until is not null and r.valid_until <= now()))
    )
  order by p.priority asc, p.provider_code asc;
end;
$$;

-- Retry/fallback is safe only after a definitive no-charge result.
-- Timeouts, transport loss after dispatch, accepted/pending and unknown outcomes stop fallback.
create or replace function public.cfg_payment_fallback_is_safe(p_payment_intent_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  intent_status text;
  intent_ledger_id uuid;
  last_outcome text;
begin
  if current_user <> 'service_role' then
    raise insufficient_privilege using message = 'Trusted server role required';
  end if;

  select i.status, i.ledger_transaction_id
    into intent_status, intent_ledger_id
  from public.cfg_payment_intents i
  where i.id = p_payment_intent_id;

  if not found or intent_ledger_id is not null
     or intent_status not in ('CREATED','PENDING','FAILED') then
    return false;
  end if;

  select a.outcome into last_outcome
  from public.cfg_payment_attempts a
  where a.payment_intent_id = p_payment_intent_id
  order by a.attempt_number desc
  limit 1;

  return coalesce(last_outcome in ('PRE_DISPATCH_FAILURE','DECLINED_FINAL'), false)
    and not exists (
      select 1 from public.cfg_payment_attempts a
      where a.payment_intent_id = p_payment_intent_id
        and a.outcome in ('ACCEPTED_PENDING','AMBIGUOUS','SETTLED')
    );
end;
$$;

revoke all on function public.cfg_list_payment_route_candidates(char, text, char, text)
  from public, anon, authenticated;
revoke all on function public.cfg_payment_fallback_is_safe(uuid)
  from public, anon, authenticated;
grant execute on function public.cfg_list_payment_route_candidates(char, text, char, text)
  to service_role;
grant execute on function public.cfg_payment_fallback_is_safe(uuid)
  to service_role;

-- A payment intent cannot be marked successful unless the provider settlement is
-- represented by a verified, processed webhook and a posted, matching CFG ledger journal.
create or replace function public.cfg_guard_payment_success()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $
declare
  ledger_status text;
  ledger_type text;
  ledger_country char(2);
  wallet_leg_total numeric(30,8);
  required_direction text;
begin
  if new.status = 'SUCCEEDED' and (tg_op = 'INSERT' or old.status is distinct from 'SUCCEEDED') then
    if new.ledger_transaction_id is null or new.selected_provider_id is null
       or new.provider_reference is null then
      raise exception 'Successful payment requires provider reference and posted ledger journal'
        using errcode = '23514';
    end if;

    select t.status, t.transaction_type, t.country_code
      into ledger_status, ledger_type, ledger_country
    from public.cfg_ledger_transactions t
    where t.id = new.ledger_transaction_id;

    if ledger_status <> 'POSTED' then
      raise exception 'Payment cannot succeed before its ledger journal is POSTED'
        using errcode = '23514';
    end if;
    if ledger_type <> case when new.direction='INBOUND' then 'DEPOSIT' else 'WITHDRAWAL' end
       or ledger_country is distinct from new.country_code then
      raise exception 'Payment ledger journal type or country does not match intent'
        using errcode = '23514';
    end if;

    required_direction := case when new.direction='INBOUND' then 'CREDIT' else 'DEBIT' end;
    select coalesce(sum(e.amount),0) into wallet_leg_total
    from public.cfg_ledger_entries e
    join public.cfg_ledger_accounts a on a.id=e.account_id
    where e.transaction_id = new.ledger_transaction_id
      and a.cfg_wallet_id = new.cfg_wallet_id
      and e.currency_code = new.currency_code
      and e.direction = required_direction;

    if wallet_leg_total <> new.amount then
      raise exception 'Payment ledger wallet leg must exactly match intent amount and currency'
        using errcode = '23514';
    end if;

    if not exists (
      select 1 from public.cfg_payment_webhook_events w
      where w.provider_id = new.selected_provider_id
        and w.provider_reference = new.provider_reference
        and w.signature_verified = true
        and w.processing_status = 'PROCESSED'
        and w.event_type in ('PAYMENT_SETTLED','PAYOUT_SETTLED')
    ) then
      raise exception 'Payment cannot succeed without a verified and processed provider settlement event'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$;

drop trigger if exists cfg_payment_success_guard on public.cfg_payment_intents;
create trigger cfg_payment_success_guard
before insert or update of status, ledger_transaction_id, selected_provider_id, provider_reference
on public.cfg_payment_intents
for each row execute function public.cfg_guard_payment_success();

revoke all on function public.cfg_guard_payment_success()
  from public, anon, authenticated, service_role;

create or replace function public.cfg_reject_payment_attempt_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $
begin
  raise exception 'Payment attempt records are append-only; record a new attempt or reconciliation event'
    using errcode = '55000';
end;
$;

drop trigger if exists cfg_payment_attempts_append_only on public.cfg_payment_attempts;
create trigger cfg_payment_attempts_append_only
before update or delete on public.cfg_payment_attempts
for each row execute function public.cfg_reject_payment_attempt_mutation();

revoke all on function public.cfg_reject_payment_attempt_mutation()
  from public, anon, authenticated, service_role;

comment on table public.cfg_country_compliance_requirements is
  'Country-scoped, evidence-backed regulatory requirements. A VERIFIED status requires evidence, verifier and timestamp; expired evidence blocks sandbox route preview.';
comment on table public.cfg_country_payment_policies is
  'Country-specific payment rails, currencies, limits, disclosures, tax and data-residency policy. Disabled by default.';
comment on table public.cfg_payment_provider_registry is
  'Provider capability registry. Secrets are referenced by server-side secret name only; no credentials are stored in this table.';
comment on table public.cfg_payment_intents is
  'Idempotent payment intent journal. A SUCCEEDED intent requires a linked posted ledger transaction; no client balance writes.';
comment on table public.cfg_payment_attempts is
  'Append-only provider attempt outcomes. AMBIGUOUS or ACCEPTED_PENDING blocks automatic fallback to prevent duplicate charges.';
comment on table public.cfg_payment_webhook_events is
  'Deduplicated webhook receipt metadata; raw payloads and personal/payment credentials must not be stored here.';
comment on function public.cfg_list_payment_route_candidates(char, text, char, text) is
  'Service-role-only SANDBOX route preview. It never calls a provider or moves funds.';
comment on function public.cfg_payment_fallback_is_safe(uuid) is
  'Service-role-only fallback safety predicate. Returns true only after definitive pre-dispatch failure or provider-confirmed final decline.';

commit;
