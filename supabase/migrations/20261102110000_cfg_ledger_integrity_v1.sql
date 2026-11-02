-- CFG Ledger Integrity V1
-- Exact double-entry balancing, serialized posting and immutable posted records.
-- No customer payment, issuance, redemption or wallet APIs are enabled.

begin;

create or replace function public.cfg_assert_ledger_transaction_balanced(p_transaction_id uuid)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  entry_count bigint;
  debit_count bigint;
  credit_count bigint;
  unbalanced_count bigint;
  debit_usd numeric(38,8);
  credit_usd numeric(38,8);
begin
  select count(*), count(*) filter (where direction='DEBIT'),
         count(*) filter (where direction='CREDIT'),
         coalesce(sum(usd_equivalent) filter (where direction='DEBIT'),0),
         coalesce(sum(usd_equivalent) filter (where direction='CREDIT'),0)
    into entry_count,debit_count,credit_count,debit_usd,credit_usd
  from public.cfg_ledger_entries where transaction_id=p_transaction_id;

  if entry_count < 2 or debit_count=0 or credit_count=0 then
    raise exception 'Ledger requires at least one debit and one credit' using errcode='23514';
  end if;

  select count(*) into unbalanced_count from (
    select currency_code from public.cfg_ledger_entries
    where transaction_id=p_transaction_id group by currency_code
    having coalesce(sum(amount) filter (where direction='DEBIT'),0)
        <> coalesce(sum(amount) filter (where direction='CREDIT'),0)
  ) q;
  if unbalanced_count > 0 then
    raise exception 'Ledger is not balanced by currency' using errcode='23514';
  end if;
  if debit_usd <> credit_usd then
    raise exception 'USD equivalent totals must balance exactly' using errcode='23514';
  end if;
end;
$$;

create or replace function public.cfg_guard_ledger_transaction()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op='INSERT' then
    if new.status <> 'DRAFT' or new.posted_at is not null then
      raise exception 'Transactions must be created as DRAFT' using errcode='23514';
    end if;
    return new;
  elsif tg_op='DELETE' then
    if old.status <> 'DRAFT' or exists (
      select 1 from public.cfg_ledger_entries where transaction_id=old.id
    ) then
      raise exception 'Only empty DRAFT transactions may be deleted' using errcode='23514';
    end if;
    return old;
  end if;

  if old.status <> 'DRAFT' then
    raise exception 'Posted transactions are immutable; use a separate reversal journal' using errcode='23514';
  end if;
  if new.status='REVERSED' then
    raise exception 'Create a separate reversal journal; do not mark a draft as reversed' using errcode='23514';
  end if;

  if new.status='POSTED' then
    if new.transaction_reference is distinct from old.transaction_reference
       or new.idempotency_key is distinct from old.idempotency_key
       or new.transaction_type is distinct from old.transaction_type
       or new.country_code is distinct from old.country_code
       or new.exchange_rate_snapshot_id is distinct from old.exchange_rate_snapshot_id
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at
       or new.metadata is distinct from old.metadata then
      raise exception 'Transaction details cannot change during posting' using errcode='23514';
    end if;

    perform public.cfg_assert_ledger_transaction_balanced(old.id);

    if new.transaction_type <> 'RESERVE_RECONCILIATION'
       and not exists (
         select 1 from public.cfg_platform_control
         where singleton_id=1 and operational_state='LIVE_AUTHORIZED'
           and real_money_enabled=true
       ) then
      raise exception 'Money-moving posting is disabled before explicit LIVE_AUTHORIZED approval'
        using errcode='55000';
    end if;
    new.posted_at := clock_timestamp();
  elsif new.status <> 'DRAFT' or new.posted_at is not null then
    raise exception 'Invalid ledger transaction state transition' using errcode='23514';
  end if;
  return new;
end;
$$;

create or replace function public.cfg_guard_ledger_entry()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  txid uuid;
  tx_status text;
  account_currency char(3);
  v_account_class text;
  has_cfg boolean;
  has_cfgg boolean;
  excluded_entry_id uuid;
begin
  txid := case when tg_op='DELETE' then old.transaction_id else new.transaction_id end;
  excluded_entry_id := case when tg_op='UPDATE' then old.id else null end;
  if tg_op='UPDATE' and new.transaction_id is distinct from old.transaction_id then
    raise exception 'Entry cannot be moved between transactions' using errcode='23514';
  end if;

  select status into tx_status from public.cfg_ledger_transactions where id=txid for update;
  if not found then raise exception 'Ledger transaction not found' using errcode='23503'; end if;
  if tx_status <> 'DRAFT' then
    raise exception 'Entries in posted transactions are immutable' using errcode='23514';
  end if;
  if tg_op='DELETE' then return old; end if;

  select a.currency_code,a.account_class into account_currency,v_account_class
  from public.cfg_ledger_accounts a
  where a.id=new.account_id;
  if not found then raise exception 'Ledger account not found' using errcode='23503'; end if;
  if account_currency <> new.currency_code then
    raise exception 'Entry currency must match account currency' using errcode='23514';
  end if;

  select coalesce(bool_or(a.account_class='CUSTOMER_CFG'),false),
         coalesce(bool_or(a.account_class='CUSTOMER_CFGG'),false)
    into has_cfg,has_cfgg
  from public.cfg_ledger_entries e
  join public.cfg_ledger_accounts a on a.id=e.account_id
  where e.transaction_id=txid and (excluded_entry_id is null or e.id <> excluded_entry_id);

  if (v_account_class='CUSTOMER_CFG' and has_cfgg)
     or (v_account_class='CUSTOMER_CFGG' and has_cfg) then
    raise exception 'CFG and CFGG ledger domains must remain separate' using errcode='23514';
  end if;
  return new;
end;
$$;

drop trigger if exists cfg_ledger_transaction_guard on public.cfg_ledger_transactions;
create trigger cfg_ledger_transaction_guard
before insert or update or delete on public.cfg_ledger_transactions
for each row execute function public.cfg_guard_ledger_transaction();

drop trigger if exists cfg_ledger_entry_guard on public.cfg_ledger_entries;
create trigger cfg_ledger_entry_guard
before insert or update or delete on public.cfg_ledger_entries
for each row execute function public.cfg_guard_ledger_entry();

create or replace function public.cfg_post_ledger_transaction(p_transaction_id uuid)
returns uuid language plpgsql security definer
set search_path = public, pg_temp
as $$
declare current_status text;
begin
  select status into current_status
  from public.cfg_ledger_transactions where id=p_transaction_id for update;
  if not found then raise exception 'Ledger transaction not found' using errcode='P0002'; end if;
  if current_status='POSTED' then return p_transaction_id; end if;
  if current_status <> 'DRAFT' then
    raise exception 'Only DRAFT transactions can be posted' using errcode='55000';
  end if;
  update public.cfg_ledger_transactions set status='POSTED' where id=p_transaction_id;
  return p_transaction_id;
end;
$$;

revoke all on function public.cfg_assert_ledger_transaction_balanced(uuid) from public,anon,authenticated,service_role;
revoke all on function public.cfg_guard_ledger_transaction() from public,anon,authenticated,service_role;
revoke all on function public.cfg_guard_ledger_entry() from public,anon,authenticated,service_role;
revoke all on function public.cfg_post_ledger_transaction(uuid) from public,anon,authenticated;
grant execute on function public.cfg_post_ledger_transaction(uuid) to service_role;

comment on function public.cfg_post_ledger_transaction(uuid) is
'Service-role-only idempotent ledger posting. Non-reconciliation money movement remains blocked until LIVE_AUTHORIZED and real_money_enabled=true.';
comment on table public.cfg_ledger_entries is
'Double-entry journal. Entries are mutable only while parent is DRAFT; posted entries are immutable and corrected by a separate reversal journal.';

commit;
