-- CFG Ledger Integrity V1 catalog assertions.
-- Execute only after applying the foundation and ledger migration in an isolated database.

do $$
begin
  if not exists (
    select 1 from pg_proc
    where proname = 'cfg_post_ledger_transaction'
      and pg_get_function_identity_arguments(oid) = 'p_transaction_id uuid'
  ) then
    raise exception 'Ledger posting function is missing';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'cfg_ledger_transaction_guard'
      and not tgisinternal
  ) then
    raise exception 'Ledger transaction guard trigger is missing';
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'cfg_ledger_entry_guard'
      and not tgisinternal
  ) then
    raise exception 'Ledger entry guard trigger is missing';
  end if;

  if has_function_privilege('anon', 'public.cfg_post_ledger_transaction(uuid)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.cfg_post_ledger_transaction(uuid)', 'EXECUTE') then
    raise exception 'Browser roles must not execute ledger posting';
  end if;

  if not has_function_privilege('service_role', 'public.cfg_post_ledger_transaction(uuid)', 'EXECUTE') then
    raise exception 'Trusted service role is missing ledger posting execute permission';
  end if;
end;
$$;
