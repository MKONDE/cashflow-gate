-- Cashflow Gate International Treasury & Country Foundation V1
-- Additive schema only. Do NOT apply to production until reviewed in an isolated DB.
-- No deposits, withdrawals, issuance, redemption, payouts, or custody APIs are enabled.

create table if not exists public.cfg_platform_control (
  singleton_id smallint primary key default 1 check (singleton_id = 1),
  operational_state text not null default 'DEVELOPMENT'
    check (operational_state in ('DEVELOPMENT','INTERNAL_TEST','COUNTRY_READINESS','LIVE_AUTHORIZED')),
  authorized_supply_ceiling numeric(30,8) not null default 1000000000
    check (authorized_supply_ceiling = 1000000000),
  reference_value_usd numeric(20,8) not null default 1
    check (reference_value_usd = 1),
  required_reserve_ratio numeric(12,8) not null default 1
    check (required_reserve_ratio = 1),
  real_money_enabled boolean not null default false
    check (real_money_enabled = false),
  updated_at timestamptz not null default now()
);

insert into public.cfg_platform_control(singleton_id)
values (1) on conflict (singleton_id) do nothing;

create table if not exists public.cfg_currencies (
  currency_code char(3) primary key,
  currency_name text not null,
  minor_unit_digits smallint not null default 2 check (minor_unit_digits between 0 and 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.cfg_currencies(currency_code,currency_name,minor_unit_digits)
values ('USD','US Dollar',2),('TZS','Tanzanian Shilling',2)
on conflict (currency_code) do nothing;

create table if not exists public.cfg_countries (
  country_code char(2) primary key,
  country_name text not null,
  local_currency_code char(3) not null references public.cfg_currencies(currency_code),
  operational_state text not null default 'DEVELOPMENT'
    check (operational_state in ('DEVELOPMENT','INTERNAL_TEST','COUNTRY_READINESS','LIVE_AUTHORIZED')),
  real_money_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (real_money_enabled = false or operational_state = 'LIVE_AUTHORIZED')
);

create table if not exists public.cfg_country_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references public.cfg_countries(country_code) on delete restrict,
  check_code text not null check (check_code in (
    'legal_opinion','licensing','aml_cft','sanctions_controls','safeguarding',
    'custody','payments','consumer_protection','disclosures','tax','data_protection',
    'complaints','regulatory_reporting','operational_resilience'
  )),
  status text not null default 'PENDING'
    check (status in ('PENDING','IN_REVIEW','VERIFIED','REJECTED','EXPIRED')),
  evidence_reference text,
  verified_by uuid references auth.users(id) on delete restrict,
  verified_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_code,check_code),
  check ((status <> 'VERIFIED') or (verified_by is not null and verified_at is not null))
);

create table if not exists public.cfg_country_live_authorizations (
  country_code char(2) primary key references public.cfg_countries(country_code) on delete restrict,
  financial_controller_id uuid not null references auth.users(id) on delete restrict,
  super_admin_id uuid not null references auth.users(id) on delete restrict,
  authorization_reference text not null,
  approved_at timestamptz not null default now(),
  expires_at timestamptz,
  check (financial_controller_id <> super_admin_id)
);

create table if not exists public.cfg_exchange_rate_snapshots (
  id uuid primary key default gen_random_uuid(),
  base_currency char(3) not null references public.cfg_currencies(currency_code),
  quote_currency char(3) not null references public.cfg_currencies(currency_code),
  rate numeric(30,12) not null check (rate > 0),
  source_name text not null,
  provider_reference text,
  observed_at timestamptz not null,
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check (base_currency <> quote_currency)
);
create index if not exists cfg_exchange_rate_pair_time_idx
  on public.cfg_exchange_rate_snapshots(base_currency,quote_currency,observed_at desc);

create table if not exists public.cfg_reserve_assets (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null check (asset_type in ('BANK_CASH','BANK_DEPOSIT','SHORT_TERM_GOVERNMENT_SECURITY')),
  funding_source text not null check (funding_source in ('COMPANY_CAPITAL','OPERATING_SURPLUS','CUSTOMER_INVESTMENT','THIRD_PARTY_FUNDS')),
  reserve_eligible boolean not null default false,
  institution_name text not null,
  asset_reference text not null unique,
  currency_code char(3) not null references public.cfg_currencies(currency_code),
  face_value numeric(30,8) not null check (face_value > 0),
  verified_usd_value numeric(30,8),
  verification_status text not null default 'PENDING'
    check (verification_status in ('PENDING','VERIFIED','REJECTED','EXPIRED')),
  verified_by uuid references auth.users(id) on delete restrict,
  verified_at timestamptz,
  evidence_reference text,
  valuation_snapshot_id uuid references public.cfg_exchange_rate_snapshots(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (funding_source not in ('CUSTOMER_INVESTMENT','THIRD_PARTY_FUNDS') or reserve_eligible = false),
  check (verification_status <> 'VERIFIED' or (
    reserve_eligible = true and verified_usd_value is not null and verified_usd_value > 0
    and verified_by is not null and verified_at is not null and evidence_reference is not null
  ))
);
create index if not exists cfg_reserve_assets_verified_idx
  on public.cfg_reserve_assets(verification_status,reserve_eligible);

create table if not exists public.cfg_issuance_requests (
  id uuid primary key default gen_random_uuid(),
  request_reference text not null unique,
  requested_cfg_amount numeric(30,8) not null check (requested_cfg_amount > 0),
  required_reserve_usd numeric(30,8) not null check (required_reserve_usd > 0),
  status text not null default 'DRAFT'
    check (status in ('DRAFT','PENDING_CONTROLLER','PENDING_SUPER_ADMIN','APPROVED','REJECTED','CANCELLED')),
  financial_controller_id uuid references auth.users(id) on delete restrict,
  financial_controller_approved_at timestamptz,
  super_admin_id uuid references auth.users(id) on delete restrict,
  super_admin_approved_at timestamptz,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (financial_controller_id is null or super_admin_id is null or financial_controller_id <> super_admin_id),
  check (status <> 'APPROVED' or (
    financial_controller_id is not null and financial_controller_approved_at is not null
    and super_admin_id is not null and super_admin_approved_at is not null
    and financial_controller_id <> super_admin_id
  ))
);

-- Customer wallets are separate physical data domains. No balances are stored here;
-- available balances must be derived from immutable, posted double-entry ledger entries.
create table if not exists public.cfg_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  country_code char(2) not null references public.cfg_countries(country_code),
  currency_code char(3) not null references public.cfg_currencies(currency_code),
  status text not null default 'RESTRICTED' check (status in ('RESTRICTED','ACTIVE','SUSPENDED','CLOSED')),
  created_at timestamptz not null default now(),
  unique(user_id,country_code,currency_code)
);

create table if not exists public.cfgg_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  country_code char(2) not null references public.cfg_countries(country_code),
  currency_code char(3) not null references public.cfg_currencies(currency_code),
  status text not null default 'RESTRICTED' check (status in ('RESTRICTED','ACTIVE','SUSPENDED','CLOSED')),
  created_at timestamptz not null default now(),
  unique(user_id,country_code,currency_code)
);

create table if not exists public.cfg_ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  account_code text not null unique,
  account_class text not null check (account_class in ('CUSTOMER_CFG','CUSTOMER_CFGG','COMPANY_TREASURY','VERIFIED_RESERVE','FEES','CLEARING')),
  cfg_wallet_id uuid references public.cfg_wallets(id) on delete restrict,
  cfgg_wallet_id uuid references public.cfgg_wallets(id) on delete restrict,
  country_code char(2) references public.cfg_countries(country_code),
  currency_code char(3) not null references public.cfg_currencies(currency_code),
  created_at timestamptz not null default now(),
  check (not (cfg_wallet_id is not null and cfgg_wallet_id is not null)),
  check ((account_class <> 'CUSTOMER_CFG' or (cfg_wallet_id is not null and cfgg_wallet_id is null))),
  check ((account_class <> 'CUSTOMER_CFGG' or (cfgg_wallet_id is not null and cfg_wallet_id is null))),
  check ((account_class not in ('COMPANY_TREASURY','VERIFIED_RESERVE','FEES','CLEARING') or (cfg_wallet_id is null and cfgg_wallet_id is null)))
);

create table if not exists public.cfg_ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_reference text not null unique,
  idempotency_key text not null unique,
  transaction_type text not null check (transaction_type in (
    'ISSUANCE','REDEMPTION','CUSTOMER_TRANSFER','AGENT_TRANSFER','DEPOSIT','WITHDRAWAL',
    'FEE','RESERVE_RECONCILIATION','CFGG_OPERATION','ADJUSTMENT'
  )),
  country_code char(2) references public.cfg_countries(country_code),
  status text not null default 'DRAFT' check (status in ('DRAFT','POSTED','REVERSED')),
  exchange_rate_snapshot_id uuid references public.cfg_exchange_rate_snapshots(id) on delete restrict,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.cfg_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.cfg_ledger_transactions(id) on delete restrict,
  account_id uuid not null references public.cfg_ledger_accounts(id) on delete restrict,
  direction text not null check (direction in ('DEBIT','CREDIT')),
  currency_code char(3) not null references public.cfg_currencies(currency_code),
  amount numeric(30,8) not null check (amount > 0),
  usd_equivalent numeric(30,8) not null check (usd_equivalent > 0),
  exchange_rate_snapshot_id uuid references public.cfg_exchange_rate_snapshots(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists cfg_ledger_entries_transaction_idx on public.cfg_ledger_entries(transaction_id);
create index if not exists cfg_ledger_entries_account_idx on public.cfg_ledger_entries(account_id,created_at desc);

-- No public/client access to financial or readiness tables. Service APIs must be added
-- separately with explicit role checks, approval workflow and idempotency controls.
do $$
declare t text;
begin
  foreach t in array array[
    'cfg_platform_control','cfg_currencies','cfg_countries','cfg_country_readiness_checks',
    'cfg_country_live_authorizations','cfg_exchange_rate_snapshots','cfg_reserve_assets',
    'cfg_issuance_requests','cfg_wallets','cfgg_wallets','cfg_ledger_accounts',
    'cfg_ledger_transactions','cfg_ledger_entries'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant all on table public.%I to service_role',t);
  end loop;
end $$;

-- Explicitly prevent the global control row from enabling real money in this foundation release.
comment on table public.cfg_platform_control is
  'CFG platform guardrails. Real-money enablement is hard-disabled in V1 foundation; do not alter outside a separately reviewed authorization release.';
comment on table public.cfg_wallets is 'CFG customer wallet domain. Never combine with CFGG.';
comment on table public.cfgg_wallets is 'CFGG customer wallet domain. Never combine with CFG.';
comment on table public.cfg_ledger_entries is 'Append-only double-entry ledger foundation; write APIs and balancing enforcement are a separate gated implementation step.';


-- Database-level country launch gate. LIVE_AUTHORIZED requires all current readiness
-- evidence and two distinct approvers. This is a technical gate, not legal advice.
create or replace function public.cfg_guard_country_live_authorization()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  verified_count integer;
  authorization_exists boolean;
begin
  if new.operational_state = 'LIVE_AUTHORIZED' or new.real_money_enabled then
    select count(*) into verified_count
    from public.cfg_country_readiness_checks
    where country_code = new.country_code
      and status = 'VERIFIED'
      and verified_by is not null
      and verified_at is not null
      and (expires_at is null or expires_at > now());

    if verified_count <> 14 then
      raise exception 'Country cannot be LIVE_AUTHORIZED: all 14 readiness checks must be verified and current'
        using errcode = '23514';
    end if;

    select exists (
      select 1 from public.cfg_country_live_authorizations a
      where a.country_code = new.country_code
        and a.financial_controller_id <> a.super_admin_id
        and (a.expires_at is null or a.expires_at > now())
    ) into authorization_exists;

    if not authorization_exists then
      raise exception 'Country cannot be LIVE_AUTHORIZED without distinct Financial Controller and Super Admin authorization'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists cfg_country_live_authorization_guard on public.cfg_countries;
create trigger cfg_country_live_authorization_guard
before insert or update of operational_state, real_money_enabled
on public.cfg_countries
for each row execute function public.cfg_guard_country_live_authorization();

-- Issuance requests cannot reach APPROVED unless the request itself is fully
-- reserve-covered, cumulative approved requests remain within verified reserves,
-- and cumulative approved issuance requests remain below the authorized ceiling.
create or replace function public.cfg_guard_issuance_approval()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  verified_reserve_usd numeric(30,8);
  already_reserved_usd numeric(30,8);
  already_approved_cfg numeric(30,8);
begin
  if new.status = 'APPROVED' and (tg_op = 'INSERT' or old.status <> 'APPROVED') then
    if new.required_reserve_usd < new.requested_cfg_amount then
      raise exception 'Required reserve must cover 100 percent of CFG at USD 1 reference value'
        using errcode = '23514';
    end if;

    select coalesce(sum(verified_usd_value),0) into verified_reserve_usd
    from public.cfg_reserve_assets
    where verification_status = 'VERIFIED'
      and reserve_eligible = true
      and funding_source in ('COMPANY_CAPITAL','OPERATING_SURPLUS')
      and (verified_at is not null);

    select coalesce(sum(required_reserve_usd),0),
           coalesce(sum(requested_cfg_amount),0)
      into already_reserved_usd, already_approved_cfg
    from public.cfg_issuance_requests
    where status = 'APPROVED'
      and id <> new.id;

    if verified_reserve_usd < already_reserved_usd + new.required_reserve_usd then
      raise exception 'Issuance approval blocked: verified eligible reserves do not cover cumulative approved requests'
        using errcode = '23514';
    end if;

    if already_approved_cfg + new.requested_cfg_amount > 1000000000 then
      raise exception 'Issuance approval blocked: authorized CFG supply ceiling would be exceeded'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists cfg_issuance_approval_guard on public.cfg_issuance_requests;
create trigger cfg_issuance_approval_guard
before insert or update of status, requested_cfg_amount, required_reserve_usd
on public.cfg_issuance_requests
for each row execute function public.cfg_guard_issuance_approval();

revoke all on function public.cfg_guard_country_live_authorization() from public, anon, authenticated;
revoke all on function public.cfg_guard_issuance_approval() from public, anon, authenticated;
