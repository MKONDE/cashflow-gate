-- Cashflow Gate accounts and Practice schema V1.
-- DEMO / PRACTICE only. No real-money ledger or wallet is created.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (
    display_name is null or (char_length(display_name) >= 1 and char_length(display_name) <= 80)
  ),
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'sw', 'fr', 'ln', 'bem', 'zu', 'tsh')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (
    event_type in ('practice_buy', 'practice_close', 'challenge_prediction', 'practice_reset')
  ),
  market_symbol text check (
    market_symbol is null or (char_length(market_symbol) >= 1 and char_length(market_symbol) <= 32)
  ),
  virtual_amount numeric not null default 0 check (virtual_amount >= 0),
  simulated_pnl numeric,
  idempotency_key text not null check (
    char_length(idempotency_key) >= 8 and char_length(idempotency_key) <= 128
  ),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists public.practice_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market_symbol text not null check (char_length(market_symbol) >= 1 and char_length(market_symbol) <= 32),
  entry_price numeric not null check (entry_price > 0),
  virtual_units numeric not null check (virtual_units > 0),
  virtual_cost numeric not null check (virtual_cost > 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_events_user_created_idx
  on public.practice_events (user_id, created_at desc);
create index if not exists practice_positions_user_status_idx
  on public.practice_positions (user_id, status, created_at desc);

alter table public.profiles enable row level security;
alter table public.practice_events enable row level security;
alter table public.practice_positions enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Users can read own practice events" on public.practice_events;
create policy "Users can read own practice events"
  on public.practice_events for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can read own practice positions" on public.practice_positions;
create policy "Users can read own practice positions"
  on public.practice_positions for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.profiles, public.practice_events, public.practice_positions from anon, authenticated;
grant select on public.profiles, public.practice_events, public.practice_positions to authenticated;
grant update (display_name, preferred_language) on public.profiles to authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
